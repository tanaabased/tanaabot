import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import automationTargets from '../lib/automation-targets.js';
import { planSync } from '../lib/sync-plan.js';

const manifest = {
  agent: { id: 'tanaabot' },
  models: { default: { model: 'openai/fixture-default', effort: 'high' } },
  automations: [
    {
      id: 'review',
      displayName: 'Calendar Review',
      runtimes: ['codex'],
      overrides: {},
      payload: { kind: 'prompt', prompt: 'Review.' },
      schedule: { kind: 'every', seconds: 3600, missedRun: 'native' },
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

test('should require explicit native first-turn settings for seeding and recovery', () => {
  const guidance = readFileSync(new URL('../references/native-tasks.md', import.meta.url), 'utf8');
  // this verifies the native-call instructions, not a live chat creation.
  assert.match(guidance, /including initial seeding and archive recovery/);
  assert.match(guidance, /`model: target.model` and `thinking: target.effort` explicitly/);
  assert.match(guidance, /Unsupported settings stop creation/);
});

test('should default to Tanaabot Cloud and the authored name without mutating declarations', () => {
  const before = JSON.stringify(manifest);
  const [target] = automationTargets(manifest, context);
  assert.deepEqual(target.execution, { kind: 'cloud', environmentId: 'tanaabot-config' });
  assert.deepEqual(target.thread, { name: 'Calendar Review' });
  assert.equal(target.destination.id, 'main-chat');
  assert.equal(target.model, 'fixture-default');
  assert.equal(target.effort, 'high');
  assert.equal(JSON.stringify(manifest), before);
});

test('should reject cadence before worker preparation and omit elapsed one-shot workers', () => {
  const configured = structuredClone(manifest);
  configured.automations[0].schedule = { kind: 'every', seconds: 600 };
  assert.throws(() => automationTargets(configured, context), /minimum-interval:1h/);
  configured.automations[0].schedule = { kind: 'at', at: '2026-01-01T12:00:00Z' };
  assert.equal(automationTargets(configured, context, 'all', '2026-01-01T11:00:00Z').length, 1);
  assert.deepEqual(automationTargets(configured, context, 'all', '2026-01-01T12:00:00Z'), []);
});

test('should honor shared-schema environment and thread overrides without resolving placement', () => {
  const configured = structuredClone(manifest);
  const job = configured.automations[0];
  job.overrides.codex = {
    model: 'fixture-first-turn',
    effort: 'medium',
    environment: { type: 'cloud', name: 'other' },
    target: { thread: 'chosen-worker' },
  };
  job.thread = { name: 'Chosen chat' };
  job.group = 'OTHER REPORTS';
  const [target] = automationTargets(configured, context);
  assert.equal(target.execution.environmentId, 'other-config');
  assert.equal(target.model, 'fixture-first-turn');
  assert.equal(target.effort, 'medium');
  assert.deepEqual(target.thread, {
    id: 'chosen-worker',
    name: 'Chosen chat',
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
    schedule: { kind: 'every', seconds: 3600, missedRun: 'native' },
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
    context: {
      ...context,
      workers: [],
      workerHistory: {
        active: { source: 'history', ids: ['worker'], complete: true },
        archived: { source: 'history', ids: [], complete: true },
      },
    },
    now: '2026-01-01T00:00:00Z',
  };
  assert.deepEqual(planSync(request).operations, [
    { automationId: 'review', kind: 'skipped', reason: 'worker-status-unverified' },
  ]);
  const worker = {
    automationId: 'review',
    id: 'worker',
    environmentId: 'wrong-config',
    name: 'Calendar Review',
    url: 'https://example.test/chat',
  };
  request.context.workers.push(worker);
  assert.throws(() => planSync(request), /reusable-worker-target-mismatch/);
  worker.environmentId = 'tanaabot-config';
  worker.name = 'WRONG';
  assert.throws(() => planSync(request), /reusable-worker-settings-drift/);
  worker.name = 'Calendar Review';
  delete worker.id;
  assert.throws(() => planSync(request), /reusable-worker-missing-or-ambiguous/);
});
