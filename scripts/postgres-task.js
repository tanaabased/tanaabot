import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const loopback = '127.0.0.1';
const queryTimeoutMs = 15_000;
const relayTimeoutMs = 3_000;
const probe = ['-v', 'ON_ERROR_STOP=1', '-Atqc', 'SELECT 1'];

function completed(child) {
  return new Promise((resolve) => {
    child.once('error', () => resolve(null));
    child.once('close', resolve);
  });
}

function result(exitCode, status) {
  return { exitCode, status };
}

function connectionFailure(clientError, relayError) {
  if (/FATAL:.*(?:authentication failed|no pg_hba\.conf entry)/i.test(clientError)) {
    return 'postgresql-authentication-failed';
  }
  if (/proxy_connect: received answer "HTTP\/1\.[01] +[45]\d\d\b/.test(relayError)) {
    return 'proxy-connect-rejected';
  }
  return 'postgresql-connection-or-query-failed';
}

function stopRelay(pid) {
  // Stop the listener and all its forked connections, including on timeout or signal.
  try {
    process.kill(-pid, 'SIGKILL');
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

async function connect({ tools, check, args, env }) {
  let client;
  let relayError = '';
  const ready = Promise.withResolvers();
  const interrupted = Promise.withResolvers();
  const stop = () => interrupted.resolve(result(130, 'interrupted'));
  const interrupt = () => {
    // Let interactive psql receive Ctrl-C without tearing down the tunnel on query cancellation.
    if (check || !client || !process.stdin.isTTY) stop();
  };
  const relay = spawn(
    tools.socat,
    [
      '-d',
      '-d',
      '-d',
      `TCP4-LISTEN:0,bind=${loopback},fork`,
      `PROXY:proxy:${env.PGHOST}:${env.PGPORT},proxyport=8088,resolve=0`,
    ],
    { detached: true, stdio: ['ignore', 'ignore', 'pipe'], env: { PATH: env.PATH, LC_ALL: 'C' } },
  );
  const relayFailed = completed(relay).then(() => result(1, 'relay-unavailable'));

  relay.stderr.setEncoding('utf8').on('data', (chunk) => {
    relayError = (relayError + chunk).slice(-4096);
    // The listener chooses its own port. Its readiness message avoids a probe connection.
    const match = relayError.match(
      /listening on (?:LEN=\d+ )?AF=2 127\.0\.0\.1:([1-9]\d{0,4})\r?\n/,
    );
    if (match) ready.resolve(match[1]);
  });

  process.on('SIGINT', interrupt);
  process.on('SIGTERM', stop);
  process.on('SIGHUP', stop);
  try {
    const localPort = await Promise.race([
      ready.promise,
      relayFailed,
      interrupted.promise,
      delay(relayTimeoutMs, result(1, 'relay-start-timeout'), { ref: false }),
    ]);
    if (typeof localPort !== 'string') return localPort;

    const clientEnv = {
      ...env,
      PGDATABASE: env.PGDATABASE || env.PGUSER,
      PGHOSTADDR: loopback,
      PGPORT: localPort,
      PGCONNECT_TIMEOUT: env.PGCONNECT_TIMEOUT || '10',
    };
    // A service definition takes precedence over libpq's environment defaults.
    delete clientEnv.PGSERVICE;
    if (check) clientEnv.LC_ALL = 'C';

    client = spawn(tools.psql, ['-X', '-w', ...(check ? probe : args)], {
      env: clientEnv,
      stdio: check ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });
    const clientDone = completed(client);
    let stdout = '';
    let stderr = '';
    if (check) {
      client.stdout.setEncoding('utf8').on('data', (chunk) => {
        stdout = (stdout + chunk).slice(0, 64);
      });
      client.stderr.setEncoding('utf8').on('data', (chunk) => {
        stderr = (stderr + chunk).slice(-4096);
      });
    }
    const pending = [clientDone, interrupted.promise, relayFailed];
    if (check) pending.push(delay(queryTimeoutMs, result(1, 'postgresql-timeout'), { ref: false }));
    const exit = await Promise.race(pending);
    if (exit && typeof exit === 'object') return exit;
    if (exit === null) return result(1, 'psql-unavailable');
    if (!check) return result(exit);
    if (exit !== 0) return result(exit, connectionFailure(stderr, relayError));
    return stdout === '1\n' ? result(0, '1') : result(1, 'unexpected-query-result');
  } finally {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', stop);
    process.off('SIGHUP', stop);
    if (client && client.exitCode === null && client.signalCode === null) client.kill('SIGKILL');
    if (relay.pid) stopRelay(relay.pid);
  }
}

async function main(args, env) {
  const option = args[0];
  const check = option === '--check';
  const checkConfig = option === '--check-config';
  const usage =
    'Usage: bun --no-env-file scripts/postgres-task.js [--check | --check-config | psql-options]';
  if (option === '--help') return result(0, usage);
  if ((check || checkConfig) && args.length !== 1) return result(2, usage);
  // Only a single DNS name and numerical TCP port belong in socat's PROXY address.
  if (
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.?$/i.test(
      env.PGHOST ?? '',
    ) ||
    !/^[1-9]\d{0,4}$/.test(env.PGPORT ?? '') ||
    Number(env.PGPORT) > 65535 ||
    !env.PGUSER ||
    !env.PGPASSWORD
  ) {
    return result(2, 'invalid-postgresql-configuration');
  }
  const tools = { psql: globalThis.Bun.which('psql'), socat: globalThis.Bun.which('socat') };
  if (!tools.psql) return result(1, 'psql-unavailable');
  if (!tools.socat) return result(1, 'socat-unavailable');
  if (checkConfig) return result(0, 'configuration-ready');
  return connect({ tools, check, args, env });
}

try {
  const { exitCode, status } = await main(process.argv.slice(2), process.env);
  if (status) (exitCode ? process.stderr : process.stdout).write(`${status}\n`);
  process.exitCode = exitCode;
} catch {
  process.stderr.write('postgresql-command-failed\n');
  process.exitCode = 1;
}
