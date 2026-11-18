import { test } from 'bun:test';
import assert from 'node:assert/strict';

import placementPlan from '../lib/placement-plan.js';

function fixture() {
  const jobs = [
    { id: 'automation-sync', group: 'REPORTS', runtimes: ['codex'] },
    { id: 'other', group: 'CHECKS', runtimes: ['codex'] },
  ];
  const workers = jobs.map((job) => ({
    automationId: job.id,
    id: `worker-${job.id}`,
  }));
  return {
    manifest: { agent: { id: 'tanaabot' }, automations: jobs },
    context: {
      workers,
      sidebar: {
        threads: workers.map((worker) => ({ id: worker.id, hostId: 'durable', kind: 'codex' })),
        sections: [
          { sectionId: 'reports-section', name: 'REPORTS', itemKeys: [] },
          { sectionId: 'checks-section', name: 'CHECKS', itemKeys: [] },
        ],
      },
    },
  };
}

test('should match configured sections and exact desktop identities for verified bindings', () => {
  const input = fixture();
  const before = structuredClone(input);
  const { placements } = placementPlan(input);
  assert.deepEqual(
    placements.map((p) => p.desiredGroup),
    ['REPORTS', 'CHECKS'],
  );
  assert.deepEqual(placements[0].move, {
    source: 'codex',
    threadId: 'worker-automation-sync',
    hostId: 'durable',
    sectionId: 'reports-section',
  });
  assert.deepEqual(input, before);
  assert.equal(placementPlan({ ...input, id: 'automation-sync' }).placements.length, 1);
  input.manifest.automations[0].group = 'CHECKS';
  assert.equal(placementPlan(input).placements[0].move.sectionId, 'checks-section');
  input.context.workers[0].id = 'same-title-different-chat';
  assert.equal(placementPlan(input).placements[0].reason, 'desktop-chat-missing-or-ambiguous');
  // Skipped jobs have no verified binding and must not produce placement warnings.
  input.context.workers = [before.context.workers[1]];
  assert.deepEqual(
    placementPlan(input).placements.map((p) => p.automationId),
    ['other'],
  );
});

test('should verify readback and skip already-correct Cloud chats despite local sidebar keys', () => {
  const input = fixture();
  assert.equal(placementPlan(input).placements[0].status, 'move');
  input.context.sidebar.sections[0].itemKeys = ['codex:thread:local:worker-automation-sync'];
  const placed = placementPlan(input).placements[0];
  assert.equal(placed.status, 'verified');
  assert.equal(Object.hasOwn(placed, 'move'), false);
  input.context.sidebar.sections[0].itemKeys = ['codex:thread:local:worker-automation-sync-other'];
  assert.equal(placementPlan(input).placements[0].status, 'move');
});

test('should avoid moves without a sidebar or an unambiguous chat and section', () => {
  const input = fixture();
  delete input.context.sidebar;
  const unavailable = placementPlan(input).placements[0];
  assert.equal(unavailable.status, 'unverified');
  assert.equal(unavailable.move, undefined);
  input.context.sidebar = fixture().context.sidebar;
  input.context.sidebar.sections.push({ sectionId: 'duplicate', name: 'REPORTS', itemKeys: [] });
  const duplicate = placementPlan(input);
  assert.equal(duplicate.placements[0].reason, 'sidebar-section-id-missing-or-ambiguous');
  assert.deepEqual(duplicate.sectionsToCreate, []);
  delete input.context.sidebar.sections;
  const missingListing = placementPlan(input);
  assert.equal(missingListing.placements[0].reason, 'sidebar-sections-unavailable');
  assert.deepEqual(missingListing.sectionsToCreate, []);
  input.context.sidebar = fixture().context.sidebar;
  input.context.sidebar.threads.push({
    id: 'worker-automation-sync',
    kind: 'codex',
    hostId: 'other-host',
  });
  assert.equal(placementPlan(input).placements[0].reason, 'desktop-chat-missing-or-ambiguous');
  delete input.manifest.automations[0].group;
  assert.equal(placementPlan(input).placements[0].reason, 'no-configured-group');
});

test('should request a missing uppercase section once and use its exact ID after readback', () => {
  const input = fixture();
  for (const job of input.manifest.automations) job.group = 'TANAABOT';
  const sections = input.context.sidebar.sections;
  sections.push({ sectionId: 'lowercase', name: 'tanaabot', itemKeys: [] });
  const missing = placementPlan(input);
  assert.deepEqual(missing.sectionsToCreate, ['TANAABOT']);
  assert.deepEqual(
    missing.placements.map(({ status }) => status),
    ['awaiting-section', 'awaiting-section'],
  );
  sections.push({ sectionId: 'uppercase', name: 'TANAABOT', itemKeys: [] });
  const ready = placementPlan(input);
  assert.deepEqual(ready.sectionsToCreate, []);
  assert.deepEqual(
    ready.placements.map(({ move }) => move.sectionId),
    ['uppercase', 'uppercase'],
  );
});
