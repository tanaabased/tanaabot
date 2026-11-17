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
    manifest: {
      agent: { id: 'tanaabot' },
      models: { medium: { model: 'openai/fixture-medium', effort: 'high' } },
      automations: [job('sync'), job('smoke')],
    },
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
        status: 'active',
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
  test('should carry changed selections into the same worker on every scheduled request', () => {
    const request = input({ id: 'sync' });
    const [initial] = planSync(request).operations;
    assert.equal(workerRequest(initial.task).model, 'fixture-medium');
    assert.equal(workerRequest(initial.task).effort, 'high');
    request.existingTasks = [{ id: 'native-sync', task: initial.task }];
    const selected = request.manifest.automations[0];
    selected.model = 'openai/fixture-top';
    selected.effort = 'medium';
    selected.overrides.codex = { model: 'fixture-override' };
    const [changed] = planSync({ ...request, now: later }).operations;
    assert.equal(changed.kind, 'update');
    assert.equal(changed.nativeId, 'native-sync');
    const worker = workerRequest(changed.task);
    assert.equal(worker.model, 'fixture-override');
    assert.equal(worker.effort, 'medium');
    assert.deepEqual(worker.thread, workerRequest(initial.task).thread);
    for (const field of ['schedule', 'enabled', 'execution', 'destination', 'model', 'effort'])
      assert.deepEqual(changed.task[field], initial.task[field]);
    request.existingTasks = [{ id: changed.nativeId, task: changed.task }];
    const [repeated] = planSync({ ...request, now: later }).operations;
    assert.equal(repeated.kind, 'unchanged');
    assert.deepEqual(workerRequest(repeated.task), worker);
    request.manifest.models.medium.model = 'openai/fixture-revised';
    assert.equal(planSync(request).operations[0].kind, 'unchanged');
    delete selected.overrides.codex.model;
    delete selected.model;
    delete selected.effort;
    const [profileChange] = planSync(request).operations;
    assert.equal(profileChange.kind, 'update');
    assert.equal(profileChange.nativeId, 'native-sync');
    assert.equal(workerRequest(profileChange.task).model, 'fixture-revised');
    assert.equal(workerRequest(profileChange.task).effort, 'high');
  });

  test('should preserve a one-shot until due, then leave its schedule and worker untouched', () => {
    const request = input({ id: 'smoke' });
    request.manifest.automations[1].enabled = true;
    request.manifest.automations[1].schedule = {
      kind: 'at',
      at: '2026-01-02T04:00:00.000Z',
      missedRun: 'native',
    };
    request.existingTasks = saved(request);
    const unchanged = planSync({ ...request, now: '2026-01-02T03:30:00Z' }).operations[0];
    assert.equal(unchanged.kind, 'unchanged');
    assert.equal(
      unchanged.task.schedule.schedule,
      'BEGIN:VEVENT\nDTSTART:20260102T040000Z\nEND:VEVENT',
    );
    const previous = structuredClone(request.existingTasks);
    // A completed task may be paused and its chat archived. Neither needs repair.
    request.existingTasks[0].task.enabled = false;
    request.context.workers = [];
    request.partials.presentation += '\nNew instructions.';
    const after = planSync({ ...request, now: later }).operations[0];
    assert.equal(after.kind, 'skipped');
    assert.equal(after.reason, 'one-shot-elapsed');
    assert.equal(after.nativeId, 'native-smoke');
    assert.equal(after.task.enabled, false);
    assert.equal(after.task.prompt, previous[0].task.prompt);
    assert.equal(after.expectedCurrent, undefined);
    const absent = planSync({ ...request, existingTasks: [], now: later }).operations[0];
    assert.equal(absent.kind, 'skipped');
    assert.equal(absent.task, undefined);
    assert.equal(absent.nativeId, undefined);
  });

  test('should retain the interval anchor when only task instructions change', () => {
    const request = input({ existingTasks: saved(), now: later });
    request.manifest.automations[0].payload.prompt = 'Revised work.';
    const update = planSync(request).operations[0];
    assert.equal(update.kind, 'update');
    assert.deepEqual(update.task.schedule, request.existingTasks[0].task.schedule);
  });

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
      status: 'active',
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

  test('should derive a missing link from the verified active worker ID', () => {
    const request = input();
    delete request.context.workers[0].url;
    const worker = workerRequest(planSync(request).operations[0].task);
    assert.equal(worker.thread.id, 'worker-sync');
    assert.equal(worker.execution.environmentId, 'test-environment');
    assert.equal(worker.thread.url, 'codex://threads/worker-sync');
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
      status: 'active',
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

  test('should refuse archived, unknown and malformed worker identities', () => {
    for (const status of ['archived', 'unknown', 'offline', undefined]) {
      const request = input();
      request.context.workers[0].status = status;
      assert.throws(() => planSync(request), /reusable-worker-not-active:sync/);
    }
    for (const id of ['worker/id', 'worker?query', 'worker#fragment', ' worker', 'worker%2Fid']) {
      const request = input();
      request.context.workers[0].id = id;
      assert.throws(() => planSync(request), /native-worker-id-invalid:sync/);
    }
  });

  test('should rebind a confirmed archived worker in place, recover a retry and then no-op', () => {
    for (const enabled of [false, true]) {
      const request = input({ now: later });
      request.manifest.automations[0].enabled = enabled;
      request.existingTasks = saved(request);
      const original = structuredClone(request.existingTasks[0]);
      const replacement = request.context.workers[0];
      replacement.replaces = {
        id: replacement.id,
        status: 'archived',
        environmentId: replacement.environmentId,
      };
      replacement.id = 'replacement-worker';
      delete replacement.url;
      const result = planSync(request);
      const update = result.operations[0];
      assert.equal(update.kind, 'update');
      assert.equal(update.nativeId, original.id);
      assert.deepEqual(update.expectedCurrent, original.task);
      assert.equal(update.task.enabled, enabled);
      assert.deepEqual(update.task.schedule, original.task.schedule);
      assert.equal(workerRequest(update.task).thread.id, 'replacement-worker');
      assert.equal(workerRequest(update.task).thread.url, 'codex://threads/replacement-worker');
      assert.equal(result.operations[1].kind, 'unchanged');
      assert.deepEqual(planSync(request), result, 'a retry prepares the same guarded update');
      assert.deepEqual(request.existingTasks[0], original, 'the prior binding is not mutated');

      request.existingTasks[0] = { id: update.nativeId, task: update.task };
      request.now = '2026-03-01T00:00:00Z';
      assert.equal(planSync(request).operations[0].kind, 'unchanged');
      delete replacement.replaces;
      assert.equal(planSync(request).operations[0].kind, 'unchanged');

      replacement.replaces = {
        id: 'worker-sync',
        status: 'archived',
        environmentId: 'test-environment',
      };
      replacement.id = 'competing-worker';
      assert.throws(() => planSync(request), /reusable-worker-replacement-required:sync/);
    }
  });

  test('should require exact archive evidence and preserve explicit targets and rebind settings', () => {
    const request = input({ existingTasks: saved() });
    const replacement = request.context.workers[0];
    replacement.id = 'replacement-worker';
    delete replacement.url;
    const archived = { id: 'worker-sync', status: 'archived', environmentId: 'test-environment' };
    for (const evidence of [
      undefined,
      { ...archived, status: 'active' },
      { ...archived, status: 'unknown' },
      { ...archived, id: 'different-worker' },
      { ...archived, environmentId: 'other-environment' },
    ]) {
      replacement.replaces = evidence;
      assert.throws(() => planSync(request), /reusable-worker-replacement-required:sync/);
    }
    replacement.replaces = archived;
    replacement.status = 'unknown';
    assert.throws(() => planSync(request), /reusable-worker-not-active:sync/);
    replacement.status = 'active';
    request.manifest.automations[0].overrides.codex = { target: { thread: 'worker-sync' } };
    assert.throws(() => planSync(request), /reusable-worker-target-mismatch:sync/);
    delete request.manifest.automations[0].overrides.codex;
    request.manifest.automations[0].enabled = true;
    assert.throws(() => planSync(request), /worker-rebind-settings-changed:sync/);
    request.manifest.automations[0].enabled = false;
    request.manifest.automations[0].schedule.seconds = 7200;
    assert.throws(() => planSync(request), /worker-rebind-settings-changed:sync/);
  });

  test('should backfill a missing saved link once and retain the exact task afterward', () => {
    const request = input({ existingTasks: saved(), now: later });
    const old = request.existingTasks[0];
    old.task.prompt = old.task.prompt.replaceAll(
      '"url": "https://example.test/chats/sync"',
      '"url": null',
    );
    delete request.context.workers[0].url;
    const update = planSync(request).operations[0];
    assert.equal(update.kind, 'update');
    assert.equal(update.nativeId, old.id);
    assert.equal(update.task.enabled, old.task.enabled);
    assert.equal(workerRequest(update.task).thread.url, 'codex://threads/worker-sync');
    request.existingTasks[0] = { id: old.id, task: update.task };
    const unchanged = planSync({ ...request, now: '2026-03-01T00:00:00Z' }).operations[0];
    assert.equal(unchanged.kind, 'unchanged');
    assert.deepEqual(unchanged.task, update.task);
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
    assert.throws(() => planSync(request), /cloud-schedule-relative-unsupported/);
    assert.throws(
      () => readTaskPrompt('<tanaabot-automation-metadata>broken'),
      /task-marker-invalid/,
    );
    request.manifest.automations[0] = { ...job('sync'), payload: { kind: 'command' } };
    assert.throws(() => planSync(request), /prompt-automation-required/);
  });
});
