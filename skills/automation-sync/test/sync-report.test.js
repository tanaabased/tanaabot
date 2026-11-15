import { test } from 'bun:test';
import assert from 'node:assert/strict';

import syncReport from '../utils/sync-report.js';

test('should distinguish prepared actions from saved schedules and keep debug in a separate card', () => {
  const plan = {
    source: { revision: 'a'.repeat(40), dirty: false },
    operations: [{ automationId: 'sync', kind: 'update' }],
  };
  const preview = syncReport(plan);
  assert.match(preview, /Prepared actions for native controls; no schedules have been saved\./);
  assert.doesNotMatch(preview, /✅|⚠️|🔬/u);
  assert.match(syncReport(plan, true), /\n\n> ## 🔬 Debug\n/);
});
