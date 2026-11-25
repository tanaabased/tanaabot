import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import process from 'node:process';

const [, executable, ...args] = process.argv;
const env = process.env;

if (basename(executable) === 'socat') {
  assert.equal(env.PGPASSWORD, undefined);
  assert.equal(env.PGUSER, undefined);
  assert.deepEqual(args.slice(0, 4), ['-d', '-d', '-d', 'TCP4-LISTEN:0,bind=127.0.0.1,fork']);
  assert.match(args[4], /^PROXY:proxy:[a-z-]+\.example\.internal:5433,proxyport=8088,resolve=0$/);
  writeFileSync(join(dirname(executable), 'relay.pid'), String(process.pid));
  const socketLength = args[4].includes('auth-denied') ? '' : 'LEN=16 ';
  process.stderr.write(`socat[123] N listening on ${socketLength}AF=2 127.0.0.1:45678\n`);
  if (args[4].includes('route-denied')) {
    process.stderr.write('socat[123] I proxy_connect: received answer "HTTP/1.1 403 Forbidden"\n');
  }
  setInterval(() => {}, 1000);
} else {
  assert.equal(env.PGHOSTADDR, '127.0.0.1');
  assert.equal(env.PGPORT, '45678');
  assert.match(env.PGHOST, /^[a-z-]+\.example\.internal$/);
  assert.equal(env.PGUSER, 'fixture-user');
  assert.equal(env.PGPASSWORD, 'fixture-password');
  assert.equal(env.PGSSLMODE, 'verify-full');
  assert.equal(env.PGSSLROOTCERT, '/fixture/ca.pem');
  assert.equal(env.PGSERVICE, undefined);

  if (env.PGHOST === 'test-db.example.internal' && env.PGDATABASE === 'fixture-database') {
    assert.deepEqual(args, ['-X', '-w', '-c', 'SELECT current_database()']);
    process.stdout.write('fixture-database\n');
  } else {
    assert.equal(env.PGDATABASE, 'fixture-user');
    assert.deepEqual(args, ['-X', '-w', '-v', 'ON_ERROR_STOP=1', '-Atqc', 'SELECT 1']);
    if (env.PGHOST.startsWith('auth-denied')) {
      process.stderr.write(`FATAL: password authentication failed for user "${env.PGUSER}"\n`);
      process.exitCode = 2;
    } else if (env.PGHOST.startsWith('route-denied')) {
      process.stderr.write(`connection to ${env.PGHOST} closed unexpectedly\n`);
      process.exitCode = 2;
    } else {
      process.stdout.write(env.PGHOST.startsWith('wrong-result') ? '2\n' : '1\n');
    }
  }
}
