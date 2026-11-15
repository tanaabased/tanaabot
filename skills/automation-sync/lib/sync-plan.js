import {
  canonical,
  fingerprint,
  readTaskPrompt,
  taskBody,
  taskPrompt,
} from '../utils/task-prompt.js';
import automationTargets from './automation-targets.js';

const repository = 'tanaabased/tanaabot';

function bindWorker(target, workers) {
  if (!Array.isArray(workers)) throw new Error('native-workers-required');
  const matches = workers.filter((worker) => worker.automationId === target.automationId);
  if (matches.length !== 1 || !matches[0].id?.trim())
    throw new Error(`reusable-worker-missing-or-ambiguous:${target.automationId}`);
  const worker = matches[0];
  if (
    worker.environmentId !== target.execution.environmentId ||
    (target.thread.id && worker.id !== target.thread.id)
  )
    throw new Error(`reusable-worker-target-mismatch:${target.automationId}`);
  if (worker.name !== target.thread.name || worker.group !== target.thread.group)
    throw new Error(`reusable-worker-settings-drift:${target.automationId}`);
  if (typeof worker.url !== 'string' || !/^https:\/\/\S+$/u.test(worker.url))
    throw new Error(`native-worker-url-required:${target.automationId}`);
  return {
    ...target,
    thread: { ...target.thread, id: worker.id, url: worker.url },
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

function compileTask(task, metadata, worker, body, dispatch) {
  const request = {
    ...worker,
    prompt: taskPrompt({ ...metadata, role: 'worker' }, body),
  };
  // Escape nested markers so the outer task keeps one unambiguous ownership header.
  const payload = JSON.stringify(request, null, 2).replaceAll('<', '\\u003c');
  return {
    ...task,
    prompt: taskPrompt(
      { ...metadata, role: 'coordinator' },
      `${dispatch.trim()}\n\n## Worker request\n\n\`\`\`json\n${payload}\n\`\`\``,
    ),
  };
}

/** Prepare effects only; native tools own publication, approval and saved-state reads. */
export function planSync({ manifest, partials, source, existingTasks, context, id = 'all', now }) {
  if (manifest.agent?.id !== 'tanaabot') throw new Error('tanaabot-manifest-required');
  if (!/^[a-f0-9]{40}$/.test(source?.revision ?? '') || typeof source.dirty !== 'boolean') {
    throw new Error('source-revision-required');
  }
  const updatedAt = new Date(now).toISOString();
  const targets = automationTargets(manifest, context, id);
  if (typeof partials.dispatch !== 'string' || !partials.dispatch.trim())
    throw new Error('shared-partial-required:dispatch');
  const records = existingRecords(existingTasks);
  const jobs = manifest.automations ?? [];
  const selected = id === 'all' ? jobs : jobs.filter((job) => job.id === id);
  const operations = selected
    .filter((job) => job.runtimes.includes('codex'))
    .map((job) => {
      const worker = bindWorker(
        targets.find((target) => target.automationId === job.id),
        context.workers,
      );
      const body = taskBody(partials, job.payload.prompt);
      const task = {
        name: `🤖 ${(job.displayName ?? job.id.replaceAll('-', ' ')).trim().toUpperCase()}`,
        enabled: job.enabled,
        schedule: job.schedule,
        execution: { kind: 'inherited' },
        destination: worker.destination,
        model: null,
        effort: null,
      };
      const identity = { repository, agentId: manifest.agent.id, automationId: job.id };
      const semantic = {
        ...task,
        worker,
        body,
        dispatch: partials.dispatch.trim(),
        debug: manifest.debug === true,
      };
      const contentHash = fingerprint({ ...identity, task: semantic });
      const matches = records.filter(
        ({ parsed }) =>
          parsed &&
          Object.entries(identity).every(([key, value]) => parsed.metadata[key] === value),
      );
      if (matches.length > 1) throw new Error(`native-task-ambiguous:${job.id}`);
      const current = matches[0];
      if (current) {
        validateTask(current.task);
        const previous = current.parsed.metadata;
        if (previous.worker?.id && previous.worker.id !== worker.thread.id)
          throw new Error(`reusable-worker-replacement-required:${job.id}`);
      }
      if (!current && records.some((record) => record.task.name === task.name)) {
        throw new Error(`native-task-name-collision:${job.id}`);
      }
      const metadata = {
        schema: 'tanaabot.automation/v1',
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
        task: compileTask(task, metadata, worker, body, partials.dispatch),
      };
    });
  return { schema: 'tanaabot.automation-plan/v1', source, operations };
}
