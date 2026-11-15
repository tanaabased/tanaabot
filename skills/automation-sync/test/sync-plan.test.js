import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';

import { planSync } from '../lib/sync-plan.js';
import { readTaskPrompt } from '../utils/task-prompt.js';

const revision = 'a'.repeat(40);
const now = '2026-01-02T03:04:05.000Z';
const later = '2026-02-03T04:05:06.000Z';
const job = (id) => ({
  id,
  displayName: `Test ${id}`,
  enabled: false,
  runtimes: ['codex'],
  schedule: { kind: 'every', seconds: 3600, missedRun: 'native' },
  payload: { kind: 'prompt', prompt: `Perform ${id}.` },
  overrides: {},
});
function input(overrides = {}) {
  return {
    manifest: { agent: { id: 'tanaabot' }, debug: false, automations: [job('sync'), job('smoke')] },
    shared: 'Use the verified account. Report facts.',
    source: { revision, dirty: false },
    existingTasks: [],
    context: {
      execution: { kind: 'cloud', environmentId: 'test-environment' },
      destination: { kind: 'dot', id: 'test-dot' },
    },
    now,
    ...overrides,
  };
}
function saved(request = input()) {
  return planSync(request).operations.map(({ task, automationId }) => ({
    id: `native-${automationId}`,
    task,
  }));
}

describe('skills/automation-sync/lib/sync-plan', () => {
  test('should assemble both paused jobs with shared guidance, native settings and metadata', () => {
    const request = input();
    const before = JSON.stringify(request);
    const result = planSync(request);
    assert.deepEqual(
      result.operations.map(({ kind }) => kind),
      ['create', 'create'],
    );
    const { task } = result.operations[0];
    const { metadata, body } = readTaskPrompt(task.prompt);
    assert.equal(body, 'Use the verified account. Report facts.\n\nPerform sync.');
    assert.equal(metadata.updatedAt, now);
    assert.equal(metadata.sourceRevision, revision);
    assert.equal(metadata.automationId, 'sync');
    assert.equal(task.enabled, false);
    assert.deepEqual(task.execution, request.context.execution);
    assert.deepEqual(task.destination, request.context.destination);
    assert.equal(JSON.stringify(request), before);
  });

  test('should retain exact prompts, native IDs and timestamps on an unchanged rerun', () => {
    const existingTasks = saved();
    const result = planSync(
      input({ existingTasks, now: later, source: { revision: 'b'.repeat(40), dirty: false } }),
    );
    assert.deepEqual(
      result.operations.map(({ kind }) => kind),
      ['unchanged', 'unchanged'],
    );
    assert.equal(result.operations[0].nativeId, 'native-sync');
    assert.equal(result.operations[0].task.prompt, existingTasks[0].task.prompt);
    assert.equal(readTaskPrompt(result.operations[0].task.prompt).metadata.updatedAt, now);
  });

  test('should update every affected job when only shared guidance changes', () => {
    const existingTasks = saved();
    const result = planSync(input({ existingTasks, shared: 'New shared guidance.', now: later }));
    assert.deepEqual(
      result.operations.map(({ kind }) => kind),
      ['update', 'update'],
    );
    for (const operation of result.operations) {
      assert.equal(operation.nativeId, `native-${operation.automationId}`);
      assert.equal(readTaskPrompt(operation.task.prompt).metadata.updatedAt, later);
      assert.match(readTaskPrompt(operation.task.prompt).body, /^New shared guidance\./);
    }
  });

  test('should select one ID and leave unrelated native tasks untouched', () => {
    const existingTasks = [
      ...saved(),
      { id: 'unrelated', task: { name: 'Unrelated', prompt: 'Hello' } },
    ];
    const before = JSON.stringify(existingTasks);
    const result = planSync(input({ id: 'smoke', existingTasks }));
    assert.equal(result.operations.length, 1);
    assert.equal(result.operations[0].nativeId, 'native-smoke');
    assert.equal(JSON.stringify(existingTasks), before);
    assert.throws(() => planSync(input({ id: 'missing' })), /automation-id-not-found/);
  });

  test('should detect actual prompt or native setting edits despite an unchanged stored hash', () => {
    const existingTasks = saved();
    existingTasks[0].task.prompt += '\nManually edited.';
    existingTasks[1].task.enabled = true;
    const result = planSync(input({ existingTasks, now: later }));
    assert.deepEqual(
      result.operations.map(({ kind }) => kind),
      ['update', 'update'],
    );
    assert.equal(result.operations[1].task.enabled, false);
  });

  test('should propagate debug and destination changes through task comparison', () => {
    const request = input({ existingTasks: saved(), now: later });
    request.manifest.debug = true;
    request.context.destination.id = 'another-test-dot';
    const result = planSync(request);
    assert.deepEqual(
      result.operations.map(({ kind }) => kind),
      ['update', 'update'],
    );
    assert.equal(readTaskPrompt(result.operations[0].task.prompt).metadata.debug, true);
    assert.equal(result.operations[0].task.destination.id, 'another-test-dot');
  });

  test('should refuse duplicate markers and unmarked name collisions', () => {
    const existingTasks = saved();
    assert.throws(
      () =>
        planSync(
          input({ existingTasks: [...existingTasks, { ...existingTasks[0], id: 'duplicate' }] }),
        ),
      /native-task-ambiguous:sync/,
    );
    assert.throws(
      () =>
        planSync(
          input({
            existingTasks: [{ id: 'unowned', task: { name: 'Test sync', prompt: 'Not managed.' } }],
          }),
        ),
      /native-task-name-collision:sync/,
    );
  });

  test('should require existing task results and a verified execution context', () => {
    assert.throws(
      () => planSync(input({ existingTasks: undefined })),
      /existing-native-tasks-required/,
    );
    assert.throws(() => planSync(input({ context: {} })), /verified-execution/);
    const existingTasks = saved();
    delete existingTasks[0].task.execution;
    assert.throws(() => planSync(input({ existingTasks })), /native-task-field-required:execution/);
  });

  test('should reject unsupported jobs and malformed markers before preparing writes', () => {
    const request = input();
    request.manifest.automations[0].schedule = { kind: 'in', seconds: 60 };
    assert.throws(() => planSync(request), /recurring-schedule-required/);
    assert.throws(
      () => readTaskPrompt('<tanaabot-automation-metadata>broken'),
      /task-marker-invalid/,
    );
    request.manifest.automations[0] = { ...job('sync'), payload: { kind: 'command' } };
    assert.throws(() => planSync(request), /prompt-automation-required/);
  });
});
