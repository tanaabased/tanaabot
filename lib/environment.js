import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

class EnvironmentError extends Error {}

const root = fileURLToPath(new URL('../', import.meta.url));
const reject = (message) => {
  throw new EnvironmentError(message);
};

function safePath(path, directory, privateMode = false) {
  const stat = lstatOptional(path);
  if (!stat)
    reject(
      'Private environment storage is missing. Run agent setup with OP_SERVICE_ACCOUNT_TOKEN supplied privately.',
    );
  if (
    stat.isSymbolicLink() ||
    (directory ? !stat.isDirectory() : !stat.isFile()) ||
    stat.uid !== process.getuid() ||
    (privateMode ? (stat.mode & 0o777) !== (directory ? 0o700 : 0o600) : (stat.mode & 0o022) !== 0)
  )
    reject(
      'Environment storage has unsafe ownership, permissions or a symlink. Preserve it and resolve the conflict.',
    );
}

function validateVariables(variables) {
  if (
    !variables ||
    Array.isArray(variables) ||
    typeof variables !== 'object' ||
    !Object.keys(variables).length
  ) {
    reject('The saved environment must contain at least one variable.');
  }
  for (const [name, value] of Object.entries(variables)) {
    if (
      !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ||
      /^(?:_tanaabot_|BASH|OP_SERVICE_ACCOUNT_TOKEN$)/.test(name) ||
      ['HOME', 'IFS', 'SHELLOPTS', 'UID', 'EUID', 'PPID', '_'].includes(name) ||
      typeof value !== 'string' ||
      value.includes('\0')
    )
      reject('The environment contains an invalid variable or a reserved shell control name.');
  }
  return variables;
}

function readSaved(file, environment) {
  safePath(file, false, true);
  const saved = JSON.parse(readFileSync(file, 'utf8'));
  if (saved.environment !== environment)
    reject(
      'The saved environment belongs to a different 1Password Environment. Refresh it during setup.',
    );
  return validateVariables(saved.variables);
}

function refresh(file, environment) {
  if (!process.env.OP_SERVICE_ACCOUNT_TOKEN)
    reject(
      'Set OP_SERVICE_ACCOUNT_TOKEN through private Cloud configuration before refreshing the environment.',
    );
  const env = { ...process.env, OP_BIOMETRIC_UNLOCK_ENABLED: 'false' };
  for (const name of Object.keys(env)) {
    if (/^OP_(?:CONNECT_|SESSION_|ACCOUNT$)/.test(name)) delete env[name];
  }
  const result = spawnSync(
    'op',
    ['environment', 'secret', 'list', environment, '--reveal', '--format=json'],
    {
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 60000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  if (result.error || result.status !== 0)
    reject(
      '1Password environment refresh failed. Check service-account access and op 2.42+; the previous file was preserved.',
    );
  const secrets = JSON.parse(result.stdout);
  if (!Array.isArray(secrets))
    reject(
      '1Password returned an unsupported environment format; the previous file was preserved.',
    );
  const variables = Object.create(null);
  for (const secret of secrets) {
    if (!secret || typeof secret.name !== 'string' || Object.hasOwn(variables, secret.name))
      reject(
        '1Password returned invalid or duplicate variable names; the previous file was preserved.',
      );
    variables[secret.name] = secret.value;
  }
  validateVariables(variables);
  const temporary = mkdtempSync(join(dirname(file), '.environment-'));
  try {
    const candidate = join(temporary, 'environment.json');
    writeFileSync(candidate, `${JSON.stringify({ environment, variables })}\n`, {
      mode: 0o600,
      flag: 'wx',
    });
    // Rename on the same filesystem only after the complete response has passed validation.
    renameSync(candidate, file);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

/** Refresh privately, check actual exported values, or emit NUL-delimited data for the shell loader. */
export default function environmentTask(action) {
  try {
    const environment = globalThis.Bun.YAML.parse(
      readFileSync(join(root, '.agent-system/agent.yaml'), 'utf8'),
    )?.environment?.op;
    if (typeof environment !== 'string' || !environment.trim())
      reject('agent.yaml must select a 1Password Environment.');
    const home = process.env.HOME;
    if (!home || !isAbsolute(home)) reject('Environment storage requires an absolute HOME.');
    const folder = join(home, '.local/state/tanaabot');
    const file = join(folder, 'environment.json');
    const writing = action === '--refresh' || action === '--ensure';
    safePath(home, true);
    for (const path of [join(home, '.local'), join(home, '.local/state'), folder]) {
      if (writing && !existsSync(path)) mkdirSync(path, { mode: 0o700 });
      safePath(path, true, path === folder);
    }
    const realFolder = realpathSync(folder);
    const realRoot = realpathSync(root);
    if (realFolder === realRoot || realFolder.startsWith(`${resolve(realRoot)}${sep}`))
      reject('Private environment storage must be outside the Tanaabot checkout.');
    if (lstatOptional(file)) safePath(file, false, true);
    if (action === '--refresh' || (action === '--ensure' && process.env.OP_SERVICE_ACCOUNT_TOKEN)) {
      refresh(file, environment);
      process.stdout.write('done: Private environment refreshed. Open a fresh shell to load it.\n');
      return;
    }
    const variables = readSaved(file, environment);
    if (action === '--export') {
      for (const [name, value] of Object.entries(variables))
        process.stdout.write(`${name}\0${value}\0`);
      return;
    }
    if (
      action === '--check' &&
      Object.entries(variables).some(([name, value]) => process.env[name] !== value)
    ) {
      reject(
        'Saved environment values are missing or differ in this command environment. Check the launcher and shell initialization.',
      );
    }
    process.stdout.write(
      action === '--ensure'
        ? 'note: Reusing the saved private environment.\n'
        : 'done: Private environment and exported values match.\n',
    );
  } catch (error) {
    // Provider output and JSON parser errors can contain secrets. Never print them.
    process.stderr.write(
      `error: ${error instanceof EnvironmentError ? error.message : 'Cannot read or refresh the private environment. Check configuration, file safety and 1Password access; any previous file was preserved.'}\n`,
    );
    process.exitCode = 1;
  }
}

function lstatOptional(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}
