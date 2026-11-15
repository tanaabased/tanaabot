import { test } from 'bun:test';
import assert from 'node:assert/strict';

import automationTargets from '../lib/automation-targets.js';
import { planSync } from '../lib/sync-plan.js';

const manifest = {
  agent: { id: 'tanaabot' },
  automations: [
    {
      id: 'review',
      displayName: 'Calendar Review',
      runtimes: ['codex'],
      overrides: {},
      payload: { kind: 'prompt', prompt: 'Review.' },
      schedule: { kind: 'cron', expression: '0 0 * * *', timezone: null },
    },
  ],
};
const context = {
  destination: { kind: 'dot', id: 'main-chat' },
  environments: [
    { id: 'tanaabot-config', name: 'tanaabot' },
    { id: 'other-config', name: 'other' },
  ],
};

test('should default to Tanaabot Cloud, REPORTS and the authored name without mutating declarations', () => {
  const before = JSON.stringify(manifest);
  const [target] = automationTargets(manifest, context);
  assert.deepEqual(target.execution, { kind: 'cloud', environmentId: 'tanaabot-config' });
  assert.deepEqual(target.thread, { name: 'Calendar Review', group: 'REPORTS' });
  assert.equal(target.destination.id, 'main-chat');
  assert.equal(JSON.stringify(manifest), before);
});

test('should honor shared-schema environment, thread and group overrides', () => {
  const configured = structuredClone(manifest);
  const job = configured.automations[0];
  job.overrides.codex = {
    environment: { type: 'cloud', name: 'other' },
    target: { thread: 'chosen-worker' },
  };
  job.thread = { name: 'Chosen chat' };
  job.group = 'OTHER REPORTS';
  const [target] = automationTargets(configured, context);
  assert.equal(target.execution.environmentId, 'other-config');
  assert.deepEqual(target.thread, {
    id: 'chosen-worker',
    name: 'Chosen chat',
    group: 'OTHER REPORTS',
  });
});

test('should refuse unavailable, ambiguous and unsupported environments rather than fallback', () => {
  assert.throws(
    () => automationTargets(manifest, { ...context, environments: [] }),
    /cloud-environment-missing/,
  );
  assert.throws(
    () =>
      automationTargets(manifest, {
        ...context,
        environments: [...context.environments, context.environments[0]],
      }),
    /cloud-environment-missing-or-ambiguous/,
  );
  for (const type of ['native', 'dot', 'auto', 'computer']) {
    const configured = structuredClone(manifest);
    configured.automations[0].overrides.codex = { environment: { type } };
    assert.throws(
      () => automationTargets(configured, context),
      /automation-environment-unsupported/,
    );
  }
});

test('should require a verified reusable worker before preparing any schedule', () => {
  const configured = structuredClone(manifest);
  Object.assign(configured.automations[0], {
    enabled: false,
    schedule: { kind: 'cron', expression: '0 0 * * *', timezone: null },
    payload: { kind: 'prompt', prompt: 'Review.' },
  });
  const request = {
    manifest: configured,
    partials: {
      metadata: '{{metadata}}\n\nMetadata.',
      execution: 'Execute.',
      presentation: 'Present.',
      dispatch: 'Dispatch.',
    },
    source: { revision: 'a'.repeat(40), dirty: false },
    existingTasks: [],
    context: { ...context, workers: [] },
    now: '2026-01-01T00:00:00Z',
  };
  assert.throws(() => planSync(request), /reusable-worker-missing/);
  const worker = {
    automationId: 'review',
    id: 'worker',
    environmentId: 'wrong-config',
    name: 'Calendar Review',
    group: 'REPORTS',
    url: 'https://example.test/chat',
  };
  request.context.workers.push(worker);
  assert.throws(() => planSync(request), /reusable-worker-target-mismatch/);
  worker.environmentId = 'tanaabot-config';
  worker.group = 'WRONG';
  assert.throws(() => planSync(request), /reusable-worker-settings-drift/);
  worker.group = 'REPORTS';
  delete worker.id;
  assert.throws(() => planSync(request), /reusable-worker-missing-or-ambiguous/);
});
