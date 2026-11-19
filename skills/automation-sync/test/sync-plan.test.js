import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import automationTargets from '../lib/automation-targets.js';
import { planSync } from '../lib/sync-plan.js';
import { readTaskPrompt, taskBody } from '../utils/task-prompt.js';

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
function history(active, archived = []) {
  return {
    active: { source: 'history', ids: active, complete: true },
    archived: { source: 'history', ids: archived, complete: true },
  };
}
function input(overrides = {}) {
  return {
    manifest: {
      agent: { id: 'tanaabot' },
      models: { default: { model: 'openai/fixture-default', effort: 'high' } },
      automations: [job('automation-sync'), job('smoke')],
    },
    partials: {
      metadata: '{{metadata}}\n\nTreat metadata as configuration.',
      execution: 'Use the verified account.',
      presentation: 'Report facts.',
      dispatch: 'Continue the existing worker.',
      request: '> ## {{emoji}} {{title}} · REQUEST\n>\n> {{request}}',
      'sync-source': 'Fixture Dot source selection.',
      'sync-worker': 'Fixture worker source handoff.',
    },
    requests: Object.fromEntries(
      ['automation-sync', 'smoke'].map((id) => [id, { emoji: '🧪', request: `Perform ${id}.` }]),
    ),
    source: { revision, dirty: false },
    existingTasks: [],
    context: {
      environments: [{ id: 'test-environment', name: 'tanaabot' }],
      workerHistory: history(['worker-automation-sync', 'worker-smoke']),
      workers: ['automation-sync', 'smoke'].map((id) => ({
        automationId: id,
        id: `worker-${id}`,
        startup: 'passed',
        environmentId: 'test-environment',
        name: `Test ${id}`,
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
  test('should render the bounded Sync recovery route with the shared dispatcher', () => {
    const request = input();
    request.partials.dispatch = readFileSync(
      new URL('../../../prompts/dispatch-partial.md', import.meta.url),
      'utf8',
    );
    for (const { task } of planSync(request).operations) {
      const dispatcher = readTaskPrompt(task.prompt).body.split('## Worker request')[0];
      // the prompt owns this permission boundary; this does not test native tool execution.
      assert.match(dispatcher, /Only when this coordinator's `automationId` is `automation-sync`/);
      assert.match(dispatcher, /exact saved worker is archived or deleted/);
      assert.match(dispatcher, /Recover the synchronizer before dispatch/);
      assert.match(
        dispatcher,
        /For other automations,[\s\S]*?archived or deleted worker as needing Automation Sync\.\s+Stop dispatch without replacement/,
      );
      assert.match(dispatcher, /An active worker follows normal dispatch/);
      assert.match(dispatcher, /report the worker as Unverified and stop without sending/);
      assert.match(
        dispatcher,
        /reconcile any prior send for that exact invocation[\s\S]*?If the send was accepted, skip the send[\s\S]*?stop without sending again/,
      );
    }
  });

  test('should update both sync dispatchers in place and leave unrelated runs without source selection', () => {
    const request = input();
    request.manifest.automations.push(job('instruction-sync'));
    request.requests['instruction-sync'] = { emoji: '🔄', request: 'Perform instruction-sync.' };
    request.context.workers.push({
      ...request.context.workers[0],
      automationId: 'instruction-sync',
      id: 'pre-46-instruction-worker',
      name: 'Test instruction-sync',
    });
    request.context.workerHistory.active.ids.push('pre-46-instruction-worker');
    request.existingTasks = saved(request);
    for (const partial of ['sync-source', 'sync-worker']) {
      request.partials[partial] = readFileSync(
        new URL(`../../../prompts/${partial}-partial.md`, import.meta.url),
        'utf8',
      );
    }
    const { operations } = planSync(request);
    const reconfigured = operations.filter(({ kind }) => kind === 'update');
    assert.deepEqual(reconfigured.map(({ automationId }) => automationId).sort(), [
      'automation-sync',
      'instruction-sync',
    ]);
    for (const { task, expectedCurrent, nativeId, automationId } of reconfigured) {
      assert.equal(nativeId, `native-${automationId}`);
      assert.deepEqual(workerRequest(task).thread, workerRequest(expectedCurrent).thread);
      const dispatcher = readTaskPrompt(task.prompt).body.split('## Worker request')[0];
      assert.ok(dispatcher.includes(request.partials['sync-source'].trim()));
      const worker = workerRequest(task).prompt;
      assert.ok(worker.includes(request.partials['sync-worker'].trim()));
      assert.ok(!worker.includes(request.partials['sync-source'].trim()));
    }
    const smoke = operations.find(({ automationId }) => automationId === 'smoke');
    assert.equal(smoke.kind, 'unchanged');
    assert.ok(!smoke.task.prompt.includes(request.partials['sync-source'].trim()));
    assert.ok(!smoke.task.prompt.includes(request.partials['sync-worker'].trim()));
  });

  test('should carry changed selections into the same worker on every scheduled request', () => {
    const request = input({ id: 'automation-sync' });
    const [initial] = planSync(request).operations;
    assert.equal(workerRequest(initial.task).model, 'fixture-default');
    assert.equal(workerRequest(initial.task).effort, 'high');
    request.existingTasks = [{ id: 'native-automation-sync', task: initial.task }];
    const selected = request.manifest.automations[0];
    selected.model = 'openai/fixture-top';
    selected.effort = 'medium';
    selected.overrides.codex = { model: 'fixture-override' };
    const [changed] = planSync({ ...request, now: later }).operations;
    assert.equal(changed.kind, 'update');
    assert.equal(changed.nativeId, 'native-automation-sync');
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
    request.manifest.models.default.model = 'openai/fixture-revised';
    assert.equal(planSync(request).operations[0].kind, 'unchanged');
    delete selected.overrides.codex.model;
    delete selected.model;
    delete selected.effort;
    const [profileChange] = planSync(request).operations;
    assert.equal(profileChange.kind, 'update');
    assert.equal(profileChange.nativeId, 'native-automation-sync');
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
    // a completed task may be paused and its chat archived. neither needs repair.
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
    const original = workerRequest(planSync(request).operations[0].task).prompt;
    request.partials.request += '\n>\n> Technical context follows.';
    const { task } = planSync(request).operations[0];
    const header =
      '> ## 🧪 TEST AUTOMATION-SYNC · REQUEST\n>\n> Perform automation-sync.\n>\n> Technical context follows.';
    const prompt = workerRequest(task).prompt;
    assert.ok(prompt.startsWith(`${header}\n\n`));
    const body = (value) =>
      readTaskPrompt(value.slice(value.indexOf('<tanaabot-automation-metadata>'))).body;
    assert.equal(body(prompt), body(original));
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
    const header = '> ## 🧪 TEST AUTOMATION-SYNC · REQUEST\n>\n> Perform automation-sync.\n\n';
    assert.ok(requestPayload.prompt.startsWith(header));
    const { metadata, body } = readTaskPrompt(requestPayload.prompt.slice(header.length));
    assert.equal(
      body,
      'Treat metadata as configuration.\n\nUse the verified account.\n\nReport facts.\n\nFixture worker source handoff.\n\nPerform automation-sync.',
    );
    assert.equal(metadata.updatedAt, now);
    assert.equal(metadata.sourceRevision, revision);
    assert.equal(metadata.automationId, 'automation-sync');
    assert.equal(metadata.displayName, 'Test automation-sync');
    assert.equal(metadata.role, 'worker');
    assert.equal(metadata.debug, false);
    assert.equal(task.name, '🤖 TEST AUTOMATION-SYNC');
    assert.equal(task.enabled, false);
    assert.deepEqual(task.execution, { kind: 'inherited' });
    assert.equal(requestPayload.execution.environmentId, 'test-environment');
    assert.equal(requestPayload.thread.id, 'worker-automation-sync');
    assert.equal(requestPayload.thread.name, 'Test automation-sync');
    assert.equal(Object.hasOwn(requestPayload.thread, 'group'), false);
    assert.equal(requestPayload.thread.url, 'https://example.test/chats/automation-sync');
    assert.deepEqual(task.destination, request.context.destination);
    assert.equal(JSON.stringify(request), before);
  });

  test('should use the thread name when display-name is omitted without changing saved titles', () => {
    const request = input({ id: 'automation-sync' });
    const job = request.manifest.automations[0];
    job.thread = { name: job.displayName };
    const [initial] = planSync(request).operations;
    request.existingTasks = [{ id: 'native-automation-sync', task: initial.task }];
    delete job.displayName;
    const [same] = planSync(request).operations;
    assert.equal(same.kind, 'unchanged');
    assert.deepEqual(same.task, initial.task);
    assert.equal(readTaskPrompt(same.task.prompt).metadata.displayName, 'Test automation-sync');
    assert.match(workerRequest(same.task).prompt, /TEST AUTOMATION-SYNC · REQUEST/);
    job.displayName = 'Separate schedule title';
    const [changed] = planSync(request).operations;
    assert.equal(changed.task.name, '🤖 SEPARATE SCHEDULE TITLE');
    assert.equal(workerRequest(changed.task).thread.name, 'Test automation-sync');
    assert.equal(readTaskPrompt(changed.task.prompt).metadata.displayName, job.displayName);
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
    assert.equal(result.operations[0].nativeId, 'native-automation-sync');
    assert.equal(result.operations[0].task.prompt, existingTasks[0].task.prompt);
    assert.equal(readTaskPrompt(result.operations[0].task.prompt).metadata.updatedAt, now);
  });

  test('should preserve a native deep link through assembly and an unchanged rerun', () => {
    const request = input();
    request.context.workers[0].url = 'codex://threads/worker-automation-sync';
    const initial = saved(request);
    const worker = workerRequest(initial[0].task);
    assert.equal(worker.thread.url, 'codex://threads/worker-automation-sync');
    assert.equal(worker.thread.id, 'worker-automation-sync');
    const result = planSync({ ...request, existingTasks: initial, now: later });
    assert.equal(result.operations[0].kind, 'unchanged');
    assert.equal(result.operations[0].nativeId, 'native-automation-sync');
    assert.equal(result.operations[0].task.prompt, initial[0].task.prompt);
  });

  test('should derive a missing link from the verified active worker ID', () => {
    const request = input();
    delete request.context.workers[0].url;
    const worker = workerRequest(planSync(request).operations[0].task);
    assert.equal(worker.thread.id, 'worker-automation-sync');
    assert.equal(worker.execution.environmentId, 'test-environment');
    assert.equal(worker.thread.url, 'codex://threads/worker-automation-sync');
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
      'codex://settings/worker-automation-sync',
      'codex://threads/worker-automation-sync?redirect=elsewhere',
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
    request.manifest.automations[1].payload.prompt = 'Summarize the daily report.';
    request.existingTasks = saved(request);
    request.manifest.automations[1].payload.prompt = 'Summarize the weekly report.';
    request.now = later;
    const result = planSync(request);
    assert.equal(result.operations[0].kind, 'unchanged');
    const smoke = result.operations[1];
    assert.equal(smoke.kind, 'update');
    assert.equal(smoke.nativeId, 'native-smoke');
    assert.match(smoke.task.prompt, /Summarize the weekly report/);
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
    assert.equal(result.operations[0].nativeId, 'native-automation-sync');
    assert.equal(result.operations[0].task.name, '🤖 AUTOMATION SYNC');
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
    request.context.workerHistory.active.ids.push('replacement-worker');
    assert.throws(() => planSync(request), /reusable-worker-replacement-required:automation-sync/);
  });

  test('should skip only the unverified binding when native history cannot settle the exact ID', () => {
    const id = 'worker-automation-sync';
    const smoke = 'worker-smoke';
    const sameChildren = { source: 'direct-children', ids: [id], complete: true };
    for (const workerHistory of [
      undefined,
      { active: sameChildren, archived: sameChildren },
      { active: sameChildren, archived: history([]).archived },
      { ...history([id]), archived: { ...history([]).archived, complete: false } },
      history([id, smoke], [id]),
      { ...history([`${id}-other`, smoke]), active: { ...history([]).active, complete: false } },
      { ...history([id]), archived: { source: 'history', complete: true } },
      { ...history([id, smoke]), deleted: { source: 'native-deletion', ids: [id] } },
      { ...history([smoke], [id]), deleted: { source: 'native-deletion', ids: [id] } },
      { active: history([smoke]).active, deleted: { source: 'lookup', ids: [id] } },
    ]) {
      const request = input({ existingTasks: saved() });
      request.context.workerHistory = workerHistory;
      request.context.workers[0].status = 'active'; // The old assertion cannot prove status.
      const [sync] = planSync(request).operations;
      assert.deepEqual(sync, {
        automationId: 'automation-sync',
        kind: 'skipped',
        reason: 'worker-status-unverified',
        nativeId: request.existingTasks[0].id,
        task: request.existingTasks[0].task,
      });
    }
    const request = input({ existingTasks: saved() });
    request.context.workerHistory = history([id, smoke], [id]);
    assert.equal(planSync(request).operations[1].kind, 'unchanged');
    request.context.workerHistory = history([id, smoke]);
    request.context.workerHistory.active.complete = false; // The exact IDs were already found.
    assert.ok(planSync(request).operations.every(({ kind }) => kind === 'unchanged'));
  });

  test('should mark a confirmed archived binding as pending recovery', () => {
    const request = input({ existingTasks: saved() });
    request.context.workerHistory = history(['worker-smoke'], ['worker-automation-sync']);
    const [sync, smoke] = planSync(request).operations;
    assert.equal(sync.kind, 'skipped');
    assert.equal(sync.reason, 'worker-archived');
    assert.equal(smoke.kind, 'unchanged');
  });

  test('should mark verified deleted bindings as pending recovery for all selected automations', () => {
    const request = input({ existingTasks: saved() });
    for (const workerHistory of [
      history(['worker-automation-sync-other']),
      {
        deleted: { source: 'native-deletion', ids: ['worker-automation-sync', 'worker-smoke'] },
      },
    ]) {
      request.context.workerHistory = workerHistory;
      assert.deepEqual(
        planSync(request).operations.map(({ automationId, kind, reason }) => [
          automationId,
          kind,
          reason,
        ]),
        [
          ['automation-sync', 'skipped', 'worker-deleted'],
          ['smoke', 'skipped', 'worker-deleted'],
        ],
      );
    }
  });

  test('should use the same rebind for an archived or deleted worker during a full sync', () => {
    for (const status of ['archived', 'deleted']) {
      const request = input({ existingTasks: saved() });
      const original = request.existingTasks[1];
      const worker = request.context.workers[1];
      worker.replaces = { id: worker.id, status, environmentId: worker.environmentId };
      worker.id = 'replacement-smoke';
      delete worker.url;
      request.context.workerHistory = history(
        ['worker-automation-sync', worker.id],
        status === 'archived' ? [worker.replaces.id] : [],
      );
      const [sync, update] = planSync(request).operations;
      assert.equal(sync.kind, 'unchanged');
      assert.equal(update.kind, 'update');
      assert.equal(update.nativeId, original.id);
      assert.deepEqual(update.task.schedule, original.task.schedule);
      assert.equal(workerRequest(update.task).thread.id, worker.id);
    }
  });

  test('should refuse malformed worker identities', () => {
    for (const id of ['worker/id', 'worker?query', 'worker#fragment', ' worker', 'worker%2Fid']) {
      const request = input();
      request.context.workers[0].id = id;
      assert.throws(() => planSync(request), /native-worker-id-invalid:automation-sync/);
    }
  });

  test('should rebind a confirmed retired Sync worker in place, recover a retry and then no-op', () => {
    for (const [status, enabled] of [
      ['archived', false],
      ['archived', true],
      ['deleted', false],
      ['deleted', true],
    ]) {
      const request = input({ now: later });
      request.manifest.automations[0].enabled = enabled;
      request.existingTasks = saved(request);
      const original = structuredClone(request.existingTasks[0]);
      const replacement = request.context.workers[0];
      replacement.replaces = {
        id: replacement.id,
        status,
        environmentId: replacement.environmentId,
      };
      replacement.id = 'replacement-worker';
      request.context.workerHistory = history(
        ['replacement-worker', 'worker-smoke'],
        status === 'archived' ? ['worker-automation-sync'] : [],
      );
      delete replacement.url;
      const result = planSync(request);
      const update = result.operations[0];
      assert.equal(update.kind, 'update');
      assert.equal(update.nativeId, original.id);
      assert.deepEqual(update.expectedCurrent, original.task);
      assert.equal(update.task.enabled, enabled);
      assert.deepEqual(update.task.schedule, original.task.schedule);
      assert.deepEqual(update.task.destination, original.task.destination);
      assert.deepEqual(
        workerRequest(update.task).execution,
        workerRequest(original.task).execution,
      );
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
        id: 'worker-automation-sync',
        status,
        environmentId: 'test-environment',
      };
      replacement.id = 'competing-worker';
      request.context.workerHistory.active.ids.push('competing-worker');
      assert.throws(
        () => planSync(request),
        /reusable-worker-replacement-required:automation-sync/,
      );
    }
  });

  test('should require matching deletion evidence, passed startup and the original environment', () => {
    const request = input({ existingTasks: saved() });
    const [replacement] = request.context.workers;
    replacement.id = 'replacement-worker';
    delete replacement.url;
    replacement.replaces = {
      id: 'worker-automation-sync',
      status: 'deleted',
      environmentId: replacement.environmentId,
    };
    request.context.workerHistory = history([replacement.id, 'worker-smoke']);
    request.context.workerHistory.archived.complete = false;
    assert.equal(planSync(request).operations[0].reason, 'worker-status-unverified');

    request.context.workerHistory.archived.complete = true;
    replacement.replaces.status = 'archived';
    assert.throws(() => planSync(request), /reusable-worker-replacement-required:automation-sync/);
    replacement.replaces.status = 'deleted';
    replacement.startup = undefined;
    assert.throws(() => planSync(request), /reusable-worker-startup-not-passed:automation-sync/);
    replacement.startup = 'passed';
    replacement.replaces.environmentId = 'other-environment';
    assert.throws(() => planSync(request), /reusable-worker-replacement-required:automation-sync/);
  });

  test('should require exact archive evidence and preserve explicit targets and rebind settings', () => {
    const request = input({ existingTasks: saved() });
    const replacement = request.context.workers[0];
    replacement.id = 'replacement-worker';
    request.context.workerHistory = history(
      ['replacement-worker', 'worker-smoke'],
      ['worker-automation-sync'],
    );
    delete replacement.url;
    const archived = {
      id: 'worker-automation-sync',
      status: 'archived',
      environmentId: 'test-environment',
    };
    for (const evidence of [
      undefined,
      { ...archived, status: 'active' },
      { ...archived, status: 'unknown' },
      { ...archived, id: 'different-worker' },
      { ...archived, environmentId: 'other-environment' },
    ]) {
      replacement.replaces = evidence;
      assert.throws(
        () => planSync(request),
        /reusable-worker-replacement-required:automation-sync/,
      );
    }
    replacement.replaces = archived;
    request.context.workerHistory.active.ids.push(archived.id);
    assert.equal(planSync(request).operations[0].reason, 'worker-status-unverified');
    request.context.workerHistory.active.ids.pop();
    request.context.workerHistory.archived.ids.push(replacement.id);
    assert.equal(planSync(request).operations[0].reason, 'worker-status-unverified');
    request.context.workerHistory.archived.ids.pop();
    request.manifest.automations[0].overrides.codex = {
      target: { thread: 'worker-automation-sync' },
    };
    assert.throws(() => planSync(request), /reusable-worker-target-mismatch:automation-sync/);
    delete request.manifest.automations[0].overrides.codex;
    request.manifest.automations[0].enabled = true;
    assert.throws(() => planSync(request), /worker-rebind-settings-changed:automation-sync/);
    request.manifest.automations[0].enabled = false;
    request.manifest.automations[0].schedule.seconds = 7200;
    assert.throws(() => planSync(request), /worker-rebind-settings-changed:automation-sync/);
  });

  test('should preserve destination and coordinator settings during a worker rebind', () => {
    for (const [field, value] of [
      ['destination', { kind: 'dot', id: 'other-dot' }],
      ['execution', { kind: 'other' }],
      ['model', 'saved-coordinator-model'],
      ['effort', 'medium'],
    ]) {
      const request = input({ id: 'automation-sync', existingTasks: saved() });
      const worker = request.context.workers[0];
      worker.replaces = {
        id: worker.id,
        status: 'archived',
        environmentId: worker.environmentId,
      };
      worker.id = 'replacement-sync';
      request.context.workerHistory = history([worker.id], [worker.replaces.id]);
      request.existingTasks[0].task[field] = value;
      assert.throws(() => planSync(request), /worker-rebind-settings-changed:automation-sync/);
    }
  });

  test('should keep group-only changes out of worker payloads and schedule comparison', () => {
    const request = input({ id: 'automation-sync' });
    request.manifest.automations[0].group = 'REPORTS';
    const [initial] = planSync(request).operations;
    request.existingTasks = [{ id: 'native-automation-sync', task: initial.task }];
    request.manifest.automations[0].group = 'CHECKS';
    request.context.workers[0].group = 'WRONG';
    const [unchanged] = planSync(request).operations;
    assert.equal(unchanged.kind, 'unchanged');
    assert.deepEqual(unchanged.task, initial.task);
    assert.equal(Object.hasOwn(unchanged, 'placement'), false);
    assert.equal(Object.hasOwn(workerRequest(initial.task).thread, 'group'), false);
    delete request.manifest.automations[0].group;
    assert.equal(planSync(request).operations[0].kind, 'unchanged');
  });

  test('should block replacement on failed or unverified startup and mismatched environments despite optional placement', () => {
    const request = input({ id: 'automation-sync', existingTasks: saved() });
    const worker = request.context.workers[0];
    worker.replaces = {
      id: worker.id,
      status: 'archived',
      environmentId: worker.environmentId,
    };
    worker.id = 'replacement-sync';
    request.context.workerHistory = history([worker.id], [worker.replaces.id]);
    delete worker.group;
    for (const startup of ['failed', 'unverified', undefined]) {
      worker.startup = startup;
      assert.throws(() => planSync(request), /reusable-worker-startup-not-passed:automation-sync/);
    }
    worker.startup = 'passed';
    worker.environmentId = 'wrong-environment';
    assert.throws(() => planSync(request), /reusable-worker-target-mismatch:automation-sync/);
  });

  test('should preflight a manual Sync rebind with no running worker and stop at the verified update', () => {
    const request = input({ id: 'automation-sync', existingTasks: saved() });
    const [sync, other] = request.existingTasks;
    const retired = workerRequest(sync.task);
    request.context = {
      environments: request.context.environments,
      destination: sync.task.destination,
      timezone: sync.task.schedule.default_timezone,
    };
    request.manifest.automations[0].overrides.codex = { model: 'fixture-new', effort: 'medium' };
    const targets = automationTargets(request.manifest, request.context, request.id, now);
    assert.equal(targets.length, 1);
    const [target] = targets;
    assert.equal(target.execution.environmentId, retired.execution.environmentId);
    assert.deepEqual([target.model, target.effort], ['fixture-new', 'medium']);

    // native startup and save results are fixtures. only the DOT has a computer at preflight.
    request.context.workers = [
      {
        automationId: target.automationId,
        id: 'initialized-replacement',
        name: target.thread.name,
        startup: 'passed',
        environmentId: target.execution.environmentId,
        replaces: {
          id: retired.thread.id,
          status: 'archived',
          environmentId: retired.execution.environmentId,
        },
      },
    ];
    request.context.workerHistory = history(['initialized-replacement'], [retired.thread.id]);
    const plan = planSync(request);
    assert.equal(plan.operations.length, 1);
    const [update] = plan.operations;
    assert.equal(update.kind, 'update');
    assert.equal(update.nativeId, sync.id);
    assert.deepEqual(update.expectedCurrent, sync.task);
    const binding = workerRequest(update.task);
    assert.equal(binding.thread.id, 'initialized-replacement');
    assert.deepEqual([binding.model, binding.effort], [target.model, target.effort]);
    request.existingTasks = [{ id: update.nativeId, task: update.task }, other];
    delete request.context.workers[0].replaces;
    assert.deepEqual(
      planSync(request).operations.map(({ automationId, kind }) => [automationId, kind]),
      [['automation-sync', 'unchanged']],
    );

    // the native dispatch decision belongs to the skill, outside the read-only planner.
    const guidance = readFileSync(
      new URL('../references/native-tasks.md', import.meta.url),
      'utf8',
    );
    const recovery = guidance
      .split('### Recover the synchronizer before dispatch')[1]
      .split('### Initialization card')[0];
    assert.match(recovery, /owning Dot's own cloud computer[\s\S]*?`mode: "targets"`/);
    assert.match(
      recovery,
      /Manual `automation-sync`-only update\.[^\n]*report it and stop\.\s+Do not dispatch/,
    );
    assert.match(
      recovery,
      /Scheduled occurrence or Run now\.[^\n]*Resume that same occurrence once/,
    );
    assert.match(recovery, /A full manual sync resumes its original invocation/);
    assert.match(
      recovery,
      /reconcile any earlier send for that exact invocation[\s\S]*?already accepted[\s\S]*?stop without sending again/,
    );
  });

  test('should rebind the deleted Sync worker before resuming the original full sync', () => {
    const request = input({ id: 'automation-sync' });
    request.existingTasks = saved(request);
    request.manifest.automations = [job('automation-sync'), job('cloud-update')];
    request.requests['cloud-update'] = { emoji: '📚', request: 'Update Cloud Canon.' };
    request.context.workers = [request.context.workers[0]];
    const worker = request.context.workers[0];
    worker.replaces = {
      id: worker.id,
      status: 'deleted',
      environmentId: worker.environmentId,
    };
    worker.id = 'replacement-sync';
    request.context.workerHistory = history([worker.id]);
    const recovery = planSync(request);
    assert.deepEqual(
      recovery.operations.map(({ automationId, kind }) => [automationId, kind]),
      [['automation-sync', 'update']],
    );
    assert.deepEqual(planSync(request), recovery, 'an unapplied rebind remains the same update');

    // native saving is external: only feed its observed result into the resumed planning pass.
    const update = recovery.operations[0];
    request.existingTasks = [{ id: update.nativeId, task: update.task }];
    delete worker.replaces;
    assert.equal(
      planSync(request).operations[0].kind,
      'unchanged',
      'the rebind is scoped to automation-sync',
    );
    request.id = 'all';
    request.context.workers.push({
      automationId: 'cloud-update',
      id: 'worker-canon',
      environmentId: 'test-environment',
      name: 'Test cloud-update',
    });
    request.context.workerHistory.active.ids.push('worker-canon');
    const resumed = planSync(request);
    assert.deepEqual(
      resumed.operations.map(({ automationId, kind }) => [automationId, kind]),
      [
        ['automation-sync', 'unchanged'],
        ['cloud-update', 'create'],
      ],
    );
    request.existingTasks = resumed.operations.map(({ automationId, nativeId, task }) => ({
      id: nativeId ?? `native-${automationId}`,
      task,
    }));
    assert.ok(planSync(request).operations.every(({ kind }) => kind === 'unchanged'));
  });

  test('should backfill a missing saved link once and retain the exact task afterward', () => {
    const request = input({ existingTasks: saved(), now: later });
    const old = request.existingTasks[0];
    old.task.prompt = old.task.prompt.replaceAll(
      '"url": "https://example.test/chats/automation-sync"',
      '"url": null',
    );
    delete request.context.workers[0].url;
    const update = planSync(request).operations[0];
    assert.equal(update.kind, 'update');
    assert.equal(update.nativeId, old.id);
    assert.equal(update.task.enabled, old.task.enabled);
    assert.equal(workerRequest(update.task).thread.url, 'codex://threads/worker-automation-sync');
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
      /native-task-ambiguous:automation-sync/,
    );
    assert.throws(
      () =>
        planSync(
          input({
            existingTasks: [
              { id: 'unowned', task: { name: '🤖 TEST AUTOMATION-SYNC', prompt: 'Not managed.' } },
            ],
          }),
        ),
      /native-task-name-collision:automation-sync/,
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
    request.manifest.automations[0] = { ...job('automation-sync'), payload: { kind: 'command' } };
    assert.throws(() => planSync(request), /prompt-automation-required/);
  });
});
