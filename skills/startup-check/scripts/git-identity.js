import { spawnSync } from 'node:child_process';

const checkout = process.argv[2];
const source = 'dotfiles/git/.gitconfig';

function git(args, optional = false) {
  const result = spawnSync('git', ['-C', checkout, ...args], { encoding: 'utf8' });
  if (result.status === 0) return result.stdout.trim();
  if (optional && result.status === 1) return null;
  throw new Error(`Could not inspect Git ${args[0]}; raw diagnostics withheld.`);
}

function identity(args) {
  return {
    name: git(['config', ...args, '--get', 'user.name'], true),
    email: git(['config', ...args, '--get', 'user.email'], true),
  };
}

function commitIdentity(variable) {
  const match = git(['var', variable]).match(/^(.*) <([^<>]*)> \d+ [+-]\d{4}$/);
  if (!match) throw new Error(`Could not parse ${variable}; raw value withheld.`);
  return { name: match[1], email: match[2] };
}

function nonIdentityConfig(args) {
  return git(['config', ...args, '--no-includes', '--null', '--list'])
    .split('\0')
    .filter((entry) => entry && !/^user\.(name|email)\n/.test(entry));
}

function signingMatches(baseline) {
  return ['user.signingkey', 'gpg.format', 'commit.gpgsign', 'gpg.ssh.allowedsignersfile']
    .map((key) => {
      const type = key === 'commit.gpgsign' ? ['--bool'] : [];
      const expected = git(['config', '--blob', baseline, ...type, '--get', key], true);
      if (!expected) throw new Error('Committed Git signing configuration is missing.');
      return git(['config', ...type, '--get', key], true) === expected;
    })
    .every(Boolean);
}

try {
  if (!checkout || process.argv.length !== 3) {
    throw new Error('Usage: bun --no-env-file git-identity.js <prepared-checkout>');
  }
  const revision = git(['rev-parse', '--verify', 'HEAD']);
  const baseline = `${revision}:${source}`;
  const expected = identity(['--blob', baseline]);
  if (!expected.name || !expected.email) throw new Error('Committed Git identity is missing.');
  const author = commitIdentity('GIT_AUTHOR_IDENT');
  const committer = commitIdentity('GIT_COMMITTER_IDENT');
  const sourceChanged =
    git(['diff', '--quiet', '--no-ext-diff', '--no-textconv', revision, '--', source], true) ===
    null;
  const workingIdentity = identity(['--file', source]);
  const identityOnly =
    (workingIdentity.name !== expected.name || workingIdentity.email !== expected.email) &&
    JSON.stringify(nonIdentityConfig(['--blob', baseline])) ===
      JSON.stringify(nonIdentityConfig(['--file', source]));
  const sourceDrift = !sourceChanged ? 'none' : identityOnly ? 'identity-only' : 'other';
  const signingStatus = signingMatches(baseline) ? 'passed' : 'failed';
  const matches = (value) => value.name === expected.name && value.email === expected.email;
  const status =
    [author, committer].every(matches) && signingStatus === 'passed' ? 'passed' : 'failed';
  const report = {
    status,
    sourceChanged,
    sourceDrift,
    signingStatus,
    expected,
    author,
    committer,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = status === 'passed' ? 0 : 1;
} catch (error) {
  process.stdout.write(`${JSON.stringify({ status: 'unverified', reason: error.message })}\n`);
  process.exitCode = 2;
}
