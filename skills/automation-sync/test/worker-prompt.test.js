import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import requestHeader from '../utils/request-header.js';
import { taskPrompt } from '../utils/task-prompt.js';

const template = readFileSync(
  new URL('../../../prompts/request-partial.md', import.meta.url),
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
