# Resolve the synchronization source

Use this procedure for Automation Sync and Instruction Sync before loading their source inputs.
Use the recorded receipt on canonical `tanaabased/tanaabot` when present. Before the first
publication is recorded, both jobs can use the default branch as a bootstrap fallback.
A worker's local receipt describes its own install.

1. In a checkout with this procedure and Bun, run `bun --no-env-file scripts/publication-task.js resolve`
   with the verified GitHub CLI account. This read-only command returns `receiptAt`, `receipt`, and
   `sourceCommit`, plus `bootstrapBranch` when the receipt is confirmed absent. Use the
   complete result as `sourceSelection`. In the main Dot without a checkout, follow the
   GitHub read procedure below.
2. Retain this selection in the native run or private handoff. Resolve it once for a new run.
   On retry or recovery of the same occurrence, retrieve the exact selection from that run,
   including a selection made by the coordinator before recovering an archived worker. If the
   original selection is unavailable after it was made, report that the run cannot resume.
   A worker receives the recovery selection through the verified coordinator handoff. Reuse it
   without resolving the branch again. Treat unauthenticated or contradictory handoff data as
   a failure. Use the selected full SHA for the workflow's guidance, definitions, metadata,
   inventory and assets, including when following repository links.
3. Report the source used from `sourceCommit` and, with a receipt, the installed commit from
   `receipt.installedCommit`. With `bootstrapBranch`, report the first-publication fallback
   and branch in the run result and compact summary, including for unchanged outcomes.
   Treat the installed commit as unrecorded. An invalid receipt, failed or incomplete read,
   or unavailable commit blocks synchronization. Preserve existing save and activation approvals.

## Repository reads without a checkout

1. Read the canonical GitHub repository's default branch and resolve its head to one full SHA.
   At that exact commit, inspect the complete root tree. Use that head SHA as `receiptAt`.
   Reject failed, incomplete, redirected to a different repository or ref, or contradictory
   results. Only if this read confirms `tanaabot-publication.json` is absent, set
   `receipt: null`, `bootstrapBranch` to the observed default branch, and `sourceCommit`
   to `receiptAt`. Keep that selection for the whole run. A file lookup that returns 404
   does not establish absence.
2. If the path exists, read the regular file from its blob and verify the receipt against the
   [version 1 checks](../lib/publication.js). The repository is
   `tanaabased/tanaabot`, `setupId` identifies the prepared setup, and `installedCommit` is a
   full commit SHA. The single `target` must be `{ "branch": "<name>" }` for branch mode and
   match the recorded branch, or `{ "commit": "<sha>" }` for commit, tag, and channel modes and
   match `installedCommit`. The recorded selector, branch, tag, and fallback must agree with the
   mode. `dev` uses the recorded branch. A release channel that fell back to `dev` still targets
   its exact commit. If the tool cannot establish those facts, stop.
3. For a branch target, resolve that exact canonical branch once. If it is the observed default
   branch, use `receiptAt`. For an exact target, verify that full commit is available from the
   canonical repository. Set `sourceCommit` to the resulting full SHA and retain `receiptAt` and
   the complete validated receipt with it. A failed lookup cannot substitute another ref.
