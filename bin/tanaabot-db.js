#!/usr/bin/env bun
import { request } from 'node:http';
import process from 'node:process';

import pg from 'pg';

import manifest from '../package.json' with { type: 'json' };

const usage = `Usage: tanaabot-db -c SQL
       tanaabot-db --help | --version

Run SQL through the Cloud TCP proxy and print rows as JSON.
Uses PGHOST, PGPORT, PGUSER, PGPASSWORD and PGDATABASE.
TLS settings are PGSSLMODE, PGSSLROOTCERT, PGSSLCERT and PGSSLKEY.`;

function connectionURL(env) {
  const { PGHOST: host, PGPORT: port = '5432', PGSSLMODE: mode = 'require' } = env;
  if (
    !host ||
    !/^[a-z0-9][a-z0-9.-]*$/i.test(host) ||
    !/^\d{1,5}$/.test(port) ||
    Number(port) < 1 ||
    Number(port) > 65535 ||
    !env.PGUSER ||
    !env.PGPASSWORD
  ) {
    throw new Error('Set PGHOST, PGPORT, PGUSER and PGPASSWORD in the saved environment.');
  }
  if (!['prefer', 'require', 'verify-ca', 'verify-full'].includes(mode)) {
    throw new Error('Set PGSSLMODE to require, verify-ca or verify-full for this database.');
  }
  const url = new URL(`postgresql://${host}:${port}`);
  url.searchParams.set('sslmode', mode === 'prefer' ? 'require' : mode);
  url.searchParams.set('uselibpqcompat', 'true');
  for (const [name, value] of Object.entries({
    sslrootcert: env.PGSSLROOTCERT,
    sslcert: env.PGSSLCERT,
    sslkey: env.PGSSLKEY,
  })) {
    if (value) url.searchParams.set(name, value);
  }
  return url;
}

function openTunnel(authority, signal) {
  return new Promise((resolve, reject) => {
    const req = request({
      host: 'proxy',
      port: 8088,
      method: 'CONNECT',
      path: authority,
      headers: { Host: authority },
      agent: false,
      signal,
    });
    req.once('connect', (response, socket, head) => {
      if (response.statusCode !== 200) {
        socket.destroy();
        reject(
          new Error(`Cloud proxy refused the database connection (HTTP ${response.statusCode}).`),
        );
        return;
      }
      if (head.length) socket.unshift(head);
      resolve(socket);
    });
    req.once('error', () => {
      reject(
        new Error(
          signal.aborted ? 'Database command timed out.' : 'Could not reach the Cloud TCP proxy.',
        ),
      );
    });
    req.end();
  });
}

async function query(sql, env) {
  const url = connectionURL(env);
  const signal = AbortSignal.timeout(15_000);
  const socket = await openTunnel(url.host, signal);
  const stop = () => socket.destroy();
  signal.addEventListener('abort', stop, { once: true });
  try {
    // pg calls connect() on its stream. Report the already-open tunnel as connected once.
    const connect = socket.connect;
    socket.connect = () => {
      socket.connect = connect;
      queueMicrotask(() => socket.emit('connect'));
      return socket;
    };
    const client = new pg.Client({
      connectionString: url.href,
      database: env.PGDATABASE || env.PGUSER,
      stream: socket,
    });
    // pg also emits an error for disconnects between queries.
    client.on('error', () => {});
    await client.connect();
    const result = await client.query(sql);
    await client.end();
    return Array.isArray(result) ? result.flatMap(({ rows }) => rows) : result.rows;
  } catch (error) {
    if (signal.aborted) throw new Error('Database command timed out.', { cause: error });
    if (error.code === '28P01' || error.code === '28000') {
      throw new Error('PostgreSQL rejected authentication.', { cause: error });
    }
    if (error instanceof pg.DatabaseError && /^[0-9A-Z]{5}$/.test(error.code)) {
      throw new Error(`PostgreSQL returned an error (SQLSTATE ${error.code}).`, { cause: error });
    }
    throw new Error(
      'Could not connect to PostgreSQL through the proxy. Check the endpoint and TLS settings.',
      { cause: error },
    );
  } finally {
    signal.removeEventListener('abort', stop);
    stop();
  }
}

const [flag, sql, ...extra] = process.argv.slice(2);
if (['-h', '--help', '--version'].includes(flag) && !sql && !extra.length) {
  process.stdout.write(`${flag === '--version' ? manifest.version : usage}\n`);
} else if (flag !== '-c' || !sql?.trim() || extra.length) {
  process.stderr.write(`${usage}\n`);
  process.exitCode = 2;
} else {
  try {
    process.stdout.write(`${JSON.stringify(await query(sql, process.env))}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
