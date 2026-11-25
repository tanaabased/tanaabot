import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, expect, test } from 'bun:test';

const task = fileURLToPath(new URL('../scripts/postgres-task.js', import.meta.url));
const fixture = new URL('./postgres-child.js', import.meta.url);
let directory;
let env;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'tanaabot-postgres-'));
  const source = await readFile(fixture, 'utf8');
  for (const tool of ['socat', 'psql']) {
    await writeFile(join(directory, tool), `#!${process.execPath}\n${source}`, { mode: 0o700 });
  }
  env = {
    PATH: [directory, process.env.PATH].join(delimiter),
    PGHOST: 'test-db.example.internal',
    PGPORT: '5433',
    PGUSER: 'fixture-user',
    PGPASSWORD: 'fixture-password',
    PGSSLMODE: 'verify-full',
    PGSSLROOTCERT: '/fixture/ca.pem',
    PGSERVICE: 'must-not-override-the-relay',
  };
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

async function run(args) {
  const child = globalThis.Bun.spawn([process.execPath, '--no-env-file', task, ...args], {
    env,
    stdout: 'pipe',
    stderr: 'pipe',
    signal: AbortSignal.timeout(4_000),
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    child.stdout.text(),
    child.stderr.text(),
  ]);
  return { exitCode, stdout, stderr };
}

async function expectRelayStopped() {
  const pid = Number(await readFile(join(directory, 'relay.pid'), 'utf8'));
  expect(() => process.kill(pid, 0)).toThrow(expect.objectContaining({ code: 'ESRCH' }));
}

test('runs the bounded authenticated probe with SSL settings and cleans up the relay', async () => {
  expect(await run(['--check'])).toEqual({ exitCode: 0, stdout: '1\n', stderr: '' });
  await expectRelayStopped();
});

test('reuses the relay for a query against the supplied database', async () => {
  env.PGDATABASE = 'fixture-database';
  expect(await run(['-c', 'SELECT current_database()'])).toEqual({
    exitCode: 0,
    stdout: 'fixture-database\n',
    stderr: '',
  });
  await expectRelayStopped();
});

test.each([
  ['route-denied', 2, 'proxy-connect-rejected'],
  ['auth-denied', 2, 'postgresql-authentication-failed'],
  ['wrong-result', 1, 'unexpected-query-result'],
])('returns a sanitized check result for %s and cleans up', async (failure, exitCode, status) => {
  env.PGHOST = `${failure}.example.internal`;
  expect(await run(['--check'])).toEqual({ exitCode, stdout: '', stderr: `${status}\n` });
  await expectRelayStopped();
});

test('checks configuration before first publication without starting a relay', async () => {
  expect(await run(['--check-config'])).toEqual({
    exitCode: 0,
    stdout: 'configuration-ready\n',
    stderr: '',
  });
  await expect(readFile(join(directory, 'relay.pid'))).rejects.toMatchObject({ code: 'ENOENT' });
  env.PGHOST = 'bad.example,exec:invalid';
  expect(await run(['--check'])).toEqual({
    exitCode: 2,
    stdout: '',
    stderr: 'invalid-postgresql-configuration\n',
  });
  await expect(readFile(join(directory, 'relay.pid'))).rejects.toMatchObject({ code: 'ENOENT' });
});
