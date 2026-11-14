import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('packed plugin retains generated skills, assets and usable links', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'tanaabot-plugin-'));
  const run = (command, args) =>
    execFileSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, npm_config_cache: join(temporary, 'npm-cache') },
    });
  const source = join(root, '.agents/skills');
  const before = readFileSync(join(source, 'startup-check/SKILL.md'), 'utf8');

  try {
    run(process.execPath, ['run', 'build']);
    writeFileSync(join(root, 'skills/retired-skill.txt'), 'stale generated output');
    run(process.execPath, ['run', 'build']);
    const [packed] = JSON.parse(
      run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary]),
    );
    run('tar', ['-xzf', join(temporary, packed.filename), '-C', temporary]);
    const payload = join(temporary, 'package');
    const manifest = JSON.parse(readFileSync(join(payload, '.codex-plugin/plugin.json')));
    const metadata = JSON.parse(readFileSync(join(payload, 'package.json')));
    const skills = resolve(payload, manifest.skills);

    assert.equal(manifest.version, metadata.version);
    assert.equal(skills, join(payload, 'skills'));
    assert.equal(existsSync(join(payload, '.agents/plugins/marketplace.json')), false);
    assert.equal(existsSync(join(skills, 'retired-skill.txt')), false);
    assert.deepEqual(readdirSync(skills).sort(), readdirSync(source).sort());
    for (const name of readdirSync(source)) {
      const original = readFileSync(join(source, name, 'SKILL.md'), 'utf8');
      const generated = readFileSync(join(skills, name, 'SKILL.md'), 'utf8');
      assert.equal(generated.match(/^name: (.+)$/m)?.[1], original.match(/^name: (.+)$/m)?.[1]);
      assert.equal(
        readFileSync(join(payload, '.agents/skills', name, 'SKILL.md'), 'utf8'),
        original,
      );
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
    assert.equal(readFileSync(join(source, 'startup-check/SKILL.md'), 'utf8'), before);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}, 30000);
