import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const script = path.join(root, 'tanaboot.sh');

export function shell(body, args = [], env = {}) {
  return spawnSync('bash', ['-c', 'source "$1"; shift; ' + body, 'test', script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', SCRIPT_VERSION: '0.0.0-fixture', ...env },
    timeout: 15000,
  });
}

export function fixture() {
  const dir = mkdtempSync(path.join(tmpdir(), 'tanaboot-'));
  const home = path.join(dir, 'home');
  const bin = path.join(dir, 'bin');
  mkdirSync(home);
  mkdirSync(bin);
  const executable = (name, contents) => {
    const file = path.join(bin, name);
    writeFileSync(file, '#!/bin/bash\nset -euo pipefail\n' + contents + '\n', { mode: 0o755 });
    return file;
  };
  executable('uname', 'case "$1" in -s) echo Linux;; -m) echo x86_64;; esac');
  executable('id', 'echo 1000');
  executable('sha256sum', 'exec shasum -a 256 "$@"');
  const env = {
    ...process.env,
    HOME: home,
    XDG_DATA_HOME: path.join(home, 'data'),
    CODEX_HOME: path.join(home, '.codex'),
    PATH: bin + path.delimiter + process.env.PATH,
    GIT_CONFIG_GLOBAL: path.join(dir, 'gitconfig'),
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Test',
    GIT_AUTHOR_EMAIL: 'test@example.invalid',
    GIT_COMMITTER_NAME: 'Test',
    GIT_COMMITTER_EMAIL: 'test@example.invalid',
    GIT_CONFIG_COUNT: '0',
    NO_COLOR: '1',
  };
  const run = (command, args, extra = {}) =>
    spawnSync(command, args, {
      encoding: 'utf8',
      env: { ...env, ...extra },
      timeout: 15000,
    });
  const git = (...args) => {
    const result = run('git', args);
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  };
  return { dir, home, bin, env, executable, run, git };
}
