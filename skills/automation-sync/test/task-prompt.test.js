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

describe('skills/automation-sync/utils/task-prompt', () => {
  test('should read metadata-first prompts and preserve the original serialization', () => {
    const prompt = `<tanaabot-automation-metadata>\n${JSON.stringify(metadata, null, 2)}\n</tanaabot-automation-metadata>\n\nRun smoke.`;
    assert.deepEqual(readTaskPrompt(prompt), { metadata, body: 'Run smoke.' });
    assert.equal(taskPrompt(metadata, 'Run smoke.'), prompt);
  });

  test('should reject a misplaced ownership marker and ignore unrelated prompts', () => {
    const owned = taskPrompt(metadata, 'Run smoke.');
    assert.throws(() => readTaskPrompt(`Arbitrary prefix\n${owned}`), /task-marker-misplaced/);
    assert.equal(readTaskPrompt('An unrelated scheduled task.'), null);
  });
});
