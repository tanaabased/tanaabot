import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import definitions from '../lib/definitions.js';
import automationTargets from '../lib/automation-targets.js';
import { planSync } from '../lib/sync-plan.js';

test('should load external definitions through the real public Agent System export', async () => {
  const root = await mkdtemp(join(tmpdir(), 'tanaabot-definitions-'));
  try {
    await mkdir(join(root, '.agent-system'));
    await mkdir(join(root, 'prompts/automations/partials'), { recursive: true });
    await writeFile(
      join(root, '.agent-system/agent.yaml'),
      'schema-version: 1\nagent:\n  id: tanaabot\nmodels:\n  default: {model: openai/fixture-default, effort: high}\n  low: {model: openai/fixture-low, effort: medium}\n  medium: {model: openai/fixture-medium, effort: xhigh}\n  high: {model: openai/fixture-high, effort: high}\nautomations:\n  file: ./automations.yaml\n',
    );
    await writeFile(
      join(root, '.agent-system/automations.yaml'),
      '- id: smoke\n  enabled: false\n  model: medium\n  effort: medium\n  schedule: "0 0 * * *"\n  thread: Custom smoke\n  group: checks\n  overrides:\n    codex:\n      model: fixture-override\n      environment: {type: cloud, name: fixture}\n  prompt:\n    file: ../prompts/automations/smoke.md\n',
    );
    await writeFile(join(root, 'prompts/automations/smoke.md'), 'Fixture smoke marker.');
    for (const [name, content] of Object.entries({
      metadata: '{{metadata}}\n\nFixture metadata guidance.',
      execution: 'Fixture execution guidance.',
      presentation: 'Fixture presentation guidance.',
      dispatch: 'Fixture coordinator guidance.',
      request: '> ## {{emoji}} {{title}} · REQUEST\n>\n> {{request}}',
    }))
      await writeFile(join(root, `prompts/automations/partials/${name}.md`), content);
    await writeFile(
      join(root, 'prompts/automations/requests.json'),
      JSON.stringify({ smoke: { emoji: '🧪', request: 'Run the fixture smoke.' } }),
    );
    const loaded = await definitions(root);
    assert.equal(loaded.manifest.automations[0].payload.prompt, 'Fixture smoke marker.');
    const [target] = automationTargets(loaded.manifest, {
      timezone: 'America/New_York',
      environments: [{ id: 'fixture-cloud', name: 'fixture' }],
      destination: { kind: 'dot', id: 'test-dot' },
    });
    // Targets are resolved before any worker exists, including its first-turn settings.
    assert.equal(target.thread.group, 'CHECKS');
    assert.equal(target.model, 'fixture-override');
    assert.equal(target.effort, 'medium');
    const result = planSync({
      ...loaded,
      existingTasks: [],
      now: '2026-01-01T00:00:00Z',
      source: { revision: 'a'.repeat(40), dirty: false },
      context: {
        timezone: 'America/New_York',
        environments: [{ id: 'fixture-cloud', name: 'fixture' }],
        workers: [
          {
            automationId: 'smoke',
            id: 'fixture-worker',
            status: 'active',
            environmentId: 'fixture-cloud',
            name: 'Custom smoke',
            group: 'CHECKS',
            url: 'https://example.test/chat',
          },
        ],
        destination: { kind: 'dot', id: 'test-dot' },
      },
    });
    assert.match(result.operations[0].task.prompt, /Fixture presentation guidance\./);
    const worker = JSON.parse(
      result.operations[0].task.prompt.split('```json\n')[1].split('\n```')[0],
    );
    assert.equal(worker.model, 'fixture-override');
    assert.equal(worker.effort, 'medium');
    assert.equal(result.operations[0].task.model, null);
    assert.equal(result.operations[0].task.effort, null);
    assert.match(
      result.operations[0].task.schedule.schedule,
      /RRULE:FREQ=DAILY;BYHOUR=0;BYMINUTE=0;BYSECOND=0/,
    );
    assert.equal(result.operations[0].task.schedule.default_timezone, 'America/New_York');
    assert.deepEqual(loaded.manifest.automations[0].overrides.codex.environment, {
      type: 'cloud',
      name: 'fixture',
    });
    await rm(join(root, 'prompts/automations/smoke.md'));
    await assert.rejects(() => definitions(root), /manifest-invalid/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
