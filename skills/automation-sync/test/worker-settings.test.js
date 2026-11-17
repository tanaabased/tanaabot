import { test } from 'bun:test';
import assert from 'node:assert/strict';

import workerSettings from '../utils/worker-settings.js';

const models = {
  default: { model: 'openai/fixture-default', effort: 'high' },
  low: { model: 'openai/fixture-low', effort: 'medium' },
  medium: { model: 'openai/fixture-medium', effort: 'xhigh' },
  high: { model: 'openai/fixture-high', effort: 'high' },
};
const job = (settings = {}, codex = {}) => ({ ...settings, overrides: { codex } });

test('should resolve each worker setting independently before projecting to native values', () => {
  const cases = [
    [job(), { model: 'fixture-medium', effort: 'xhigh' }],
    [job({ model: 'low' }), { model: 'fixture-low', effort: 'medium' }],
    [job({ model: 'low', effort: 'high' }), { model: 'fixture-low', effort: 'high' }],
    [
      job({ model: 'low', effort: 'medium' }, { model: 'fixture-override' }),
      { model: 'fixture-override', effort: 'medium' },
    ],
    [
      job({ model: 'low', effort: 'medium' }, { effort: 'high' }),
      { model: 'fixture-low', effort: 'high' },
    ],
    [
      job({ model: 'low', effort: 'medium' }, { model: 'openai/fixture-override', effort: 'max' }),
      { model: 'fixture-override', effort: 'max' },
    ],
    [job({}, { model: 'low' }), { model: 'fixture-low', effort: 'medium' }],
    [job({ model: 'openai/fixture-low' }), { model: 'fixture-low', effort: 'medium' }],
    [job({}, { model: 'fixture-new' }), { model: 'fixture-new', effort: 'high' }],
  ];
  for (const [input, expected] of cases) {
    const before = structuredClone(input);
    assert.deepEqual(workerSettings(input, models), expected);
    assert.deepEqual(input, before);
  }
});

test('should fail unresolved profiles and unsupported settings without substitution', () => {
  assert.throws(() => workerSettings(job(), undefined), /automation-model-profile-missing/);
  for (const model of ['anthropic/fixture', 'openai/', 'bad model'])
    assert.throws(() => workerSettings(job({}, { model }), models), /provider-unsupported/);
  for (const effort of ['hard', 'off', 'adaptive'])
    assert.throws(() => workerSettings(job({}, { effort }), models), /effort-unsupported/);
  const conflicting = { ...models, high: { model: models.low.model, effort: 'high' } };
  assert.throws(
    () => workerSettings(job({ model: models.low.model }), conflicting),
    /automation-model-effort-ambiguous/,
  );
  assert.deepEqual(workerSettings(job({ model: 'low' }), conflicting), {
    model: 'fixture-low',
    effort: 'medium',
  });
});
