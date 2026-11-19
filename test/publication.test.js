import { test } from 'bun:test';
import assert from 'node:assert/strict';

import {
  preparePublication,
  readRecordedPublication,
  receiptPath,
  repository,
  resolveSyncSource,
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
  const calls = [];
  const routes = {
    '': { full_name: repository, default_branch: 'main' },
    '/branches/main': {
      name: 'main',
      commit: { sha: defaultHead, commit: { tree: { sha: treeSha } } },
    },
    '/branches/topic%2Fsync': { name: 'topic/sync', commit: { sha: movingHead } },
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
    [`/git/commits/${installed}`]: { sha: installed },
  };
  return {
    calls,
    read(path) {
      calls.push(path);
      assert.ok(Object.hasOwn(routes, path), `unexpected GitHub read: ${path}`);
      return routes[path];
    },
  };
}

test('a branch run keeps its recorded branch and resolves it only once', async () => {
  const receipt = {
    ...branchReceipt,
    selector: 'dev',
    branch: 'topic/sync',
    target: { branch: 'topic/sync' },
  };
  const { read, calls } = githubFixture({ receipt });
  const selection = await resolveSyncSource(read);
  assert.deepEqual(selection, { receiptAt: defaultHead, receipt, sourceCommit: movingHead });
  assert.deepEqual(calls, [
    '',
    '/branches/main',
    `/git/trees/${treeSha}`,
    `/git/blobs/${blobSha}`,
    '/branches/topic%2Fsync',
  ]);
  assert.deepEqual(validateSyncSource(selection), selection);
});

test('a default branch run reuses the same head that supplied the receipt', async () => {
  const { read, calls } = githubFixture();
  const source = await resolveSyncSource(read);
  assert.equal(source.sourceCommit, defaultHead);
  assert.equal(source.receipt.installedCommit, installed);
  assert.deepEqual(calls, ['', '/branches/main', `/git/trees/${treeSha}`, `/git/blobs/${blobSha}`]);
});

test('tag and channel receipts pin the installed SHA without looking up tags or releases', async () => {
  for (const receipt of [
    tagReceipt,
    { ...tagReceipt, selector: 'edge', mode: 'channel' },
    fallbackReceipt,
    { ...tagReceipt, selector: installed.toUpperCase(), mode: 'commit', tag: null },
  ]) {
    const { read, calls } = githubFixture({ receipt });
    const selection = await resolveSyncSource(read);
    assert.equal(selection.sourceCommit, installed);
    assert.equal(calls.at(-1), `/git/commits/${installed}`);
    assert.throws(
      () => validateSyncSource({ ...selection, sourceCommit: movingHead }),
      /sync-source-selection-invalid/,
    );
  }
});

test('a contradictory or incomplete receipt blocks sync without falling back to main', async () => {
  for (const [options, error] of [
    [{ receipt: null }, /publication-receipt-missing/],
    [{ receipt: { ...fallbackReceipt, target: { branch: 'main' } } }, /publication-policy-invalid/],
    [{ treeOverrides: { truncated: true } }, /publication-tree-unverified/],
    [
      { treeOverrides: { tree: [{ path: receiptPath, type: 'blob', mode: '120000' }] } },
      /publication-receipt-file-invalid/,
    ],
  ]) {
    await assert.rejects(resolveSyncSource(githubFixture(options).read), error);
  }
});

test('recording prepares only the validated receipt against the observed default branch head', async () => {
  const { read } = githubFixture({ receipt: null });
  assert.equal((await readRecordedPublication(read, { allowMissing: true })).receipt, null);
  const prepared = await preparePublication(read, branchReceipt);
  assert.equal(prepared.status, 'prepared');
  assert.equal(prepared.previousSetupId, null);
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
  const { read } = githubFixture();
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
