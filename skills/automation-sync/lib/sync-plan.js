import {
  canonical,
  fingerprint,
  readTaskPrompt,
  taskBody,
  taskPrompt,
} from '../utils/task-prompt.js';
import automationTargets from './automation-targets.js';
import cloudSchedule from '../utils/cloud-schedule.js';
import requestHeader from '../utils/request-header.js';

const repository = 'tanaabased/tanaabot';
const sourceSyncJobs = new Set(['automation-sync', 'instruction-sync']);

function syncPartial(partials, name) {
  const partial = partials[name];
  if (typeof partial !== 'string' || !partial.trim())
    throw new Error(`shared-partial-required:${name}`);
  return partial.trim();
}

function workerLink(worker) {
  const link = worker.url ?? `codex://threads/${worker.id}`;
  let url;
  try {
    url = new URL(link);
  } catch {
    throw new Error(`native-worker-url-invalid:${worker.automationId}`);
  }
  const supported =
    url.protocol === 'https:' ||
    (url.protocol === 'codex:' &&
      url.hostname === 'threads' &&
      url.pathname === `/${worker.id}` &&
      !url.port &&
      !url.search &&
      !url.hash);
  if (typeof link !== 'string' || /\s/u.test(link) || url.username || url.password || !supported)
    throw new Error(`native-worker-url-invalid:${worker.automationId}`);
  return { url: link };
}

function findWorker(automationId, workers) {
  if (!Array.isArray(workers)) throw new Error('native-workers-required');
  const matches = workers.filter((worker) => worker.automationId === automationId);
  const [worker] = matches;
  if (matches.length > 1 || (worker && !worker.id))
    throw new Error(`reusable-worker-missing-or-ambiguous:${automationId}`);
  if (worker && (typeof worker.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/u.test(worker.id)))
    throw new Error(`native-worker-id-invalid:${automationId}`);
  return worker;
}

function historyMatch(view, id, source = 'history') {
  if (
    view?.source !== source ||
    !Array.isArray(view.ids) ||
    view.ids.some((value) => typeof value !== 'string' || !value)
  )
    return 'unknown';
  if (view.ids.includes(id)) return 'found';
  return view.complete === true ? 'absent' : 'unknown';
}

function workerStatus(history, id) {
  if (!id) return 'unverified';
  const active = historyMatch(history?.active, id);
  const archived = historyMatch(history?.archived, id);
  if (historyMatch(history?.deleted, id, 'native-deletion') === 'found') {
    return active === 'found' || archived === 'found' ? 'unverified' : 'deleted';
  }
  if (active === 'found' && archived === 'absent') return 'active';
  if (archived === 'found' && active === 'absent') return 'archived';
  if (active === 'absent' && archived === 'absent') return 'deleted';
  return 'unverified';
}

function bindWorker(target, worker) {
  if (worker.startup !== undefined && worker.startup !== 'passed')
    throw new Error(`reusable-worker-startup-not-passed:${target.automationId}`);
  if (
    worker.environmentId !== target.execution.environmentId ||
    (target.thread.id && worker.id !== target.thread.id)
  )
    throw new Error(`reusable-worker-target-mismatch:${target.automationId}`);
  if (worker.name !== target.thread.name)
    throw new Error(`reusable-worker-settings-drift:${target.automationId}`);
  return {
    ...target,
    thread: { ...target.thread, id: worker.id, ...workerLink(worker) },
  };
}

function existingRecords(tasks) {
  if (!Array.isArray(tasks)) throw new Error('existing-native-tasks-required');
  const ids = tasks.map((record) => record.id);
  if (ids.some((id) => typeof id !== 'string' || !id.trim()) || new Set(ids).size !== ids.length) {
    throw new Error('native-task-id-invalid');
  }
  return tasks.map((record) => ({ ...record, parsed: readTaskPrompt(record.task?.prompt) }));
}

function validateTask(task) {
  for (const key of [
    'name',
    'enabled',
    'schedule',
    'execution',
    'destination',
    'model',
    'effort',
  ]) {
    if (!Object.hasOwn(task, key)) throw new Error(`native-task-field-required:${key}`);
  }
}

function compileTask(task, metadata, worker, body, dispatch, header) {
  const request = {
    ...worker,
    prompt: `${header}\n\n${taskPrompt({ ...metadata, role: 'worker' }, body)}`,
  };
  // escape nested markers so the outer task keeps one unambiguous ownership header.
  const payload = JSON.stringify(request, null, 2).replaceAll('<', '\\u003c');
  return {
    ...task,
    prompt: taskPrompt(
      { ...metadata, role: 'coordinator' },
      `${dispatch.trim()}\n\n## Worker request\n\n\`\`\`json\n${payload}\n\`\`\``,
    ),
  };
}

