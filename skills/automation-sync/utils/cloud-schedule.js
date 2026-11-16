const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function recurrence(schedule) {
  if (schedule.kind === 'at') return null;
  if (schedule.kind === 'in') throw new Error('cloud-schedule-relative-unsupported:use-at');
  if (schedule.kind === 'every') {
    if (schedule.seconds < 3600) throw new Error('cloud-schedule-minimum-interval:1h');
    if (!Number.isSafeInteger(schedule.seconds) || schedule.seconds % 60 !== 0)
      throw new Error('cloud-schedule-precision-unsupported:use-whole-minutes');
    const hours = schedule.seconds % 3600 === 0;
    return `FREQ=${hours ? 'HOURLY' : 'MINUTELY'};INTERVAL=${schedule.seconds / (hours ? 3600 : 60)};BYSECOND=0`;
  }
  if (schedule.kind !== 'cron' || !schedule.fields)
    throw new Error('cloud-schedule-kind-unsupported');
  if (schedule.times) throw new Error('cloud-schedule-times-unsupported');
  const f = schedule.fields;
  // Two minute values within any selected hour necessarily violate the hourly limit.
  if (f.minutes.length !== 1) throw new Error('cloud-schedule-minimum-interval:1h');
  if (!f.dayWildcard && !f.weekdayWildcard)
    throw new Error('cloud-schedule-day-union-unsupported:day-of-month-or-weekday');
  const frequency = f.days.length < 31 ? 'MONTHLY' : f.weekdays.length < 7 ? 'WEEKLY' : 'DAILY';
  return [
    `FREQ=${frequency}`,
    `BYHOUR=${f.hours.join(',')}`,
    `BYMINUTE=${f.minutes[0]}`,
    'BYSECOND=0',
    ...(f.days.length < 31 ? [`BYMONTHDAY=${f.days.join(',')}`] : []),
    ...(f.weekdays.length < 7 ? [`BYDAY=${f.weekdays.map((day) => weekdays[day]).join(',')}`] : []),
    ...(f.months.length < 12 ? [`BYMONTH=${f.months.join(',')}`] : []),
  ].join(';');
}

function utc(date) {
  const value = new Date(date);
  if (!Number.isFinite(value.getTime()) || value.getUTCMilliseconds() !== 0)
    throw new Error('cloud-schedule-timestamp-invalid:use-whole-seconds');
  return value.toISOString().replaceAll(/[-:]/g, '').replace('.000', '');
}

function local(date, timezone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(date))
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
}

/** Compile shared normalized schedules; the hosted scheduler owns execution and DST. */
export default function cloudSchedule(schedule, { now, previous, timezone } = {}) {
  const rule = recurrence(schedule);
  const zone =
    schedule.timezone ??
    previous?.default_timezone ??
    timezone ??
    (schedule.kind === 'cron' ? null : 'UTC');
  if (!zone) throw new Error('cloud-schedule-timezone-required:read-native-scheduler-timezone');
  try {
    if (/^[+-]/u.test(zone)) throw new Error('offset');
    new Intl.DateTimeFormat('en', { timeZone: zone });
  } catch {
    throw new Error('cloud-schedule-timezone-invalid');
  }
  const saved = previous?.schedule;
  if (previous && typeof saved !== 'string') throw new Error('native-schedule-string-required');
  const start = saved?.match(/^DTSTART(?:;TZID=([^:\r\n]+))?:(\d{8}T\d{6})(Z?)\r?$/mu);
  if (previous && !start) throw new Error('native-schedule-start-required');
  let anchor;
  if (schedule.kind === 'at') {
    anchor = `DTSTART:${utc(schedule.at)}`;
  } else if (schedule.kind === 'every') {
    // Intervals are elapsed time. Do not silently reinterpret an old wall-clock anchor.
    if (start && (start[1] || !start[3]))
      throw new Error('cloud-schedule-interval-anchor-unsupported:expected-UTC');
    const timestamp = start ? `${start[2]}Z` : utc(Math.ceil(Date.parse(now) / 60000) * 60000);
    anchor = `DTSTART:${timestamp}`;
  } else {
    const timestamp =
      start && (start[1] === zone || (zone === 'UTC' && start[3]))
        ? start[2]
        : local(Math.ceil(Date.parse(now) / 60000) * 60000, zone);
    anchor = zone === 'UTC' ? `DTSTART:${timestamp}Z` : `DTSTART;TZID=${zone}:${timestamp}`;
  }
  return {
    schedule: ['BEGIN:VEVENT', anchor, ...(rule ? [`RRULE:${rule}`] : []), 'END:VEVENT'].join('\n'),
    default_timezone: zone,
    timing_mode: 'exact_schedule',
  };
}
