import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from 'bun:test';

const script = fileURLToPath(new URL('../scripts/git-identity.js', import.meta.url));
const bot = { name: 'fixture-bot', email: 'bot@example.test' };

function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), 'tanaabot-git-identity-'));
  const source = join(directory, 'dotfiles/git/.gitconfig');
  const env = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
    HOME: directory,
    XDG_CONFIG_HOME: join(directory, '.config'),
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: join(directory, '.gitconfig'),
  };
  const git = (...args) =>
    execFileSync('git', args, { cwd: directory, env, encoding: 'utf8', stdio: 'pipe' });
  const check = (overrides = {}) => {
    const result = spawnSync(process.execPath, ['--no-env-file', script, directory], {
      env: { ...env, ...overrides },
      encoding: 'utf8',
    });
    return { code: result.status, report: JSON.parse(result.stdout) };
  };
  try {
    mkdirSync(join(directory, 'dotfiles/git'), { recursive: true });
    writeFileSync(source, `[user]\nname = ${bot.name}\nemail = ${bot.email}\n`);
    symlinkSync(source, env.GIT_CONFIG_GLOBAL);
    git('init', '--quiet');
    git('add', 'dotfiles/git/.gitconfig');
    git('-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'fixture');
    run({ git, check, source });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('detects a global identity write through a Stow link without repairing the evidence', () => {
  fixture(({ git, check, source }) => {
    assert.equal(check().code, 0);
    git('config', '--global', 'user.name', 'fixture-operator');
    git('config', '--global', 'user.email', 'operator@example.test');
    const before = readFileSync(source, 'utf8');
    const { code, report } = check();
    assert.equal(code, 1);
    assert.equal(report.sourceChanged, true);
    assert.deepEqual(report.expected, bot);
    assert.equal(report.working.name, 'fixture-operator');
    assert.equal(report.author.name, 'fixture-operator');
    assert.match(report.origins.name, /global\s+file:.*\.gitconfig/);
    assert.equal(readFileSync(source, 'utf8'), before);
  });
});

test('checks author and committer overrides even when source and configuration match', () => {
  fixture(({ check }) => {
    for (const role of ['AUTHOR', 'COMMITTER']) {
      const { code, report } = check({ [`GIT_${role}_EMAIL`]: 'other@example.test' });
      assert.equal(code, 1);
      assert.equal(report.sourceChanged, false);
      assert.deepEqual(report.configured, bot);
      assert.equal(report[role.toLowerCase()].email, 'other@example.test');
    }
  });
});

test('does not substitute a working file when the committed baseline is unavailable', () => {
  fixture(({ git, check }) => {
    git('rm', '--cached', 'dotfiles/git/.gitconfig');
    git('-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'remove baseline');
    const { code, report } = check();
    assert.equal(code, 2);
    assert.equal(report.status, 'unverified');
  });
});
