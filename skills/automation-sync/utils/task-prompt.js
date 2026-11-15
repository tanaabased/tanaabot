import { createHash } from 'node:crypto';

const opening = '<tanaabot-automation-metadata>';
const closing = '</tanaabot-automation-metadata>';
const canaryPrefix = 'TANAABOT-SYNC-CANARY:';

/** Recognize only the optional authored first-line diagnostic, never arbitrary preambles. */
export function promptCanary(prompt) {
  const firstLine = prompt.split('\n', 1)[0];
  if (!firstLine.startsWith(canaryPrefix)) return undefined;
  if (!/^TANAABOT-SYNC-CANARY: [A-Z0-9]+(?:-[A-Z0-9]+)*$/u.test(firstLine))
    throw new Error('task-canary-invalid');
  return firstLine;
}

export function canonical(value) {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b, 'en')))
      : item,
  );
}

export function fingerprint(value) {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

export function taskBody(partials, prompt) {
  for (const name of ['metadata', 'execution', 'presentation']) {
    if (typeof partials?.[name] !== 'string' || !partials[name].trim())
      throw new Error(`shared-partial-required:${name}`);
  }
  const slot = '{{metadata}}\n\n';
  if (
    !partials.metadata.startsWith(slot) ||
    partials.metadata.slice(slot.length).includes('{{metadata}}')
  )
    throw new Error('metadata-partial-slot-invalid');
  return [
    partials.metadata.slice(slot.length).trim(),
    partials.execution.trim(),
    partials.presentation.trim(),
    prompt.trim(),
  ].join('\n\n');
}

export function taskPrompt(metadata, body, canary) {
  if (
    canary !== undefined &&
    (typeof canary !== 'string' || promptCanary(canary) !== canary || canary.includes('\n'))
  )
    throw new Error('task-canary-invalid');
  return `${canary === undefined ? '' : `${canary}\n`}${opening}\n${JSON.stringify(metadata, null, 2)}\n${closing}\n\n${body}`;
}

export function readTaskPrompt(prompt) {
  if (typeof prompt !== 'string') throw new Error('task-prompt-required');
  const canary = promptCanary(prompt);
  const content = canary === undefined ? prompt : prompt.slice(canary.length + 1);
  if (!content.startsWith(opening)) {
    if (canary !== undefined) throw new Error('task-marker-invalid');
    if (prompt.includes(opening)) throw new Error('task-marker-misplaced');
    return null;
  }
  const end = content.indexOf(`\n${closing}\n\n`);
  if (end < 0) throw new Error('task-marker-invalid');
  const metadata = JSON.parse(content.slice(opening.length, end).trim());
  const body = content.slice(end + closing.length + 3);
  if (
    metadata.schema !== 'tanaabot.automation/v1' ||
    typeof metadata.repository !== 'string' ||
    typeof metadata.agentId !== 'string' ||
    typeof metadata.automationId !== 'string' ||
    !/^[a-f0-9]{64}$/.test(metadata.contentHash ?? '') ||
    !Number.isFinite(Date.parse(metadata.updatedAt)) ||
    typeof metadata.debug !== 'boolean' ||
    body.includes(opening)
  )
    throw new Error('task-marker-invalid');
  return { metadata, body, ...(canary === undefined ? {} : { canary }) };
}
