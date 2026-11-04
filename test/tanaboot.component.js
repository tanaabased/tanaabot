import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { fixture, root, script, shell } from './tanaboot-fixture.js';

describe('tanaboot source acquisition', () => {
  let f;
  let remote;
  let first;
  let second;
  const acquire = (sha, action = 'apply') =>
    shell(
      'DATA_DIR="$1/data"; ACTION="$4"; acquire_source payload "$2" "$3"',
      [f.home, remote, sha, action],
      f.env,
    );

  beforeEach(() => {
    f = fixture();
    remote = path.join(f.dir, 'remote');
    f.git('init', '-q', '-b', 'main', remote);
    writeFileSync(path.join(remote, 'payload'), 'first');
    f.git('-C', remote, 'add', '.');
    f.git('-C', remote, 'commit', '-qm', 'first');
    first = f.git('-C', remote, 'rev-parse', 'HEAD');
    writeFileSync(path.join(remote, 'payload'), 'second');
    f.git('-C', remote, 'commit', '-qam', 'second');
    second = f.git('-C', remote, 'rev-parse', 'HEAD');
  });
  afterEach(() => rmSync(f.dir, { recursive: true, force: true }));

  it('should fetch the resolved commit even after the branch has moved', () => {
    const result = acquire(first);
    assert.equal(result.status, 0, result.stderr);
    const dir = result.stdout.trim();
    assert.equal(readFileSync(path.join(dir, 'payload'), 'utf8'), 'first');
    assert.equal(f.git('-C', dir, 'rev-parse', 'HEAD'), first);
    assert.notEqual(first, second);
    assert.equal(acquire(first).stdout.trim(), dir);
    assert.deepEqual(readdirSync(path.dirname(dir)), [first]);
  });

  it('should resolve real annotated tags and reject a colliding branch name', () => {
    f.git('-C', remote, 'tag', '-a', 'pilot', '-m', 'pilot tag', first);
    const resolved = shell('resolve_ref "$1" "$2"', [remote, 'pilot'], f.env);
    assert.equal(resolved.status, 0, resolved.stderr);
    assert.equal(resolved.stdout.trim(), first);
    f.git('-C', remote, 'branch', 'pilot', second);
    const collision = shell('resolve_ref "$1" "$2"', [remote, 'pilot'], f.env);
    assert.equal(collision.status, 1);
    assert.match(collision.stderr, /ambiguous/);
  });

  it('should preserve a modified source and refuse reuse', () => {
    const result = acquire(first);
    const file = path.join(result.stdout.trim(), 'payload');
    writeFileSync(file, 'operator change');
    const retry = acquire(first);
    assert.equal(retry.status, 1);
    assert.match(retry.stderr, /local changes/);
    assert.equal(readFileSync(file, 'utf8'), 'operator change');
  });

  it('should reject unavailable commits and remove only its acquisition staging', () => {
    const result = acquire('f'.repeat(40));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /could not be fetched/);
    assert.deepEqual(readdirSync(path.join(f.home, 'data/sources/payload')), []);
  });

  it('should reject a non-commit object without substituting HEAD', () => {
    const tree = f.git('-C', remote, 'rev-parse', 'HEAD^{tree}');
    const result = acquire(tree);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /not the requested commit/);
  });

  it('should not acquire or write source state during a readiness check', () => {
    const result = acquire(first, 'check');
    assert.equal(result.status, 1);
    assert.equal(existsSync(path.join(f.home, 'data')), false);
    assert.equal(acquire(first).status, 0);
    assert.equal(acquire(first, 'check').status, 0);
  });

  it('should leave another acquisition lock untouched', () => {
    const lock = path.join(f.home, `data/sources/payload/${first}.lock`);
    mkdirSync(lock, { recursive: true });
    const result = acquire(first);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /already running/);
    assert.equal(existsSync(lock), true);
  });
});

