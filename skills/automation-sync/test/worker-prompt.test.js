import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import readWorkerPrompt from '../utils/read-worker-prompt.js';
import requestHeader from '../utils/request-header.js';
import { readTaskPrompt, taskPrompt } from '../utils/task-prompt.js';

const template = readFileSync(
  new URL('../../../prompts/automations/partials/request.md', import.meta.url),
  'utf8',
);
const metadata = {
  schema: 'tanaabot.automation/v1',
  repository: 'tanaabased/tanaabot',
  agentId: 'tanaabot',
  automationId: 'sync',
  contentHash: 'a'.repeat(64),
  updatedAt: '2026-01-01T00:00:00Z',
  role: 'worker',
  debug: false,
};

test('should give different automations readable openings without changing their payloads', () => {
  for (const [title, emoji, request] of [
    ['Automation sync', '🔄', 'Synchronize repository automations.'],
    ['Smoke test', '🧪', 'Run the smoke check.'],
  ]) {
    const header = requestHeader(template, title, { emoji, request });
    assert.equal(header, `> ## ${emoji} ${title.toUpperCase()} · REQUEST\n>\n> ${request}`);
    assert.ok(header.length < 400);
    const original = taskPrompt(metadata, 'Full instructions.');
    const prompt = `${header}\n\n${original}`;
    assert.equal(prompt.slice(header.length + 2), original);
    assert.deepEqual(readWorkerPrompt(prompt), readWorkerPrompt(original));
    assert.throws(() => readTaskPrompt(prompt), /task-marker-misplaced/);
  }
});

test('should reject missing or multiline header fields and invalid template slots', () => {
  const fields = { emoji: '🔄', request: 'Synchronize.' };
  for (const field of ['emoji', 'request']) {
    for (const value of [undefined, '', '\nInjected', '<metadata>'])
      assert.throws(
        () => requestHeader(template, 'Sync', { ...fields, [field]: value }),
        /request-header-field-invalid/,
      );
  }
  assert.throws(() => requestHeader(template, '', fields), /request-header-field-invalid:title/);
  assert.throws(
    () => requestHeader(template, 'Sync', { ...fields, request: 'x'.repeat(281) }),
    /request-header-field-invalid/,
  );
  assert.throws(() => requestHeader('', 'Sync', fields), /shared-partial-required:request/);
  assert.throws(
    () => requestHeader(template.replace('{{emoji}}', ''), 'Sync', fields),
    /request-header-slot-invalid/,
  );
  assert.throws(
    () => requestHeader(`${template}{{unknown}}`, 'Sync', fields),
    /request-header-slot-invalid/,
  );
});

test('should reject arbitrary worker preambles, malformed metadata and coordinator payloads', () => {
  const header = requestHeader(template, 'Sync', { emoji: '🔄', request: 'Synchronize.' });
  const worker = taskPrompt(metadata, 'Run.');
  assert.throws(() => readWorkerPrompt(`Arbitrary text\n${worker}`), /task-marker-misplaced/);
  assert.throws(
    () => readWorkerPrompt(`${header}\n\n<tanaabot-automation-metadata>broken`),
    /task-marker-invalid/,
  );
  assert.throws(
    () =>
      readWorkerPrompt(`${header}\n\n${taskPrompt({ ...metadata, role: 'coordinator' }, 'Run.')}`),
    /worker-prompt-invalid/,
  );
});
