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
    const input = {
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
          name: job.thread?.name ?? job.displayName ?? job.id.replaceAll('-', ' '),
          url: `https://example.test/chats/${job.id}`,
        })),
        destination: { kind: 'dot', id: 'test-dot' },
      },
      now: '2026-01-01T00:00:00Z',
    };
    const assembled = planSync(input);
    const sync = assembled.operations.find(({ automationId }) => automationId === 'sync');
    assert.equal(sync.task.enabled, true);
    assert.equal(sync.task.schedule.default_timezone, 'America/New_York');
    assert.match(sync.task.schedule.schedule, /FREQ=DAILY;BYHOUR=0;BYMINUTE=0;BYSECOND=0/);

    // The updater follows midnight synchronization at the operator-selected 1 a.m.
    const canon = assembled.operations.find(
      ({ automationId }) => automationId === 'update-cloud-canon',
    );
    assert.equal(canon.kind, 'create');
    assert.equal(canon.task.enabled, true);
    assert.equal(canon.task.schedule.default_timezone, 'America/New_York');
    assert.match(canon.task.schedule.schedule, /FREQ=DAILY;BYHOUR=1;BYMINUTE=0;BYSECOND=0/);
    const instructions = assembled.operations.find(
      ({ automationId }) => automationId === 'instruction-sync',
    );
    assert.equal(instructions.kind, 'create');
    assert.equal(instructions.task.name, '🤖 INSTRUCTION SYNC');
    assert.equal(instructions.task.enabled, true);
    assert.equal(instructions.task.schedule.default_timezone, 'America/New_York');
    assert.match(instructions.task.schedule.schedule, /FREQ=DAILY;BYHOUR=1;BYMINUTE=0;BYSECOND=0/);
    assert.match(instructions.task.prompt, /skills\/instruction-sync\/SKILL\.md/);
    assert.match(instructions.task.prompt, /## Owning Dot/);
    for (const other of [sync, canon]) {
      assert.doesNotMatch(other.task.prompt, /skills\/instruction-sync\/|## Owning Dot/);
    }
    const existingTasks = [
      { id: 'legacy-canon', task: { name: '⬇️ UPDATE CLOUD CANON', prompt: 'Legacy updater.' } },
      ...assembled.operations.map(({ automationId, task }) => ({
        id: `native-${automationId}`,
        task,
      })),
    ];
    const saved = structuredClone(existingTasks);
    const rerun = planSync({ ...input, existingTasks, id: 'update-cloud-canon' });
    assert.equal(rerun.operations.length, 1);
    assert.equal(rerun.operations[0].kind, 'unchanged');
    assert.equal(rerun.operations[0].nativeId, 'native-update-cloud-canon');
    assert.deepEqual(rerun.operations[0].task, canon.task);
    const restored = planSync({
      ...input,
      id: 'update-cloud-canon',
      existingTasks: existingTasks.filter(({ id }) => id !== 'native-update-cloud-canon'),
    });
    assert.equal(restored.operations.length, 1);
    assert.equal(restored.operations[0].kind, 'create');
    assert.equal(restored.operations[0].task.enabled, true);
    assert.deepEqual(existingTasks, saved);
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
