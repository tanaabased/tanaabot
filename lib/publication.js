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

export async function readRecordedPublication(read) {
  const repo = await read('');
  const defaultBranch = repo?.default_branch;
  if (repo?.full_name !== repository || !isRef(defaultBranch))
    throw new Error('publication-repository-unverified');
  const branch = await read(`/branches/${encodeURIComponent(defaultBranch)}`);
  const receiptAt = branch?.commit?.sha;
  if (branch?.name !== defaultBranch || !isCommit(receiptAt))
    throw new Error('publication-branch-unverified');
  const treeSha = branch.commit.commit?.tree?.sha;
  if (!isCommit(treeSha)) throw new Error('publication-tree-unverified');
  const tree = await read(`/git/trees/${treeSha}`);
  if (
    tree?.sha !== treeSha ||
    tree.truncated !== false ||
    !Array.isArray(tree.tree) ||
    tree.tree.some(
      (entry) => typeof entry?.path !== 'string' || !entry.path || entry.path.includes('/'),
    )
  )
    throw new Error('publication-tree-unverified');
  const entries = tree.tree.filter((entry) => entry.path === receiptPath);
  if (entries.length === 0) return { defaultBranch, receiptAt, receipt: null };
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

export function validateSyncSource(selection) {
  if (!isCommit(selection?.receiptAt) || !isCommit(selection.sourceCommit))
    throw new Error('sync-source-selection-invalid');

  if (selection.receipt === null) {
    if (!isRef(selection.bootstrapBranch) || selection.sourceCommit !== selection.receiptAt)
      throw new Error('sync-source-selection-invalid');
    return selection;
  }

  const { target } = validateReceipt(selection.receipt);
  if (
    Object.hasOwn(selection, 'bootstrapBranch') ||
    (target.commit && target.commit !== selection.sourceCommit)
  )
    throw new Error('sync-source-selection-invalid');
  return selection;
}

export async function preparePublication(read, receipt) {
  validateReceipt(receipt);
  const current = await readRecordedPublication(read);
  if (current.receipt?.setupId === receipt.setupId) {
    if (!isDeepStrictEqual(current.receipt, receipt))
      throw new Error('publication-setup-id-conflict');
    return { status: 'already-recorded', receipt, receiptAt: current.receiptAt };
  }
  const contents = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`).toString('base64');
  return {
    status: 'prepared',
    receipt,
    commitInput: {
      branch: { repositoryNameWithOwner: repository, branchName: current.defaultBranch },
      expectedHeadOid: current.receiptAt,
      message: { headline: 'record tanaabot publication' },
      fileChanges: { additions: [{ path: receiptPath, contents }] },
    },
  };
}

export async function recordPublication(read, write, receipt, preparedHead) {
  const plan = await preparePublication(read, receipt);
  if (plan.status === 'already-recorded') return plan;
  if (preparedHead !== undefined && plan.commitInput.expectedHeadOid !== preparedHead)
    throw new Error('publication-prepared-head-changed');

  let commit;
  let writeError;
  try {
    commit = await write(plan.commitInput);
  } catch (error) {
    // a lost response can follow an accepted commit. observe the receipt before reporting failure.
    writeError = error;
  }
  let current;
  try {
    current = await readRecordedPublication(read);
  } catch (error) {
    throw writeError ?? error;
  }
  if (
    current.defaultBranch !== plan.commitInput.branch.branchName ||
    !isDeepStrictEqual(current.receipt, receipt)
  )
    throw writeError ?? new Error('publication-write-unverified');
  return {
    status: 'recorded',
    receipt,
    receiptAt: current.receiptAt,
    ...(isCommit(commit) ? { receiptCommit: commit } : {}),
  };
}
