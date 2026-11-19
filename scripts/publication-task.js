#!/usr/bin/env bun
import { execFileSync, spawnSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import {
  parseReceipt,
  preparePublication,
  recordPublication,
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

function commitReceipt(input) {
  const query = `mutation RecordPublication($input: CreateCommitOnBranchInput!) {
    createCommitOnBranch(input: $input) { commit { oid } }
  }`;
  const result = spawnSync('gh', ['api', '--hostname', 'github.com', 'graphql', '--input', '-'], {
    input: JSON.stringify({ query, variables: { input } }),
    encoding: 'utf8',
    timeout: 30000,
  });
  let response;
  try {
    response = JSON.parse(result.stdout);
  } catch {
    // a transport failure can leave gh with only a diagnostic on stderr.
  }
  if (result.status !== 0 || response?.errors?.length) {
    const reason =
      response?.errors?.[0]?.message ??
      result.stderr?.split('\n').find((line) => line.startsWith('gh: '));
    const error = new Error('publication-github-write-failed');
    error.detail = reason || result.error?.code || 'No commit response received';
    throw error;
  }
  return response?.data?.createCommitOnBranch?.commit?.oid;
}

try {
  const [mode, expectedSetupId, preparedHead, ...extra] = process.argv.slice(2);
  if (
    extra.length ||
    (preparedHead !== undefined && mode !== 'record') ||
    (expectedSetupId !== undefined && mode === 'recorded')
  )
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
    case 'record':
      if (!expectedSetupId) throw new Error('publication-expected-setup-id-required');
      result = await recordPublication(
        readGitHub,
        commitReceipt,
        readLocal(expectedSetupId),
        preparedHead,
      );
      break;
    default:
      throw new Error('publication-arguments-invalid');
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  const code = error.message.startsWith('publication-') ? error.message : 'publication-read-failed';
  process.stderr.write(`${JSON.stringify({ status: 'error', code, detail: error.detail })}\n`);
  process.exitCode = 1;
}
