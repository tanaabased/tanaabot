import assert from 'node:assert/strict';

import { shell } from './tanaboot-fixture.js';

describe('tanaboot', () => {
  it('should preserve the selected setup mode and action', () => {
    const result = shell('parse_args "$@"; printf "%s %s %s" "$TARGET" "$ACTION" "$SOURCE_REF"', [
      '--agent',
      '--check',
      '--ref',
      'pilot',
    ]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'agent check pilot');
  });

  for (const args of [
    ['--host', '--agent'],
    ['--check', '--dry-run'],
    ['--ref'],
    ['--ref', '--host'],
    ['--ref', 'main', '--ref', 'pilot'],
    ['--unknown'],
  ]) {
    it(`should reject invalid arguments ${args.join(' ')}`, () => {
      const result = shell('parse_args "$@"', args);
      assert.equal(result.status, 2);
      assert.match(result.stderr, /error/);
    });
  }

  it('should allow CLI debug selection to override the environment', () => {
    const result = shell('parse_args --debug=false; debug hidden', [], { TANABOOT_DEBUG: '1' });
    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');
  });

  const branch = '1'.repeat(40);
  const tag = '2'.repeat(40);
  const commit = '3'.repeat(40);
  const resolve = (rows, ref = 'pilot') =>
    shell(
      'git() { if [[ "$1" == ls-remote ]]; then printf "%s\\n" "$REF_ROWS"; elif [[ "$1" == check-ref-format ]]; then return 0; else return 99; fi; }; resolve_ref canonical "$1"',
      [ref],
      { REF_ROWS: rows },
    );

  it('should resolve an exact branch', () => {
    const result = resolve(`${branch}\trefs/heads/pilot`);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), branch);
  });

  it('should peel an annotated tag to its commit', () => {
    const result = resolve(`${tag}\trefs/tags/pilot\n${commit}\trefs/tags/pilot^{}`);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), commit);
  });

  it('should reject a branch and tag collision even when their commits match', () => {
    const result = resolve(`${branch}\trefs/heads/pilot\n${branch}\trefs/tags/pilot`);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /ambiguous/);
  });

  it('should normalize a full commit without looking up another reference', () => {
    const result = resolve('', 'ABCDEF0123456789ABCDEF0123456789ABCDEF01');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'abcdef0123456789abcdef0123456789abcdef01');
  });

  it('should reject unavailable references without a default', () => {
    const result = resolve('');
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
  });
});
