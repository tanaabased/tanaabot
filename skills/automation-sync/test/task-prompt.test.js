import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';

import { readTaskPrompt, taskPrompt } from '../utils/task-prompt.js';

const metadata = {
  schema: 'tanaabot.automation/v1',
  repository: 'tanaabased/tanaabot',
  agentId: 'tanaabot',
  automationId: 'smoke-test',
  contentHash: 'a'.repeat(64),
  updatedAt: '2026-01-01T00:00:00Z',
  debug: false,
};
const canary = 'TANAABOT-SYNC-CANARY: ORBITAL-GOOSE-731';

describe('skills/automation-sync/utils/task-prompt', () => {
  test('should read metadata-first prompts and preserve the original serialization', () => {
    const prompt = `<tanaabot-automation-metadata>\n${JSON.stringify(metadata, null, 2)}\n</tanaabot-automation-metadata>\n\nRun smoke.`;
    assert.deepEqual(readTaskPrompt(prompt), { metadata, body: 'Run smoke.' });
    assert.equal(taskPrompt(metadata, 'Run smoke.'), prompt);
  });

  test('should round-trip an optional canary directly before the ownership marker', () => {
    const prompt = taskPrompt(metadata, 'Run smoke.', canary);
    assert.equal(prompt.split('\n')[0], canary);
    assert.equal(prompt.split('\n')[1], '<tanaabot-automation-metadata>');
    assert.deepEqual(readTaskPrompt(prompt), { metadata, body: 'Run smoke.', canary });
  });

  test('should reject malformed or repeated canaries and arbitrary ownership preambles', () => {
    const base = taskPrompt(metadata, 'Run smoke.');
    for (const prefix of [
      'TANAABOT-SYNC-CANARY: lowercase',
      'TANAABOT-SYNC-CANARY: ',
      'TANAABOT-SYNC-CANARY: TWO WORDS',
      `${canary}\n${canary}`,
      `${canary}\n`,
      'Arbitrary prefix',
    ]) {
      assert.throws(() => readTaskPrompt(`${prefix}\n${base}`), /task-(canary|marker)-/);
      assert.throws(() => taskPrompt(metadata, 'Run smoke.', prefix), /task-canary-invalid/);
    }
    assert.throws(() => readTaskPrompt(`${canary}\nNo ownership header.`), /task-marker-invalid/);
    assert.equal(readTaskPrompt('An unrelated scheduled task.'), null);
  });
});