describe('tanaboot delegation', () => {
  let f;
  beforeEach(() => {
    f = fixture();
  });
  afterEach(() => rmSync(f.dir, { recursive: true, force: true }));

  it('should hand setup to exactly the selected canonical revision and propagate failure', () => {
    const remote = path.join(f.dir, 'remote');
    f.git('init', '-q', '-b', 'main', remote);
    writeFileSync(
      path.join(remote, 'tanaboot.sh'),
      '#!/bin/bash\nprintf "selected:%s\\n" "$*"\nexit 17\n',
    );
    f.git('-C', remote, 'add', '.');
    f.git('-C', remote, 'commit', '-qm', 'selected entrypoint');
    const sha = f.git('-C', remote, 'rev-parse', 'HEAD');
    const result = f.run('bash', [script, '--ref', 'main', '--agent', '--debug=false'], {
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: `url.${remote}.insteadOf`,
      GIT_CONFIG_VALUE_0: 'https://github.com/tanaabased/tanaabot.git',
    });
    assert.equal(result.status, 17, result.stderr);
    assert.match(result.stdout, /Requested reference: main/);
    assert.ok(result.stdout.includes(`Resolved commit: ${sha}`));
    assert.match(result.stdout, /selected:--debug=false --agent/);
    assert.doesNotMatch(result.stdout, /setup complete/);
  });

  it('should keep dry-run offline without creating setup state', () => {
    f.executable('curl', 'exit 99');
    const result = f.run('bash', [script, '--ref', 'main', '--dry-run']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /not resolved offline/);
    assert.equal(existsSync(f.env.XDG_DATA_HOME), false);
  });

  it('should stop unsupported hosts before source acquisition or provisioning', () => {
    f.executable('id', 'echo 0');
    const result = f.run('bash', [script, '--ref', 'main']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /cannot provision as root/);
    assert.equal(existsSync(f.env.XDG_DATA_HOME), false);
  });

  it('should remove inherited Bootbox access inputs without exposing their values', () => {
    const bootbox = path.join(f.dir, 'bootbox.sh');
    writeFileSync(
      bootbox,
      '#!/bin/bash\nset -eu\ntest -z "${OP_SERVICE_ACCOUNT_TOKEN+x}${BOOTBOX_SSH_KEY+x}${TANAAB_FORCE+x}"\nprintf "clean:%s:%s\\n" "$NONINTERACTIVE" "$*"\n',
    );
    const result = shell(
      'DATA_DIR="$1"; BOOTBOX_SCRIPT="$2"; run_bootbox --brewfile selected',
      [f.dir, bootbox],
      {
        ...f.env,
        OP_SERVICE_ACCOUNT_TOKEN: 'private-marker',
        BOOTBOX_SSH_KEY: 'vault-marker',
        TANAAB_FORCE: '1',
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'clean:1:--brewfile selected');
    assert.doesNotMatch(result.stdout + result.stderr, /private-marker|vault-marker/);
  });

  it('should never execute or retain a dependency with a bad checksum', () => {
    f.executable('curl', 'printf "invalid script" > "$4"');
    const result = shell(
      'ACTION=apply; BOOTBOX_SCRIPT="$1/deps/bootbox.sh"; BOOTBOX_REV="$2"; BOOTBOX_SHA="$3"; prepare_bootbox',
      [f.home, 'a'.repeat(40), '0'.repeat(64)],
      f.env,
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /checksum failed/);
    assert.deepEqual(readdirSync(path.join(f.home, 'deps')), []);
  });

  it('should release its setup lock and partial download when a dependency is unavailable', () => {
    f.executable('curl', 'printf partial > "$4"; exit 22');
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = f.run('bash', [script, '--host']);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /download failed/);
      const data = path.join(f.env.XDG_DATA_HOME, 'tanaabot');
      assert.equal(existsSync(path.join(data, 'setup.lock')), false);
      assert.deepEqual(readdirSync(path.join(data, 'dependencies')), []);
    }
  });

  it('should reuse only a verified dependency and refuse a corrupted cached script', () => {
    const body = '#!/bin/bash\nexit 0\n';
    const cached = path.join(f.home, 'bootbox.sh');
    writeFileSync(cached, body);
    const digest = createHash('sha256').update(body).digest('hex');
    const command =
      'ACTION=check; BOOTBOX_SCRIPT="$1"; BOOTBOX_REV="$2"; BOOTBOX_SHA="$3"; prepare_bootbox';
    assert.equal(shell(command, [cached, 'a'.repeat(40), digest], f.env).status, 0);
    writeFileSync(cached, 'corrupted');
    const result = shell(command, [cached, 'a'.repeat(40), digest], f.env);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /checksum failed/);
    assert.equal(readFileSync(cached, 'utf8'), 'corrupted');
  });

  it('should preserve startup configuration and avoid duplicate initialization on reruns', () => {
    writeFileSync(path.join(f.home, '.bashrc'), 'export KEEP_ME=yes\n');
    f.executable('bun', 'test "$*" = "install --production --frozen-lockfile --ignore-scripts"');
    f.executable('stow', 'exit 0');
    const result = shell(
      `
      REPO_DIR="$1"; CANON_REV=selected
      acquire_source() { printf '%s\\n' "$REPO_DIR"; }
      run_bootbox() {
        test -d "$HOME/.codex" && test ! -L "$HOME/.codex"
        test -d "$HOME/.config" && test ! -L "$HOME/.config"
        mkdir -p "$HOME/.codex" "$HOME/.config/tanaabot"
        ln -sf "$REPO_DIR/dotfiles/ai/.codex/AGENTS.md" "$HOME/.codex/AGENTS.md"
        ln -sf "$REPO_DIR/dotfiles/shell/.config/tanaabot/env.sh" "$HOME/.config/tanaabot/env.sh"
      }
      codex_tools() { printf '%s\\n' '{"ok":true,"inspection":{"installed":true,"enabled":true}}'; }
      apply_agent
      apply_agent
    `,
      [root],
      f.env,
    );
    assert.equal(result.status, 0, result.stderr);
    const bashrc = readFileSync(path.join(f.home, '.bashrc'), 'utf8');
    assert.ok(bashrc.startsWith('export KEEP_ME=yes\n'));
    assert.equal(bashrc.split('\n').filter((line) => line.includes('/tanaabot/env.sh')).length, 1);
    assert.equal(
      readFileSync(path.join(f.home, '.profile'), 'utf8').split('\n').filter(Boolean).length,
      1,
    );
    assert.equal(existsSync(path.join(f.home, '.gitconfig')), false);
    assert.equal(existsSync(path.join(f.home, '.ssh')), false);
  });

  it('should not treat a disabled plugin or failed installation as ready', () => {
    const disabled = shell(
      `codex_tools() { printf '%s\\n' '{"ok":true,"inspection":{"installed":true,"enabled":false}}'; }; check_plugin selected`,
      [],
      f.env,
    );
    assert.equal(disabled.status, 1);
    assert.match(disabled.stderr, /not installed and enabled/);
    const failed = shell('codex_tools() { return 7; }; check_plugin selected', [], f.env);
    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /readiness failed/);
  });

  it('should preserve conflicting guidance before Bootbox or plugin effects', () => {
    f.executable('stow', 'exit 1');
    mkdirSync(path.join(f.home, '.codex'));
    const guidance = path.join(f.home, '.codex/AGENTS.md');
    writeFileSync(guidance, 'existing private guidance');
    const result = shell('REPO_DIR="$1"; apply_agent', [root], f.env);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /conflict with existing configuration/);
    assert.equal(readFileSync(guidance, 'utf8'), 'existing private guidance');
    assert.doesNotMatch(result.stdout + result.stderr, /existing private guidance/);
    assert.equal(existsSync(path.join(f.home, '.bashrc')), false);
    assert.equal(existsSync(f.env.XDG_DATA_HOME), false);
  });
});
