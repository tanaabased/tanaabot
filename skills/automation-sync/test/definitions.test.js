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
    await mkdir(join(root, 'prompts'));
    await writeFile(
      join(root, '.agent-system/agent.yaml'),
      'schema-version: 1\nagent:\n  id: tanaabot\nmodels:\n  default: {model: openai/fixture-default, effort: high}\n  low: {model: openai/fixture-low, effort: medium}\n  medium: {model: openai/fixture-medium, effort: xhigh}\n  high: {model: openai/fixture-high, effort: high}\nautomations:\n  file: ./automations.yaml\n',
    );
    await writeFile(
      join(root, '.agent-system/automations.yaml'),
      `defaults: &defaults
  group: REPORTS
  runtimes: [codex]
automations:
  - <<: *defaults
    id: smoke
    enabled: false
    model: medium
    effort: medium
    schedule: "0 0 * * *"
    display-name: &smoke-name Custom smoke
    thread: *smoke-name
    group: checks
    overrides:
      codex:
        model: fixture-override
        environment: {type: cloud, name: fixture}
    prompt:
      file: ../prompts/smoke.md
  - <<: *defaults
    id: inherited
    thread: Inherited settings
    schedule: "0 1 * * *"
    prompt:
      file: ../prompts/smoke.md
`,
    );
    await writeFile(join(root, 'prompts/smoke.md'), 'Fixture smoke marker.');
    for (const [name, content] of Object.entries({
      metadata: '{{metadata}}\n\nFixture metadata guidance.',
      execution: 'Fixture execution guidance.',
      presentation: 'Fixture presentation guidance.',
      dispatch: 'Fixture coordinator guidance.',
      request: '> ## {{emoji}} {{title}} · REQUEST\n>\n> {{request}}',
      'sync-source': 'Fixture Dot source selection.',
      'sync-worker': 'Fixture worker source handoff.',
    }))
      await writeFile(join(root, `prompts/${name}-partial.md`), content);
    await writeFile(
      join(root, 'prompts/requests.json'),
      JSON.stringify({ smoke: { emoji: '🧪', request: 'Run the fixture smoke.' } }),
    );
    const loaded = await definitions(root);
    assert.equal(loaded.manifest.automations[0].payload.prompt, 'Fixture smoke marker.');
    const [overridden, inherited] = loaded.manifest.automations;
    assert.equal(overridden.enabled, false);
    assert.equal(inherited.enabled, true);
    assert.equal(inherited.group, 'REPORTS');
    assert.deepEqual(inherited.runtimes, ['codex']);
    assert.equal(inherited.schedule.timezone, null);
    const [target] = automationTargets(
      { ...loaded.manifest, automations: [overridden] },
      {
        timezone: 'America/New_York',
        environments: [{ id: 'fixture-cloud', name: 'fixture' }],
        destination: { kind: 'dot', id: 'test-dot' },
      },
    );
    // Targets are resolved before any worker exists, including its first-turn settings.
    assert.equal(loaded.manifest.automations[0].group, 'CHECKS');
    assert.equal(Object.hasOwn(target.thread, 'group'), false);
    assert.equal(target.model, 'fixture-override');
    assert.equal(target.effort, 'medium');
    const result = planSync({
      ...loaded,
      id: 'smoke',
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
    await rm(join(root, 'prompts/smoke.md'));
    await assert.rejects(() => definitions(root), /manifest-invalid/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
