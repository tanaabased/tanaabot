import { createHash } from 'node:crypto';

const opening = '<tanaabot-automation-metadata>';
const closing = '</tanaabot-automation-metadata>';

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

export function taskPrompt(metadata, body) {
  return `${opening}\n${JSON.stringify(metadata, null, 2)}\n${closing}\n\n${body}`;
}

export function readTaskPrompt(prompt) {
  if (typeof prompt !== 'string') throw new Error('task-prompt-required');
  if (!prompt.startsWith(opening)) {
    if (prompt.includes(opening)) throw new Error('task-marker-misplaced');
    return null;
  }
  const end = prompt.indexOf(`\n${closing}\n\n`);
  if (end < 0) throw new Error('task-marker-invalid');
  const metadata = JSON.parse(prompt.slice(opening.length, end).trim());
  const body = prompt.slice(end + closing.length + 3);
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
  return { metadata, body };
}
