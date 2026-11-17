const profiles = ['default', 'low', 'medium', 'high'];
const efforts = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'];

/** Resolve desired worker settings; native controls still validate availability. */
export default function workerSettings(job, models) {
  const override = job.overrides.codex;
  const selector = override?.model ?? job.model ?? 'medium';
  const namedProfile = profiles.includes(selector);
  const profile = namedProfile ? models?.[selector] : undefined;
  if (namedProfile && !profile) throw new Error('automation-model-profile-missing');
  const reference = namedProfile ? profile.model : selector;
  if (typeof reference !== 'string' || !/^(?:openai\/)?[^/@\s]+$/u.test(reference))
    throw new Error('codex-model-provider-unsupported');
  const model = reference.replace(/^openai\//u, '');
  const explicitEffort = override?.effort ?? job.effort;
  const matchingEfforts = new Set(
    profiles
      .map((name) => models?.[name])
      .filter((candidate) => candidate?.model === `openai/${model}`)
      .map((candidate) => candidate.effort)
      .filter((effort) => effort !== undefined),
  );
  if (explicitEffort === undefined && !profile && matchingEfforts.size > 1)
    throw new Error('automation-model-effort-ambiguous');
  const effort = explicitEffort ?? profile?.effort ?? [...matchingEfforts][0] ?? 'high';
  if (!efforts.includes(effort)) throw new Error('codex-model-effort-unsupported');
  return { model, effort };
}
