# Resolve the synchronization source

The owning Dot uses this procedure for Automation Sync and Instruction Sync before dispatch
or worker recovery. It also applies when the Dot runs the workflow directly. Use
the verified account's GitHub reads. Source selection requires no Cloud worker or checkout.

Retain the complete `sourceSelection` in the native run or private tool-backed handoff. For a
retry or recovery of the same occurrence, retrieve and reuse it exactly. If it cannot be
recovered after selection, report that the occurrence cannot resume. If selection fails,
stop before dispatch and dependent work. Once selected, use
`sourceCommit` for every source read, including across handoffs. Keep the generated worker
prompt unchanged and pass the selection alongside it in the same continuation. On a direct
run, consume the selection in the Dot with no worker required for source preparation.

## GitHub reads

1. Read `https://api.github.com/repos/tanaabased/tanaabot`. Verify its `full_name` and read
   `default_branch`. Use the same API root for the remaining reads. Read
   `/branches/<URL-encoded default_branch>`, verify the exact returned branch name, and retain
   `commit.sha` as `receiptAt` and `commit.commit.tree.sha` as the root tree SHA. Require full
   40-character lowercase hexadecimal SHAs throughout.
2. Read `/git/trees/<root tree SHA>` without recursion. Verify the returned SHA, `truncated: false`,
   and complete root entries with valid single-component paths. Stop on access errors,
   incomplete or contradictory evidence, or a different repository or ref. Only if the
   complete tree confirms `tanaabot-publication.json` is absent, return
   `{ receiptAt, receipt: null, sourceCommit: receiptAt, bootstrapBranch }` with the observed
   default branch as `bootstrapBranch`. A file lookup returning 404 cannot establish absence.
3. For a present path, require one regular blob (Git mode `100644`, 1–4096 bytes). Read
   `/git/blobs/<blob SHA>`, verify its SHA and encoding, and decode the complete base64 blob.
   Verify its byte length and parse the JSON. Require exactly these version 1 fields:
   `version` (integer 1), `repository` (`tanaabased/tanaabot`), `setupId` (1–24 ASCII letters,
   digits, dots, underscores or hyphens, then a hyphen and eight lowercase hex digits),
   `selector`, `mode`, `installedCommit` (full SHA), `branch`, `tag`, `fallback`, and `target`.
   Absent branch, tag and fallback values are JSON null. Validate Git branch and tag names,
   and require the selector and target to agree with the recorded mode:

   - Branch: valid `branch`, with selector `dev` or that literal branch other than a reserved
     alias. Tag and fallback are null. Target is exactly `{ "branch": "<branch>" }`.
   - Commit: the selector is the installed SHA, allowing uppercase. Branch, tag and fallback
     are null. Target is exactly `{ "commit": "<installed SHA>" }`.
   - Tag: the selector is the valid recorded tag other than a reserved alias. Branch and
     fallback are null. Target is exactly `{ "commit": "<installed SHA>" }`.
   - Channel: selector `stable` or `edge`, with a valid tag and null branch and fallback, or
     with `fallback: "dev"`, a valid branch and a null tag. Both forms target exactly
     `{ "commit": "<installed SHA>" }`.

   The reserved aliases are `dev`, `stable` and `edge`. Stop on invalid or unverifiable receipt
   data, including a present path whose blob cannot be read.

4. For a branch target, read `/branches/<URL-encoded branch>` and verify its name and exact
   head once. Reuse `receiptAt` when it is the observed default branch. For an exact target,
   read `/git/commits/<SHA>` and verify that SHA. Retain
   `{ receiptAt, receipt, sourceCommit }` using the valid receipt and the selected SHA. A failed
   target lookup blocks synchronization.

Report `sourceCommit` and the installed commit from `receipt.installedCommit` separately.
With `bootstrapBranch`, report the first-publication fallback and branch even on unchanged
runs, and report the installed commit as unrecorded. Keep the existing save and activation approvals.
