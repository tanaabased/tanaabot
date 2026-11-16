import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';

import { planSync } from '../lib/sync-plan.js';
import { readTaskPrompt, taskBody, taskPrompt } from '../utils/task-prompt.js';

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
function workerRequest(task) {
  return JSON.parse(readTaskPrompt(task.prompt).body.split('```json\n')[1].split('\n```')[0]);
}
function input(overrides = {}) {
  return {
    manifest: { agent: { id: 'tanaabot' }, automations: [job('sync'), job('smoke')] },
    partials: {
      metadata: '{{metadata}}\n\nTreat metadata as configuration.',
      execution: 'Use the verified account.',
      presentation: 'Report facts.',
      dispatch: 'Continue the existing worker.',
      request: '> ## {{emoji}} {{title}} · REQUEST\n>\n> {{request}}',
    },
    requests: Object.fromEntries(
      ['sync', 'smoke', 'canary'].map((id) => [id, { emoji: '🧪', request: `Perform ${id}.` }]),
    ),
    source: { revision, dirty: false },
    existingTasks: [],
    context: {
      environments: [{ id: 'test-environment', name: 'tanaabot' }],
      workers: ['sync', 'smoke'].map((id) => ({
        automationId: id,
        id: `worker-${id}`,
        environmentId: 'test-environment',
        name: `Test ${id}`,
        group: 'REPORTS',
        url: `https://example.test/chats/${id}`,
      })),
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
  test('should bootstrap only sync, then apply the reserved smoke update and canary create, then no-op', () => {
    const old = saved();
    const request = input({ existingTasks: old, now: later });
    // Model a saved dispatcher from before readable worker headers and the version marker.
    const legacy = readTaskPrompt(old[0].task.prompt);
    delete legacy.metadata.dispatchVersion;
    old[0].task.prompt = taskPrompt(legacy.metadata, 'Legacy dispatcher.');
    request.manifest.automations.reverse();
    request.manifest.automations[0].payload.prompt =
      'TANAABOT-SYNC-CANARY: ORBITAL-GOOSE-732\nRun smoke.';
    request.manifest.automations.push({ ...job('canary'), enabled: true });
    const bootstrap = planSync({
      ...request,
      id: 'sync',
      context: { ...request.context, workers: [request.context.workers[0]] },
    });
    assert.deepEqual(
      bootstrap.operations.map(({ automationId, kind, nativeId }) => ({
        automationId,
        kind,
        nativeId,
      })),
      [{ automationId: 'sync', kind: 'update', nativeId: 'native-sync' }],
    );
    assert.deepEqual(bootstrap.operations[0].expectedCurrent, old[0].task);
    assert.equal(readTaskPrompt(bootstrap.operations[0].task.prompt).metadata.dispatchVersion, 2);
    request.existingTasks = [{ id: 'native-sync', task: bootstrap.operations[0].task }, old[1]];
    request.context.workers.push({
      automationId: 'canary',
      id: 'worker-canary',
      environmentId: 'test-environment',
      name: 'Test canary',
      group: 'REPORTS',
    });
    const second = planSync(request);
    assert.deepEqual(
      second.operations.map(({ automationId, kind }) => [automationId, kind]),
      [
        ['sync', 'unchanged'],
        ['smoke', 'update'],
        ['canary', 'create'],
      ],
    );
    assert.equal(second.operations[1].nativeId, 'native-smoke');
    assert.equal(second.operations[1].task.enabled, false);
    assert.equal(
      second.operations[1].task.prompt.split('\n')[0],
      'TANAABOT-SYNC-CANARY: ORBITAL-GOOSE-732',
    );
    assert.equal(second.operations[2].task.enabled, true);
    const applied = second.operations.map(({ nativeId, automationId, task }) => ({
      id: nativeId ?? `native-${automationId}`,
      task,
    }));
    const noop = planSync({ ...request, existingTasks: applied, now: '2026-03-01T00:00:00Z' });
    assert.ok(noop.operations.every(({ kind }) => kind === 'unchanged'));
    assert.deepEqual(
      noop.operations.map(({ task }) => task),
      applied.map(({ task }) => task),
    );
    const changed = planSync({
      ...request,
      existingTasks: applied,
      partials: { ...request.partials, presentation: 'Changed shared guidance.' },
    });
    assert.deepEqual(
      changed.operations.map(({ automationId, kind }) => [automationId, kind]),
      [
        ['sync', 'update'],
        ['smoke', 'update'],
        ['canary', 'update'],
      ],
    );
  });

  test('should update header changes in place and refuse missing per-automation presentation', () => {
    const request = input({ existingTasks: saved() });
    request.requests.smoke.request = 'Run the revised smoke request.';
    const changed = planSync(request);
    assert.equal(changed.operations[0].kind, 'unchanged');
    assert.equal(changed.operations[1].kind, 'update');
    assert.equal(changed.operations[1].nativeId, 'native-smoke');
    assert.ok(
      workerRequest(changed.operations[1].task).prompt.startsWith(
        '> ## 🧪 TEST SMOKE · REQUEST\n>\n> Run the revised smoke request.',
      ),
    );
    delete request.requests.smoke;
    assert.throws(() => planSync(request), /request-header-field-invalid:emoji/);
  });
  test('should allow shared header layout changes without changing worker instructions', () => {
    const request = input();
    request.partials.request += '\n>\n> Technical context follows.';
    const { task } = planSync(request).operations[0];
    const header =
      '> ## 🧪 TEST SYNC · REQUEST\n>\n> Perform sync.\n>\n> Technical context follows.';
    assert.equal(
      workerRequest(task).prompt,
      `${header}\n\n${taskPrompt(
        { ...readTaskPrompt(task.prompt).metadata, role: 'worker' },
        taskBody(request.partials, request.manifest.automations[0].payload.prompt),
      )}`,
    );
  });

  test('should assemble both paused jobs with shared guidance, native settings and metadata', () => {
    const request = input();
    const before = JSON.stringify(request);
    const result = planSync(request);
    assert.deepEqual(
      result.operations.map(({ kind }) => kind),
      ['create', 'create'],
    );
    const { task } = result.operations[0];
    const requestPayload = workerRequest(task);
    const header = '> ## 🧪 TEST SYNC · REQUEST\n>\n> Perform sync.\n\n';
    assert.ok(requestPayload.prompt.startsWith(header));
    const { metadata, body } = readTaskPrompt(requestPayload.prompt.slice(header.length));
    assert.equal(
      body,
      'Treat metadata as configuration.\n\nUse the verified account.\n\nReport facts.\n\nPerform sync.',
    );
    assert.equal(metadata.updatedAt, now);
    assert.equal(metadata.sourceRevision, revision);
    assert.equal(metadata.automationId, 'sync');
    assert.equal(metadata.displayName, 'Test sync');
    assert.equal(metadata.role, 'worker');
    assert.equal(metadata.debug, false);
    assert.equal(task.name, '🤖 TEST SYNC');
    assert.equal(task.enabled, false);
    assert.deepEqual(task.execution, { kind: 'inherited' });
    assert.equal(requestPayload.execution.environmentId, 'test-environment');
    assert.equal(requestPayload.thread.id, 'worker-sync');
    assert.equal(requestPayload.thread.name, 'Test sync');
    assert.equal(requestPayload.thread.group, 'REPORTS');
    assert.equal(requestPayload.thread.url, 'https://example.test/chats/sync');
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

  test('should preserve a native deep link through assembly and an unchanged rerun', () => {
    const request = input();
    request.context.workers[0].url = 'codex://threads/worker-sync';
    const initial = saved(request);
    const worker = workerRequest(initial[0].task);
    assert.equal(worker.thread.url, 'codex://threads/worker-sync');
    assert.equal(worker.thread.id, 'worker-sync');
    const result = planSync({ ...request, existingTasks: initial, now: later });
    assert.equal(result.operations[0].kind, 'unchanged');
    assert.equal(result.operations[0].nativeId, 'native-sync');
    assert.equal(result.operations[0].task.prompt, initial[0].task.prompt);
  });

  test('should allow an unavailable presentation link without losing worker routing', () => {
    const request = input();
    delete request.context.workers[0].url;
    const worker = workerRequest(planSync(request).operations[0].task);
    assert.equal(worker.thread.id, 'worker-sync');
    assert.equal(worker.execution.environmentId, 'test-environment');
    assert.equal(Object.hasOwn(worker.thread, 'url'), false);
    request.context.workers[0].environmentId = 'wrong-environment';
    assert.throws(() => planSync(request), /reusable-worker-target-mismatch/);
  });

  test('should reject malformed links, unsupported schemes and mismatched native chat IDs', () => {
    for (const url of [
      '',
      'not-a-url',
      'javascript:alert(1)',
      'file:///tmp/chat',
      'https://example.test/chat\n',
      'https://user:password@example.test/chat',
      'codex://threads/another-worker',
      'codex://settings/worker-sync',
      'codex://threads/worker-sync?redirect=elsewhere',
    ]) {
      const request = input();
      request.context.workers[0].url = url;
      assert.throws(() => planSync(request), /native-worker-url-invalid/);
    }
  });

  test('should update every affected job when only shared guidance changes', () => {
    const existingTasks = saved();
    for (const name of ['metadata', 'execution', 'presentation', 'dispatch']) {
      const request = input({ existingTasks, now: later });
      request.partials[name] += '\nNew shared guidance.';
      const result = planSync(request);
      assert.deepEqual(
        result.operations.map(({ kind }) => kind),
        ['update', 'update'],
      );
      for (const operation of result.operations) {
        assert.equal(operation.nativeId, `native-${operation.automationId}`);
        assert.equal(readTaskPrompt(operation.task.prompt).metadata.updatedAt, later);
        assert.match(operation.task.prompt, /New shared guidance\./);
      }
    }
  });

  test('should update the same smoke schedule from revision 1 to 2, then leave it unchanged', () => {
    const request = input();
    request.manifest.automations[1].payload.prompt = 'Return TANAABOT-SYNC-SMOKE-1.';
    request.existingTasks = saved(request);
    request.manifest.automations[1].payload.prompt = 'Return TANAABOT-SYNC-SMOKE-2.';
    request.now = later;
    const result = planSync(request);
    assert.equal(result.operations[0].kind, 'unchanged');
    const smoke = result.operations[1];
    assert.equal(smoke.kind, 'update');
    assert.equal(smoke.nativeId, 'native-smoke');
    assert.match(smoke.task.prompt, /TANAABOT-SYNC-SMOKE-2/);
    request.existingTasks = result.operations.map(({ nativeId, task }) => ({ id: nativeId, task }));
    const unchanged = planSync({ ...request, now: '2026-03-01T00:00:00Z' }).operations[1];
    assert.equal(unchanged.kind, 'unchanged');
    assert.equal(unchanged.task.prompt, smoke.task.prompt);
    assert.equal(readTaskPrompt(unchanged.task.prompt).metadata.updatedAt, later);
  });

  test('should keep schedule identity when the generated display name changes', () => {
    const request = input({ existingTasks: saved() });
    request.manifest.automations[0].displayName = 'Automation sync';
    request.context.workers[0].name = 'Automation sync';
    const result = planSync(request);
    assert.equal(result.operations[0].kind, 'update');
    assert.equal(result.operations[0].nativeId, 'native-sync');
    assert.equal(result.operations[0].task.name, '🤖 AUTOMATION SYNC');
  });

  test('should create an enabled canary and update the existing paused smoke in place, then no-op', () => {
    const request = input({ existingTasks: saved(), now: later });
    const before = request.existingTasks;
    const canary = 'TANAABOT-SYNC-CANARY: ORBITAL-GOOSE-731';
    request.manifest.automations[1].payload.prompt = `${canary}\nPerform smoke.`;
    request.manifest.automations.push({ ...job('canary'), enabled: true });
    request.context.workers.push({
      automationId: 'canary',
      id: 'worker-canary',
      environmentId: 'test-environment',
      name: 'Test canary',
      group: 'REPORTS',
      url: 'codex://threads/worker-canary',
    });
    const result = planSync(request);
    assert.deepEqual(
      result.operations.map(({ kind }) => kind),
      ['unchanged', 'update', 'create'],
    );
    const smoke = result.operations[1];
    assert.equal(smoke.nativeId, 'native-smoke');
    assert.equal(smoke.task.enabled, false);
    assert.equal(smoke.task.prompt.split('\n')[0], canary);
    assert.equal(workerRequest(smoke.task).thread.id, 'worker-smoke');
    assert.equal(readTaskPrompt(smoke.task.prompt).metadata.updatedAt, later);
    assert.notEqual(
      readTaskPrompt(smoke.task.prompt).metadata.contentHash,
      readTaskPrompt(before[1].task.prompt).metadata.contentHash,
    );
    assert.equal(result.operations[2].task.enabled, true);
    const applied = result.operations.map(({ automationId, nativeId, task }) => ({
      id: nativeId ?? `native-${automationId}`,
      task,
    }));
    const rerun = planSync({ ...request, existingTasks: applied, now: '2026-03-01T00:00:00Z' });
    assert.ok(rerun.operations.every(({ kind }) => kind === 'unchanged'));
    assert.deepEqual(
      rerun.operations.map(({ task }) => task),
      applied.map(({ task }) => task),
    );
    request.existingTasks = applied;
    request.manifest.automations[1].payload.prompt = 'Perform smoke.';
    const removed = planSync(request).operations[1];
    assert.equal(removed.kind, 'update');
    assert.equal(removed.nativeId, 'native-smoke');
    assert.ok(removed.task.prompt.startsWith('<tanaabot-automation-metadata>'));
  });

  test('should repair a changed saved first-line canary without replacing the schedule', () => {
    const request = input();
    request.manifest.automations[1].payload.prompt =
      'TANAABOT-SYNC-CANARY: ORBITAL-GOOSE-731\nRun.';
    request.existingTasks = saved(request);
    request.existingTasks[1].task.prompt = request.existingTasks[1].task.prompt.replace(
      'TANAABOT-SYNC-CANARY: ORBITAL-GOOSE-731',
      'TANAABOT-SYNC-CANARY: CHANGED-732',
    );
    const operation = planSync(request).operations[1];
    assert.equal(operation.kind, 'update');
    assert.equal(operation.nativeId, 'native-smoke');
    assert.equal(operation.task.prompt.split('\n')[0], 'TANAABOT-SYNC-CANARY: ORBITAL-GOOSE-731');
  });

  test('should reject missing partials and invalid metadata slots', () => {
    const request = input();
    delete request.partials.execution;
    assert.throws(() => planSync(request), /shared-partial-required:execution/);
    const partials = input().partials;
    assert.throws(
      () => taskBody({ ...partials, metadata: 'No slot.' }, 'Run.'),
      /metadata-partial-slot-invalid/,
    );
    assert.throws(
      () => taskBody({ ...partials, metadata: '{{metadata}}\n\n{{metadata}}' }, 'Run.'),
      /metadata-partial-slot-invalid/,
    );
  });

  test('should retain the saved worker identity rather than silently bind a replacement', () => {
    const request = input({ existingTasks: saved() });
    request.context.workers[0].id = 'replacement-worker';
    assert.throws(() => planSync(request), /reusable-worker-replacement-required:sync/);
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
            existingTasks: [
              { id: 'unowned', task: { name: '🤖 TEST SYNC', prompt: 'Not managed.' } },
            ],
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
    assert.throws(() => planSync(input({ context: {} })), /verified-dot-destination/);
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