/** prepare effects only; native tools own publication, approval and saved-state reads. */
export function planSync({
  manifest,
  partials,
  requests,
  source,
  existingTasks,
  context,
  id = 'all',
  now,
}) {
  if (manifest.agent?.id !== 'tanaabot') throw new Error('tanaabot-manifest-required');
  if (!/^[a-f0-9]{40}$/.test(source?.revision ?? '') || typeof source.dirty !== 'boolean') {
    throw new Error('source-revision-required');
  }
  const updatedAt = new Date(now).toISOString();
  const targets = automationTargets(manifest, context, id, now);
  if (typeof partials.dispatch !== 'string' || !partials.dispatch.trim())
    throw new Error('shared-partial-required:dispatch');
  const records = existingRecords(existingTasks);
  const jobs = manifest.automations ?? [];
  const selected = id === 'all' ? jobs : jobs.filter((job) => job.id === id);
  const operations = selected
    .filter((job) => job.runtimes.includes('codex'))
    .toSorted((a, b) => Number(b.id === 'automation-sync') - Number(a.id === 'automation-sync'))
    .map((job) => {
      const identity = { repository, agentId: manifest.agent.id, automationId: job.id };
      const matches = records.filter(
        ({ parsed }) =>
          parsed &&
          Object.entries(identity).every(([key, value]) => parsed.metadata[key] === value),
      );
      if (matches.length > 1) throw new Error(`native-task-ambiguous:${job.id}`);
      const current = matches[0];
      if (current) validateTask(current.task);
      // an elapsed one-shot is history, even if the scheduler paused it after execution.
      // never recreate it or repair its enabled state during reconciliation.
      if (job.schedule.kind === 'at' && Date.parse(job.schedule.at) <= Date.parse(now)) {
        return {
          automationId: job.id,
          kind: 'skipped',
          reason: 'one-shot-elapsed',
          ...(current ? { nativeId: current.id, task: current.task } : {}),
        };
      }
      const target = targets.find((target) => target.automationId === job.id);
      const savedWorkerId = current?.parsed.metadata.worker?.id;
      const observed = findWorker(job.id, context.workers);
      const observedStatus = workerStatus(context.workerHistory, observed?.id);
      const savedStatus = savedWorkerId && workerStatus(context.workerHistory, savedWorkerId);
      const replaceable = savedStatus === 'archived' || savedStatus === 'deleted';
      if (!observed || observedStatus !== 'active' || savedStatus === 'unverified') {
        const needsReplacement = replaceable && (!observed || observed.id === savedWorkerId);
        return {
          automationId: job.id,
          kind: 'skipped',
          reason: needsReplacement ? `worker-${savedStatus}` : 'worker-status-unverified',
          ...(current ? { nativeId: current.id, task: current.task } : {}),
        };
      }
      const worker = bindWorker(target, observed);
      const displayName = job.displayName ?? job.thread?.name ?? job.id.replaceAll('-', ' ');
      const consumesSyncSource = sourceSyncJobs.has(job.id);
      const dispatch = consumesSyncSource
        ? `${syncPartial(partials, 'sync-source')}\n\n${partials.dispatch.trim()}`
        : partials.dispatch.trim();
      const workerPrompt = consumesSyncSource
        ? `${syncPartial(partials, 'sync-worker')}\n\n${job.payload.prompt}`
        : job.payload.prompt;
      const body = taskBody(partials, workerPrompt);
      const header = requestHeader(partials.request, displayName, requests?.[job.id]);
      const task = {
        name: `🤖 ${displayName.trim().toUpperCase()}`,
        enabled: job.enabled,
        schedule: cloudSchedule(job.schedule, {
          now,
          previous: current?.task.schedule,
          timezone: context.timezone,
        }),
        execution: { kind: 'inherited' },
        destination: worker.destination,
        model: null,
        effort: null,
      };
      const semantic = {
        ...task,
        worker,
        body,
        header,
        dispatch,
        debug: manifest.debug === true,
      };
      const contentHash = fingerprint({ ...identity, task: semantic });
      if (current) {
        const previous = current.parsed.metadata;
        if (previous.worker?.id && previous.worker.id !== worker.thread.id) {
          if (observed.startup !== 'passed')
            throw new Error(`reusable-worker-startup-not-passed:${job.id}`);
          const retired = observed.replaces;
          if (
            !replaceable ||
            retired?.id !== previous.worker.id ||
            retired.status !== savedStatus ||
            retired.environmentId !== previous.execution?.environmentId ||
            retired.environmentId !== worker.execution.environmentId
          )
            throw new Error(`reusable-worker-replacement-required:${job.id}`);
          if (
            ['enabled', 'schedule', 'destination', 'execution', 'model', 'effort'].some(
              (key) => canonical(task[key]) !== canonical(current.task[key]),
            )
          )
            throw new Error(`worker-rebind-settings-changed:${job.id}`);
        }
      }
      if (!current && records.some((record) => record.task.name === task.name)) {
        throw new Error(`native-task-name-collision:${job.id}`);
      }
      const metadata = {
        schema: 'tanaabot.automation/v1',
        ...identity,
        displayName,
        contentHash,
        sourceRevision: source.revision,
        sourceDirty: source.dirty,
        updatedAt,
        debug: manifest.debug === true,
        execution: worker.execution,
        destination: worker.destination,
        worker: worker.thread,
      };
      if (current && current.parsed.metadata.contentHash === contentHash) {
        const previousMetadata = current.parsed.metadata;
        const unchanged = compileTask(
          task,
          {
            ...metadata,
            updatedAt: previousMetadata.updatedAt,
            sourceRevision: previousMetadata.sourceRevision,
            sourceDirty: previousMetadata.sourceDirty,
          },
          worker,
          body,
          dispatch,
          header,
        );
        if (canonical(current.task) === canonical(unchanged))
          return {
            automationId: job.id,
            kind: 'unchanged',
            nativeId: current.id,
            task: current.task,
          };
      }
      return {
        automationId: job.id,
        kind: current ? 'update' : 'create',
        ...(current ? { nativeId: current.id, expectedCurrent: current.task } : {}),
        task: compileTask(task, metadata, worker, body, dispatch, header),
      };
    });
  return { schema: 'tanaabot.automation-plan/v1', source, operations };
}
