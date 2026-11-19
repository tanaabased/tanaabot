import { isDeepStrictEqual } from 'node:util';

export const repository = 'tanaabased/tanaabot';
export const receiptPath = 'tanaabot-publication.json';

const commitPattern = /^[a-f0-9]{40}$/u;
const setupIdPattern = /^[A-Za-z0-9._-]{1,24}-[a-f0-9]{8}$/u;
const aliases = ['dev', 'stable', 'edge'];

function isCommit(value) {
  return typeof value === 'string' && commitPattern.test(value);
}

function isRef(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !/[~^:?*[]/u.test(value) &&
    !value.includes('\\') &&
    !value.includes('..') &&
    !value.includes('@{') &&
    !value.endsWith('.') &&
    [...value].every((char) => char.charCodeAt(0) > 32 && char.charCodeAt(0) !== 127) &&
    value.split('/').every((part) => part && !part.startsWith('.') && !part.endsWith('.lock'))
  );
}

function hasTarget(target, key, value) {
  return (
    typeof target === 'object' &&
    target !== null &&
    Object.keys(target).length === 1 &&
    Object.hasOwn(target, key) &&
    target[key] === value
  );
}

export function validateReceipt(receipt, expectedSetupId) {
  const {
    version,
    repository: origin,
    setupId,
    selector,
    mode,
    installedCommit,
    branch,
    tag,
    fallback,
    target,
  } = receipt ?? {};
  if (
    version !== 1 ||
    origin !== repository ||
    typeof setupId !== 'string' ||
    !setupIdPattern.test(setupId) ||
    typeof mode !== 'string' ||
    !isCommit(installedCommit) ||
    Object.keys(receipt).length !== 10
  )
    throw new Error('publication-receipt-invalid');

  const valid = {
    branch: () =>
      isRef(branch) &&
      (selector === 'dev' || (selector === branch && !aliases.includes(selector))) &&
      tag === null &&
      fallback === null &&
      hasTarget(target, 'branch', branch),
    commit: () =>
      typeof selector === 'string' &&
      selector.toLowerCase() === installedCommit &&
      branch === null &&
      tag === null &&
      fallback === null,
    tag: () =>
      selector === tag &&
      isRef(tag) &&
      !aliases.includes(tag) &&
      branch === null &&
      fallback === null,
    channel: () =>
      (selector === 'stable' || selector === 'edge') &&
      ((fallback === 'dev' && tag === null && isRef(branch)) ||
        (fallback === null && isRef(tag) && branch === null)),
  };
  if (
    !Object.hasOwn(valid, mode) ||
    !valid[mode]() ||
    (mode !== 'branch' && !hasTarget(target, 'commit', installedCommit))
  )
    throw new Error('publication-policy-invalid');
  if (expectedSetupId !== undefined && setupId !== expectedSetupId)
    throw new Error('publication-setup-id-mismatch');
  return receipt;
}

async function readBranch(read, branch) {
  const result = await read(`/branches/${encodeURIComponent(branch)}`);
  if (result?.name !== branch || !isCommit(result.commit?.sha))
    throw new Error('publication-branch-unverified');
  return result.commit;
}

export async function readRecordedPublication(read, { allowMissing = false } = {}) {
  const repo = await read('');
  const defaultBranch = repo?.default_branch;
  if (repo?.full_name !== repository || !isRef(defaultBranch))
    throw new Error('publication-repository-unverified');
  const head = await readBranch(read, defaultBranch);
  const receiptAt = head.sha;
  const treeSha = head.commit?.tree?.sha;
  if (!isCommit(treeSha)) throw new Error('publication-tree-unverified');
  const tree = await read(`/git/trees/${treeSha}`);
  if (tree?.sha !== treeSha || tree.truncated !== false || !Array.isArray(tree.tree))
    throw new Error('publication-tree-unverified');
  const entries = tree.tree.filter((entry) => entry.path === receiptPath);
  if (allowMissing && entries.length === 0)
    return { defaultBranch, receiptAt, blobSha: null, receipt: null };
  if (entries.length === 0) throw new Error('publication-receipt-missing');
  const [entry] = entries;
  if (
    entries.length !== 1 ||
    entry.type !== 'blob' ||
    entry.mode !== '100644' ||
    !isCommit(entry.sha) ||
    !Number.isInteger(entry.size) ||
    entry.size < 1 ||
    entry.size > 4096
  )
    throw new Error('publication-receipt-file-invalid');
  const blob = await read(`/git/blobs/${entry.sha}`);
  if (blob?.sha !== entry.sha || blob.encoding !== 'base64' || typeof blob.content !== 'string')
    throw new Error('publication-blob-unverified');
  const bytes = Buffer.from(blob.content, 'base64');
  if (bytes.length !== entry.size) throw new Error('publication-blob-unverified');
  return {
    defaultBranch,
    receiptAt,
    blobSha: blob.sha,
    receipt: parseReceipt(bytes.toString('utf8')),
  };
}

export function parseReceipt(text, expectedSetupId) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('publication-receipt-json-invalid');
  }
  return validateReceipt(value, expectedSetupId);
}

export async function resolveSyncSource(read) {
  const { defaultBranch, receiptAt, receipt } = await readRecordedPublication(read);
  const { target } = receipt;
  let sourceCommit = target.commit;
  if (target.branch) {
    sourceCommit =
      target.branch === defaultBranch ? receiptAt : (await readBranch(read, target.branch)).sha;
  } else {
    const commit = await read(`/git/commits/${sourceCommit}`);
    if (commit?.sha !== sourceCommit) throw new Error('publication-target-unverified');
  }
  return { receiptAt, receipt, sourceCommit };
}

export function validateSyncSource(selection) {
  validateReceipt(selection?.receipt);
  if (
    !isCommit(selection.receiptAt) ||
    !isCommit(selection.sourceCommit) ||
    (selection.receipt.target.commit && selection.receipt.target.commit !== selection.sourceCommit)
  )
    throw new Error('sync-source-selection-invalid');
  return selection;
}

export async function preparePublication(read, receipt) {
  validateReceipt(receipt);
  const current = await readRecordedPublication(read, { allowMissing: true });
  if (current.receipt?.setupId === receipt.setupId) {
    if (!isDeepStrictEqual(current.receipt, receipt))
      throw new Error('publication-setup-id-conflict');
    return { status: 'already-recorded', receipt, receiptAt: current.receiptAt };
  }
  const contents = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`).toString('base64');
  return {
    status: 'prepared',
    receipt,
    defaultBranch: current.defaultBranch,
    previousSetupId: current.receipt?.setupId ?? null,
    commitInput: {
      branch: { repositoryNameWithOwner: repository, branchName: current.defaultBranch },
      expectedHeadOid: current.receiptAt,
      message: { headline: 'record tanaabot publication' },
      fileChanges: { additions: [{ path: receiptPath, contents }] },
    },
  };
}
