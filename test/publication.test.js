import { test } from 'bun:test';
import assert from 'node:assert/strict';

import {
  preparePublication,
  readRecordedPublication,
  receiptPath,
  repository,
  validateReceipt,
  validateSyncSource,
} from '../lib/publication.js';

const installed = 'a'.repeat(40);
const defaultHead = 'b'.repeat(40);
const movingHead = 'c'.repeat(40);
const treeSha = 'd'.repeat(40);
const blobSha = 'e'.repeat(40);
const branchReceipt = {
  version: 1,
  repository,
  setupId: 'main-0012dead',
  selector: 'main',
  mode: 'branch',
  installedCommit: installed,
  branch: 'main',
  tag: null,
  fallback: null,
  target: { branch: 'main' },
};
const tagReceipt = {
  ...branchReceipt,
  setupId: 'v1.2.3-abc01234',
  selector: 'v1.2.3',
  mode: 'tag',
  branch: null,
  tag: 'v1.2.3',
  target: { commit: installed },
};
const fallbackReceipt = {
  ...tagReceipt,
  selector: 'stable',
  mode: 'channel',
  branch: 'main',
  tag: null,
  fallback: 'dev',
};

function githubFixture({ receipt = branchReceipt, treeOverrides } = {}) {
  const content = Buffer.from(JSON.stringify(receipt));
  const routes = {
    '': { full_name: repository, default_branch: 'main' },
    '/branches/main': {
      name: 'main',
      commit: { sha: defaultHead, commit: { tree: { sha: treeSha } } },
    },
    [`/git/trees/${treeSha}`]: {
      sha: treeSha,
      truncated: false,
      tree: receipt
        ? [{ path: receiptPath, type: 'blob', mode: '100644', sha: blobSha, size: content.length }]
        : [],
      ...treeOverrides,
    },
    [`/git/blobs/${blobSha}`]: {
      sha: blobSha,
      encoding: 'base64',
      content: content.toString('base64'),
    },
  };
  return (path) => {
    assert.ok(Object.hasOwn(routes, path), `unexpected GitHub read: ${path}`);
    return routes[path];
  };
}

test('the worker accepts a bootstrap handoff at the observed default branch head', () => {
  const selection = {
    receiptAt: defaultHead,
    receipt: null,
    sourceCommit: defaultHead,
    bootstrapBranch: 'trunk',
  };
  assert.deepEqual(validateSyncSource(selection), selection);
  for (const unverified of [
    { ...selection, receipt: undefined },
    { ...selection, bootstrapBranch: undefined },
    { ...selection, sourceCommit: movingHead },
  ]) {
    assert.throws(
      () => validateSyncSource(unverified),
      /sync-source-selection-invalid|publication-receipt-invalid/,
    );
  }
});

test('the worker accepts the selected branch SHA without a bootstrap branch', () => {
  const selection = { receiptAt: defaultHead, receipt: branchReceipt, sourceCommit: movingHead };
  assert.deepEqual(validateSyncSource(selection), selection);
  assert.throws(
    () => validateSyncSource({ ...selection, bootstrapBranch: 'main' }),
    /sync-source-selection-invalid/,
  );
});

test('the worker requires the installed SHA for tag, channel and commit receipts', () => {
  for (const receipt of [
    tagReceipt,
    { ...tagReceipt, selector: 'edge', mode: 'channel' },
    fallbackReceipt,
    { ...tagReceipt, selector: installed.toUpperCase(), mode: 'commit', tag: null },
  ]) {
    const selection = { receiptAt: defaultHead, receipt, sourceCommit: installed };
    assert.deepEqual(validateSyncSource(selection), selection);
    assert.throws(
      () => validateSyncSource({ ...selection, sourceCommit: movingHead }),
      /sync-source-selection-invalid/,
    );
  }
});

test('an invalid receipt or incomplete tree blocks publication preparation', async () => {
  for (const [options, error] of [
    [{ receipt: { ...fallbackReceipt, target: { branch: 'main' } } }, /publication-policy-invalid/],
    [{ treeOverrides: { truncated: true } }, /publication-tree-unverified/],
    [{ treeOverrides: { tree: [{ type: 'blob' }] } }, /publication-tree-unverified/],
    [
      { treeOverrides: { tree: [{ path: receiptPath, type: 'blob', mode: '120000' }] } },
      /publication-receipt-file-invalid/,
    ],
  ]) {
    await assert.rejects(preparePublication(githubFixture(options), branchReceipt), error);
  }
});

test('GitHub read failures block publication preparation', async () => {
  const read = githubFixture();
  for (const failedPath of [
    '',
    '/branches/main',
    `/git/trees/${treeSha}`,
    `/git/blobs/${blobSha}`,
  ]) {
    const accessError = new Error('GitHub access failed');
    await assert.rejects(
      preparePublication((path) => {
        if (path === failedPath) throw accessError;
        return read(path);
      }, branchReceipt),
      (error) => error === accessError,
    );
  }
});

test('recording prepares only the validated receipt against the observed default branch head', async () => {
  const read = githubFixture({ receipt: null });
  assert.equal((await readRecordedPublication(read)).receipt, null);
  const prepared = await preparePublication(read, branchReceipt);
  assert.equal(prepared.status, 'prepared');
  assert.deepEqual(prepared.commitInput.branch, {
    repositoryNameWithOwner: repository,
    branchName: 'main',
  });
  assert.equal(prepared.commitInput.expectedHeadOid, defaultHead);
  assert.deepEqual(prepared.commitInput.fileChanges, {
    additions: [
      {
        path: receiptPath,
        contents: Buffer.from(`${JSON.stringify(branchReceipt, null, 2)}\n`).toString('base64'),
      },
    ],
  });
});

test('repeating a recorded setup is a no-op and an old task cannot match a new setup ID', async () => {
  const read = githubFixture();
  assert.equal((await preparePublication(read, branchReceipt)).status, 'already-recorded');
  await assert.rejects(
    preparePublication(read, { ...branchReceipt, installedCommit: movingHead }),
    /publication-setup-id-conflict/,
  );
  assert.throws(
    () => validateReceipt(branchReceipt, 'main-0123abcd'),
    /publication-setup-id-mismatch/,
  );
});
