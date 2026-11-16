import {
  canonical,
  fingerprint,
  promptCanary,
  readTaskPrompt,
  taskBody,
  taskPrompt,
} from '../utils/task-prompt.js';
import automationTargets from './automation-targets.js';
import cloudSchedule from '../utils/cloud-schedule.js';
import requestHeader from '../utils/request-header.js';

const repository = 'tanaabased/tanaabot';

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

function bindWorker(target, workers) {
  if (!Array.isArray(workers)) throw new Error('native-workers-required');
  const matches = workers.filter((worker) => worker.automationId === target.automationId);
  if (matches.length !== 1 || !matches[0].id?.trim())
    throw new Error(`reusable-worker-missing-or-ambiguous:${target.automationId}`);
  const worker = matches[0];
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/u.test(worker.id))
    throw new Error(`native-worker-id-invalid:${target.automationId}`);
  if (worker.status !== 'active')
    throw new Error(`reusable-worker-not-active:${target.automationId}`);
  if (
    worker.environmentId !== target.execution.environmentId ||
    (target.thread.id && worker.id !== target.thread.id)
  )
    throw new Error(`reusable-worker-target-mismatch:${target.automationId}`);
  if (worker.name !== target.thread.name || worker.group !== target.thread.group)
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

function compileTask(task, metadata, worker, body, dispatch, canary, header) {
  const request = {
    ...worker,
    prompt: `${header}\n\n${taskPrompt({ ...metadata, role: 'worker' }, body)}`,
  };
  // Escape nested markers so the outer task keeps one unambiguous ownership header.
  const payload = JSON.stringify(request, null, 2).replaceAll('<', '\\u003c');
  return {
    ...task,
    prompt: taskPrompt(
      { ...metadata, role: 'coordinator' },
      `${dispatch.trim()}\n\n## Worker request\n\n\`\`\`json\n${payload}\n\`\`\``,
      canary,
    ),
  };
}

/** Prepare effects only; native tools own publication, approval and saved-state reads. */
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
    .toSorted((a, b) => Number(b.id === 'sync') - Number(a.id === 'sync'))
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
      // An elapsed one-shot is history, even if the scheduler paused it after execution.
      // Never recreate it or repair its enabled state during reconciliation.
      if (job.schedule.kind === 'at' && Date.parse(job.schedule.at) <= Date.parse(now)) {
        return {
          automationId: job.id,
          kind: 'skipped',
          reason: 'one-shot-elapsed',
          ...(current ? { nativeId: current.id, task: current.task } : {}),
        };
      }
      const worker = bindWorker(
        targets.find((target) => target.automationId === job.id),
        context.workers,
      );
      const body = taskBody(partials, job.payload.prompt);
      const header = requestHeader(
        partials.request,
        job.displayName ?? job.id.replaceAll('-', ' '),
        requests?.[job.id],
      );
      const canary = promptCanary(job.payload.prompt);
      const task = {
        name: `🤖 ${(job.displayName ?? job.id.replaceAll('-', ' ')).trim().toUpperCase()}`,
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
        dispatchVersion: 2,
        ...task,
        worker,
        body,
        header,
        dispatch: partials.dispatch.trim(),
        debug: manifest.debug === true,
      };
      const contentHash = fingerprint({ ...identity, task: semantic });
      if (current) {
        const previous = current.parsed.metadata;
        if (previous.worker?.id && previous.worker.id !== worker.thread.id) {
          const retired = context.workers.find(
            (record) => record.automationId === job.id,
          )?.replaces;
          if (
            retired?.id !== previous.worker.id ||
            retired.status !== 'archived' ||
            retired.environmentId !== previous.execution?.environmentId ||
            retired.environmentId !== worker.execution.environmentId
          )
            throw new Error(`reusable-worker-replacement-required:${job.id}`);
          if (
            task.enabled !== current.task.enabled ||
            canonical(task.schedule) !== canonical(current.task.schedule)
          )
            throw new Error(`worker-rebind-settings-changed:${job.id}`);
        }
      }
      if (!current && records.some((record) => record.task.name === task.name)) {
        throw new Error(`native-task-name-collision:${job.id}`);
      }
      const metadata = {
        schema: 'tanaabot.automation/v1',
        dispatchVersion: 2,
        ...identity,
        displayName: job.displayName ?? job.id.replaceAll('-', ' '),
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
          partials.dispatch,
          canary,
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
        task: compileTask(task, metadata, worker, body, partials.dispatch, canary, header),
      };
    });
  return { schema: 'tanaabot.automation-plan/v1', source, operations };
}
