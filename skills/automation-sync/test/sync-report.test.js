import { test } from 'bun:test';
import assert from 'node:assert/strict';

import syncReport from '../utils/sync-report.js';

test('should keep preparation silent by default and label optional debug as unsaved', () => {
  const plan = {
    source: { revision: 'a'.repeat(40), dirty: false },
    operations: [{ automationId: 'sync', kind: 'update' }],
  };
  assert.equal(syncReport(plan), '');
  const preview = syncReport(plan, true);
  assert.match(preview, /Prepared actions for native controls; no schedules have been saved\./);
  assert.doesNotMatch(preview, /✅|⚠️/u);
  assert.match(preview, /^> ## 🔬 Debug · Synchronization preparation\n/);
});
