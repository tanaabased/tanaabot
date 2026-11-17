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

try {
  if (!checkout || process.argv.length !== 3) {
    throw new Error('Usage: bun --no-env-file git-identity.js <prepared-checkout>');
  }
  const revision = git(['rev-parse', '--verify', 'HEAD']);
  const expected = identity(['--blob', `${revision}:${source}`]);
  if (!expected.name || !expected.email) throw new Error('Committed Git identity is missing.');
  const author = commitIdentity('GIT_AUTHOR_IDENT');
  const committer = commitIdentity('GIT_COMMITTER_IDENT');
  const sourceChanged =
    git(['diff', '--quiet', '--no-ext-diff', '--no-textconv', revision, '--', source], true) ===
    null;
  const matches = (value) => value.name === expected.name && value.email === expected.email;
  const status = [author, committer].every(matches) ? 'passed' : 'failed';
  const report = {
    status,
    sourceChanged,
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
