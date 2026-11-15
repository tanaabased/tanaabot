import { canonical, fingerprint, readTaskPrompt, taskPrompt } from '../utils/task-prompt.js';

const repository = 'tanaabased/tanaabot';

function executionContext(context) {
  const execution = context?.execution;
  const destination = context?.destination;
  if (
    !execution ||
    !['cloud', 'inherited'].includes(execution.kind) ||
    (execution.kind === 'cloud' && !execution.environmentId?.trim()) ||
    destination?.kind !== 'dot' ||
    !destination.id?.trim()
  )
    throw new Error('verified-execution-and-dot-destination-required');
  return {
    execution:
      execution.kind === 'cloud'
        ? { kind: 'cloud', environmentId: execution.environmentId }
        : { kind: 'inherited' },
    destination: { kind: 'dot', id: destination.id },
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

function semanticTask(task) {
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
  const parsed = readTaskPrompt(task.prompt);
  if (!parsed) throw new Error('native-task-marker-required');
  return { ...task, prompt: parsed.body, debug: parsed.metadata.debug };
}

/** Prepare effects only; native tools own publication, approval and saved-state reads. */
export function planSync({ manifest, shared, source, existingTasks, context, id = 'all', now }) {
  if (manifest.agent?.id !== 'tanaabot') throw new Error('tanaabot-manifest-required');
  if (!/^[a-f0-9]{40}$/.test(source?.revision ?? '') || typeof source.dirty !== 'boolean') {
    throw new Error('source-revision-required');
  }
  if (!shared?.trim()) throw new Error('shared-guidance-required');
  const updatedAt = new Date(now).toISOString();
  const target = executionContext(context);
  const records = existingRecords(existingTasks);
  const jobs = manifest.automations ?? [];
  if (id !== 'all' && !jobs.some((job) => job.id === id))
    throw new Error('automation-id-not-found');
  const selected = id === 'all' ? jobs : jobs.filter((job) => job.id === id);
  const operations = selected
    .filter((job) => job.runtimes.includes('codex'))
    .map((job) => {
      if (job.payload.kind !== 'prompt') throw new Error(`prompt-automation-required:${job.id}`);
      if (!['every', 'cron'].includes(job.schedule.kind)) {
        throw new Error(`recurring-schedule-required:${job.id}`);
      }
      if (job.thread || job.overrides.codex?.target)
        throw new Error(`native-thread-target-unsupported:${job.id}`);
      const body = `${shared.trim()}\n\n${job.payload.prompt.trim()}`;
      const task = {
        name: job.displayName ?? `${manifest.agent.id}: ${job.id}`,
        enabled: job.enabled,
        schedule: job.schedule,
        ...target,
        model: job.overrides.codex?.model ?? null,
        effort: job.overrides.codex?.effort ?? null,
        prompt: body,
      };
      const identity = { repository, agentId: manifest.agent.id, automationId: job.id };
      const semantic = { ...task, debug: manifest.debug === true };
      const contentHash = fingerprint({ ...identity, task: semantic });
      const matches = records.filter(
        ({ parsed }) =>
          parsed &&
          Object.entries(identity).every(([key, value]) => parsed.metadata[key] === value),
      );
      if (matches.length > 1) throw new Error(`native-task-ambiguous:${job.id}`);
      const current = matches[0];
      const currentSemantic = current ? semanticTask(current.task) : null;
      if (
        current &&
        current.parsed.metadata.contentHash === contentHash &&
        canonical(currentSemantic) === canonical(semantic) &&
        canonical(current.parsed.metadata.execution) === canonical(target.execution) &&
        canonical(current.parsed.metadata.destination) === canonical(target.destination)
      ) {
        return {
          automationId: job.id,
          kind: 'unchanged',
          nativeId: current.id,
          task: current.task,
        };
      }
      if (!current && records.some((record) => record.task.name === task.name)) {
        throw new Error(`native-task-name-collision:${job.id}`);
      }
      const metadata = {
        schema: 'tanaabot.automation/v1',
        ...identity,
        contentHash,
        sourceRevision: source.revision,
        sourceDirty: source.dirty,
        updatedAt,
        debug: manifest.debug === true,
        ...target,
      };
      return {
        automationId: job.id,
        kind: current ? 'update' : 'create',
        ...(current ? { nativeId: current.id, expectedCurrent: current.task } : {}),
        task: { ...task, prompt: taskPrompt(metadata, body) },
      };
    });
  return { schema: 'tanaabot.automation-plan/v1', source, operations };
}
