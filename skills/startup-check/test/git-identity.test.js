import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from 'bun:test';

const script = fileURLToPath(new URL('../scripts/git-identity.js', import.meta.url));
const bot = { name: 'fixture-bot', email: 'bot@example.test' };
const overrides = {
  GIT_AUTHOR_NAME: bot.name,
  GIT_AUTHOR_EMAIL: bot.email,
  GIT_COMMITTER_NAME: bot.name,
  GIT_COMMITTER_EMAIL: bot.email,
};

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
    git('config', '--global', 'user.signingkey', '~/.ssh/fixture.pub');
    git('config', '--global', 'gpg.format', 'ssh');
    git('config', '--global', 'commit.gpgsign', 'true');
    git('config', '--global', 'gpg.ssh.allowedSignersFile', '~/.config/git/allowed_signers');
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
    const names = { GIT_AUTHOR_NAME: bot.name, GIT_COMMITTER_NAME: bot.name };
    const nameOverride = check(names);
    assert.equal(nameOverride.code, 0);
    assert.equal(nameOverride.report.sourceChanged, true);
    assert.equal(nameOverride.report.sourceDrift, 'identity-only');
    assert.deepEqual(nameOverride.report.author, bot);
    assert.deepEqual(nameOverride.report.committer, bot);
    git('config', '--global', 'user.email', 'operator@example.test');
    const before = readFileSync(source, 'utf8');
    const { code, report } = check();
    assert.equal(code, 1);
    assert.equal(report.sourceChanged, true);
    assert.deepEqual(report.expected, bot);
    assert.equal(report.author.name, 'fixture-operator');
    assert.equal(readFileSync(source, 'utf8'), before);

    const namesOnly = check(names);
    assert.equal(namesOnly.code, 1);
    assert.equal(namesOnly.report.author.name, bot.name);
    assert.equal(namesOnly.report.author.email, 'operator@example.test');

    const overridden = check({
      ...names,
      GIT_AUTHOR_EMAIL: bot.email,
      GIT_COMMITTER_EMAIL: bot.email,
    });
    assert.equal(overridden.code, 0);
    assert.equal(overridden.report.status, 'passed');
    assert.equal(overridden.report.sourceChanged, true);
    assert.equal(overridden.report.sourceDrift, 'identity-only');
    assert.deepEqual(overridden.report.author, bot);
    assert.deepEqual(overridden.report.committer, bot);
    assert.equal(readFileSync(source, 'utf8'), before);
  });
});

test('rejects material signing changes despite correct identity overrides', () => {
  fixture(({ git, check, source }) => {
    git('config', '--global', 'user.name', 'fixture-operator');
    git('config', '--global', 'commit.gpgsign', 'false');
    const before = readFileSync(source, 'utf8');
    const { code, report } = check(overrides);
    assert.equal(code, 1);
    assert.equal(report.status, 'failed');
    assert.equal(report.sourceDrift, 'other');
    assert.equal(report.signingStatus, 'failed');
    assert.deepEqual(report.author, bot);
    assert.deepEqual(report.committer, bot);
    assert.equal(readFileSync(source, 'utf8'), before);
  });
});

test('assesses unrelated configuration differences without failing correct identities', () => {
  fixture(({ git, check }) => {
    git('config', '--global', 'color.ui', 'auto');
    const { code, report } = check();
    assert.equal(code, 0);
    assert.equal(report.sourceDrift, 'other');
    assert.equal(report.signingStatus, 'passed');
  });
});

test('does not describe comment-only edits as changed identity values', () => {
  fixture(({ check, source }) => {
    writeFileSync(source, `${readFileSync(source, 'utf8')}\n# Local note\n`);
    const { code, report } = check();
    assert.equal(code, 0);
    assert.equal(report.sourceChanged, true);
    assert.equal(report.sourceDrift, 'other');
  });
});

test('checks author and committer overrides even when source and configuration match', () => {
  fixture(({ check }) => {
    for (const role of ['AUTHOR', 'COMMITTER']) {
      const { code, report } = check({ [`GIT_${role}_EMAIL`]: 'other@example.test' });
      assert.equal(code, 1);
      assert.equal(report.sourceChanged, false);
      assert.equal(report.sourceDrift, 'none');
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
