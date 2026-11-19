#!/usr/bin/env bun
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import {
  parseReceipt,
  preparePublication,
  readRecordedPublication,
  repository,
} from '../lib/publication.js';

function readLocal(expectedSetupId) {
  const filename = join(homedir(), '.local/state/tanaabot/publication.json');
  const entry = lstatSync(filename, { throwIfNoEntry: false });
  if (!entry) throw new Error('publication-local-receipt-missing');
  if (!entry.isFile() || entry.size < 1 || entry.size > 4096)
    throw new Error('publication-local-receipt-invalid');
  return parseReceipt(readFileSync(filename, 'utf8'), expectedSetupId);
}

function readGitHub(path) {
  try {
    const result = execFileSync(
      'gh',
      ['api', '--hostname', 'github.com', `repos/${repository}${path}`],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000,
      },
    );
    return JSON.parse(result);
  } catch {
    throw new Error('publication-github-read-failed');
  }
}

try {
  const [mode, expectedSetupId, ...extra] = process.argv.slice(2);
  if (extra.length || (expectedSetupId !== undefined && mode !== 'local' && mode !== 'prepare'))
    throw new Error('publication-arguments-invalid');
  let result;
  switch (mode) {
    case 'local':
      result = readLocal(expectedSetupId);
      break;
    case 'recorded':
      result = await readRecordedPublication(readGitHub);
      break;
    case 'prepare':
      if (!expectedSetupId) throw new Error('publication-expected-setup-id-required');
      result = await preparePublication(readGitHub, readLocal(expectedSetupId));
      break;
    default:
      throw new Error('publication-arguments-invalid');
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  const code = error.message.startsWith('publication-') ? error.message : 'publication-read-failed';
  process.stderr.write(`${JSON.stringify({ status: 'error', code })}\n`);
  process.exitCode = 1;
}
