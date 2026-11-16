import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadManifest } from '@tanaab/openclaw-agent-system/manifest';

import loadDefinitions from '../skills/automation-sync/lib/definitions.js';
import { planSync } from '../skills/automation-sync/lib/sync-plan.js';

const root = fileURLToPath(new URL('../', import.meta.url));

test('packed plugin retains canonical skills, assets and usable links', async () => {
  const temporary = mkdtempSync(join(tmpdir(), 'tanaabot-plugin-'));
  const run = (command, args) =>
    execFileSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, npm_config_cache: join(temporary, 'npm-cache') },
    });
  const source = join(root, 'skills');

  try {
    const packedArtifacts = JSON.parse(
      run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary]),
    );
    const packageName = JSON.parse(readFileSync(join(root, 'package.json'))).name;
    const packed = Array.isArray(packedArtifacts)
      ? packedArtifacts[0]
      : packedArtifacts[packageName];
    assert.ok(packed?.filename, 'npm pack must return the candidate artifact');
    run('tar', ['-xzf', join(temporary, packed.filename), '-C', temporary]);
    const payload = join(temporary, 'package');
    const manifest = JSON.parse(readFileSync(join(payload, '.codex-plugin/plugin.json')));
    const metadata = JSON.parse(readFileSync(join(payload, 'package.json')));
    const skills = resolve(payload, manifest.skills);

    assert.equal(manifest.version, metadata.version);
    const definitions = await loadManifest({ workspaceDir: payload });
    assert.equal(definitions.status, 'loaded');
    assert.deepEqual(
      definitions.manifest.automations.map(({ id, enabled }) => ({ id, enabled })),
      [
        { id: 'sync', enabled: false },
        { id: 'smoke-test', enabled: false },
        { id: 'smoke-test-canary', enabled: false },
        { id: 'smoke-test-canary-2', enabled: true },
      ],
    );
    const assembled = planSync({
      ...(await loadDefinitions(payload)),
      source: { revision: 'a'.repeat(40), dirty: false },
      existingTasks: [],
      context: {
        timezone: 'America/New_York',
        environments: [{ id: 'fixture-cloud', name: 'tanaabot' }],
        workers: definitions.manifest.automations.map((job) => ({
          automationId: job.id,
          id: `fixture-worker-${job.id}`,
          status: 'active',
          environmentId: 'fixture-cloud',
          name: job.displayName,
          group: 'REPORTS',
          url: `https://example.test/chats/${job.id}`,
        })),
        destination: { kind: 'dot', id: 'test-dot' },
      },
      now: '2026-01-01T00:00:00Z',
    });
    assert.deepEqual(
      assembled.operations.map(({ task }) => task.name),
      ['🤖 AUTOMATION SYNC', '🤖 SMOKE TEST', '🤖 SMOKE TEST CANARY', '🤖 SMOKE TEST CANARY #2'],
    );
    const smoke = assembled.operations.find(({ automationId }) => automationId === 'smoke-test');
    assert.equal(smoke.task.prompt.split('\n')[0], 'TANAABOT-SYNC-CANARY: ORBITAL-GOOSE-732');
    const canary = assembled.operations.find(
      ({ automationId }) => automationId === 'smoke-test-canary',
    );
    assert.match(canary.task.schedule.schedule, /BYMINUTE=0;BYSECOND=0/);
    assert.match(canary.task.prompt, /TANAABOT-SCHEDULE-CANARY-1/);
    const canary2 = assembled.operations.find(
      ({ automationId }) => automationId === 'smoke-test-canary-2',
    );
    assert.equal(canary.task.enabled, false);
    assert.equal(canary2.task.enabled, true);
    assert.match(canary2.task.prompt, /TANAABOT-SCHEDULE-CANARY-2/);
    assert.doesNotMatch(canary2.task.prompt, /TANAABOT-SCHEDULE-CANARY-1/);
    assert.ok(
      assembled.operations.every(
        ({ task }) => task.schedule.default_timezone === 'America/New_York',
      ),
    );
    assert.equal(skills, join(payload, 'skills'));
    assert.equal(existsSync(join(payload, '.agents/plugins/marketplace.json')), false);
    assert.equal(existsSync(join(payload, '.agents/skills')), false);
    assert.equal(existsSync(join(payload, 'scripts/build-plugin-task.js')), false);
    assert.deepEqual(readdirSync(skills).sort(), readdirSync(source).sort());
    for (const name of readdirSync(source)) {
      const original = readFileSync(join(source, name, 'SKILL.md'), 'utf8');
      assert.equal(readFileSync(join(skills, name, 'SKILL.md'), 'utf8'), original);
      for (const icon of ['composer-icon.svg', 'icon-large.png']) {
        assert.deepEqual(
          readFileSync(join(skills, name, 'assets', icon)),
          readFileSync(join(source, name, 'assets', icon)),
        );
      }
    }

    for (const file of readdirSync(payload, { recursive: true }).filter((name) =>
      name.endsWith('.md'),
    )) {
      const path = join(payload, file);
      for (const [, href] of readFileSync(path, 'utf8').matchAll(/\]\((\.[^\s)]*)\)/g)) {
        assert.ok(
          existsSync(resolve(dirname(path), href.split('#')[0])),
          `${file}: broken link ${href}`,
        );
      }
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}, 30000);
