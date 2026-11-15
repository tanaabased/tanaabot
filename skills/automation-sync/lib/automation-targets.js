/** Resolve Tanaabot policy without changing Agent System's omitted defaults. */
export default function automationTargets(manifest, context, id = 'all') {
  if (manifest.agent?.id !== 'tanaabot') throw new Error('tanaabot-manifest-required');
  if (context?.destination?.kind !== 'dot' || !context.destination.id?.trim())
    throw new Error('verified-dot-destination-required');
  const jobs = manifest.automations ?? [];
  if (id !== 'all' && !jobs.some((job) => job.id === id))
    throw new Error('automation-id-not-found');
  return jobs
    .filter((job) => job.runtimes.includes('codex') && (id === 'all' || job.id === id))
    .map((job) => {
      if (job.payload.kind !== 'prompt') throw new Error(`prompt-automation-required:${job.id}`);
      if (!['every', 'cron'].includes(job.schedule.kind))
        throw new Error(`recurring-schedule-required:${job.id}`);
      const selector = job.overrides.codex?.environment ?? { type: 'cloud', name: 'tanaabot' };
      if (selector.type !== 'cloud')
        throw new Error(`automation-environment-unsupported:${job.id}:${selector.type}`);
      const name = selector.name ?? 'tanaabot';
      if (!Array.isArray(context.environments)) throw new Error('native-environments-required');
      const matches = context.environments.filter((environment) => environment.name === name);
      if (matches.length !== 1 || !matches[0].id?.trim())
        throw new Error(`cloud-environment-missing-or-ambiguous:${job.id}`);
      const override = job.overrides.codex?.target;
      if (override === 'independent') throw new Error(`independent-worker-unsupported:${job.id}`);
      return {
        automationId: job.id,
        execution: { kind: 'cloud', environmentId: matches[0].id },
        thread: {
          ...(override?.thread || job.thread?.id ? { id: override?.thread ?? job.thread.id } : {}),
          name: job.thread?.name ?? job.displayName ?? job.id.replaceAll('-', ' '),
          group: job.group ?? 'REPORTS',
        },
        model: job.overrides.codex?.model ?? null,
        effort: job.overrides.codex?.effort ?? null,
        destination: { kind: 'dot', id: context.destination.id },
      };
    });
}
