import { readTaskPrompt } from './task-prompt.js';

/** Accept the generated worker opening or the previous metadata-first worker format. */
export default function readWorkerPrompt(prompt) {
  if (typeof prompt !== 'string') throw new Error('task-prompt-required');
  const header = prompt.match(/^> ## [^\r\n<>]{1,240} · REQUEST\n>\n> [^\r\n<>]{1,280}\n\n/u)?.[0];
  const parsed = readTaskPrompt(header ? prompt.slice(header.length) : prompt);
  if (!parsed || parsed.metadata.role !== 'worker') throw new Error('worker-prompt-invalid');
  return parsed;
}
