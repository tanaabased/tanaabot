import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';

import cloudSchedule from '../utils/cloud-schedule.js';

const range = (count, start = 0) => Array.from({ length: count }, (_, index) => index + start);
const cron = (fields = {}, timezone = null) => ({
  kind: 'cron',
  timezone,
  missedRun: 'native',
  fields: {
    minutes: [15],
    hours: [9],
    days: range(31, 1),
    months: range(12, 1),
    weekdays: range(7),
    dayWildcard: true,
    weekdayWildcard: true,
    ...fields,
  },
});
const now = '2026-11-16T14:00:00.000Z';
const options = { now, timezone: 'America/New_York' };

describe('skills/automation-sync/utils/cloud-schedule', () => {
  test('should compile an absolute one-shot without a recurrence', () => {
    const actual = cloudSchedule({ kind: 'at', at: '2026-11-16T15:20:00.000Z' }, options);
    assert.deepEqual(actual, {
      schedule: 'BEGIN:VEVENT\nDTSTART:20261116T152000Z\nEND:VEVENT',
      default_timezone: 'America/New_York',
      timing_mode: 'exact_schedule',
    });
    assert.throws(
      () => cloudSchedule({ kind: 'in', seconds: 1200 }, options),
      /relative-unsupported/,
    );
    assert.throws(
      () => cloudSchedule({ kind: 'at', at: '2026-11-16T15:20:00.001Z' }, options),
      /whole-seconds/,
    );
  });

  test('should compile hourly and longer elapsed intervals without changing their anchor', () => {
    for (const [seconds, rule] of [
      [3600, 'HOURLY;INTERVAL=1'],
      [5400, 'MINUTELY;INTERVAL=90'],
      [86400, 'HOURLY;INTERVAL=24'],
    ]) {
      const schedule = { kind: 'every', seconds, missedRun: 'native' };
      const first = cloudSchedule(schedule, options);
      assert.equal(
        first.schedule,
        `BEGIN:VEVENT\nDTSTART:20261116T140000Z\nRRULE:FREQ=${rule};BYSECOND=0\nEND:VEVENT`,
      );
      assert.deepEqual(
        cloudSchedule(schedule, { ...options, now: '2027-01-01T00:00:00Z', previous: first }),
        first,
      );
    }
    for (const seconds of [60, 600, 1800, 3599])
      assert.throws(
        () => cloudSchedule({ kind: 'every', seconds }, options),
        /minimum-interval:1h/,
      );
    assert.throws(() => cloudSchedule({ kind: 'every', seconds: 3601 }, options), /whole-minutes/);
  });

  test('should compile daily, weekly, monthly and seasonal calendar schedules', () => {
    for (const [source, rule] of [
      [cron(), 'FREQ=DAILY;BYHOUR=9;BYMINUTE=15;BYSECOND=0'],
      [
        cron({ weekdays: [1, 3, 5], weekdayWildcard: false }),
        'FREQ=WEEKLY;BYHOUR=9;BYMINUTE=15;BYSECOND=0;BYDAY=MO,WE,FR',
      ],
      [
        cron({ days: [1, 15], dayWildcard: false }),
        'FREQ=MONTHLY;BYHOUR=9;BYMINUTE=15;BYSECOND=0;BYMONTHDAY=1,15',
      ],
      [
        cron({ days: [29], months: [2], dayWildcard: false }),
        'FREQ=MONTHLY;BYHOUR=9;BYMINUTE=15;BYSECOND=0;BYMONTHDAY=29;BYMONTH=2',
      ],
      [cron({ hours: [9, 17] }), 'FREQ=DAILY;BYHOUR=9,17;BYMINUTE=15;BYSECOND=0'],
    ]) {
      const actual = cloudSchedule(source, options);
      assert.equal(
        actual.schedule,
        `BEGIN:VEVENT\nDTSTART;TZID=America/New_York:20261116T090000\nRRULE:${rule}\nEND:VEVENT`,
      );
    }
  });

  test('should reject subhourly cron and day-of-month OR weekday instead of changing meaning', () => {
    for (const minutes of [
      [0, 10, 20, 30, 40, 50],
      [0, 59],
    ])
      assert.throws(() => cloudSchedule(cron({ minutes }), options), /minimum-interval:1h/);
    assert.throws(
      () =>
        cloudSchedule(
          cron({ days: [1], weekdays: [1], dayWildcard: false, weekdayWildcard: false }),
          options,
        ),
      /day-union-unsupported/,
    );
    const stepped = cron({
      days: [1, 3, 5],
      weekdays: [1],
      dayWildcard: true,
      weekdayWildcard: false,
    });
    assert.match(cloudSchedule(stepped, options).schedule, /BYMONTHDAY=1,3,5;BYDAY=MO/);
  });

  test('should use the native timezone and retain a calendar anchor across DST and prompt updates', () => {
    const source = cron();
    const first = cloudSchedule(source, { ...options, now: '2026-07-01T14:00:00Z' });
    assert.match(first.schedule, /DTSTART;TZID=America\/New_York:20260701T100000/);
    assert.deepEqual(
      cloudSchedule(source, { ...options, previous: first, timezone: 'Europe/London' }),
      first,
    );
    const utc = cloudSchedule(cron({}, 'UTC'), options);
    assert.match(utc.schedule, /DTSTART:20261116T140000Z/);
    assert.equal(utc.default_timezone, 'UTC');
    assert.throws(() => cloudSchedule(source, { now }), /timezone-required/);
    assert.throws(() => cloudSchedule(source, { now, timezone: 'Not/AZone' }), /timezone-invalid/);
    assert.throws(
      () => cloudSchedule(source, { ...options, previous: { schedule: 'broken' } }),
      /native-schedule-start-required/,
    );
  });
});
