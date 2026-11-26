#!/usr/bin/env bun
import { request } from 'node:http';
import process from 'node:process';
import { parseArgs } from 'node:util';

import pg from 'pg';

import manifest from '../package.json' with { type: 'json' };

function terminalStyle(stream, code, value) {
  const { NO_COLOR, FORCE_COLOR } = process.env;
  const enabled = !NO_COLOR && FORCE_COLOR !== '0' && (stream.isTTY || Boolean(FORCE_COLOR));
  return enabled ? `\u001b[${code}m${value}\u001b[0m` : value;
}

function help(stream) {
  const heading = (label) => terminalStyle(stream, '38;2;0;200;138', label);
  const dim = (value) => terminalStyle(stream, '2', value);
  return `Usage: tanaabot-db -c SQL ${dim('[options]')}

Run SQL through the Cloud TCP proxy and print rows as JSON.

${heading('Options:')}
  -c, --command SQL  Run the supplied SQL
      --debug        Write connection progress to stderr
  -h, --help         Show this help
      --version      Show the installed version

${heading('Environment Variables:')}
  PGHOST, PGUSER, PGPASSWORD          Database endpoint and credentials
  PGPORT                              Database port ${dim('[default: 5432]')}
  PGDATABASE                          Database name ${dim('[default: PGUSER]')}
  PGSSLMODE                           TLS mode ${dim('[default: require]')}
  PGSSLROOTCERT, PGSSLCERT, PGSSLKEY  Paths to TLS files
  TANAABOT_DB_DEBUG                   Same as --debug when enabled
`;
}

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

async function query(sql, env, debug) {
  const url = connectionURL(env);
  const signal = AbortSignal.timeout(15_000);
  debug('opening the Cloud proxy tunnel');
  const socket = await openTunnel(url.host, signal);
  const stop = () => socket.destroy();
  signal.addEventListener('abort', stop, { once: true });
  try {
    debug('proxy tunnel established');
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
    debug('PostgreSQL session established');
    const result = await client.query(sql);
    debug('query completed');
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

function commandOptions(args) {
  try {
    return parseArgs({
      args,
      options: {
        command: { type: 'string', short: 'c', multiple: true },
        debug: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean' },
      },
    }).values;
  } catch {
    return {};
  }
}

async function run(args, env) {
  const options = commandOptions(args);
  if (options.help || options.version) {
    process.stdout.write(options.help ? help(process.stdout) : `${manifest.version}\n`);
    return 0;
  }
  if (options.command?.length !== 1 || !options.command[0].trim()) {
    process.stderr.write(help(process.stderr));
    return 2;
  }

  const enabled = options.debug || /^(1|true|yes|on)$/i.test(env.TANAABOT_DB_DEBUG ?? '');
  const debug = (message) => {
    if (enabled) process.stderr.write(`debug: ${message}\n`);
  };
  try {
    const rows = await query(options.command[0], env, debug);
    process.stdout.write(`${JSON.stringify(rows)}\n`);
    return 0;
  } catch (error) {
    const label = terminalStyle(process.stderr, '1;31', 'error');
    process.stderr.write(`${label}: ${error.message}\n`);
    return 1;
  }
}

process.exitCode = await run(process.argv.slice(2), process.env);
