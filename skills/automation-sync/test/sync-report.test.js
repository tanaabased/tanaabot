import { test } from 'bun:test';
import assert from 'node:assert/strict';

import syncReport from '../utils/sync-report.js';

test('should keep preparation silent by default and label optional debug as unsaved', () => {
  const plan = {
    source: { revision: 'a'.repeat(40), dirty: false },
    operations: [{ automationId: 'automation-sync', kind: 'update' }],
  };
  assert.equal(syncReport(plan), '');
  const preview = syncReport(plan, true);
  assert.match(preview, /Prepared actions for native controls; no schedules have been saved\./);
  assert.doesNotMatch(preview, /✅|⚠️/u);
  assert.match(preview, /^> ## 🔬 DEBUG · SYNCHRONIZATION PREPARATION\n/);
});

test('should label first-publication fallback without an installed revision', () => {
  const preview = syncReport(
    {
      source: { revision: 'a'.repeat(40), dirty: false },
      sourceSelection: { receipt: null, bootstrapBranch: 'main' },
      operations: [],
    },
    true,
  );
  assert.match(preview, /First-publication fallback: main \(no recorded publication\)/);
  assert.doesNotMatch(preview, /Installed revision:/);
});
