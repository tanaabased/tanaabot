# Resolve the synchronization source

Use this procedure for Automation Sync and Instruction Sync before loading their source inputs.
The setup receipt on canonical `tanaabased/tanaabot` defines which revision to read. A worker's
local receipt describes its own install. It cannot select source for a sync run.

1. In a checkout with this procedure and Bun, run `bun --no-env-file scripts/publication-task.js resolve`
   with the verified GitHub CLI account. This read-only command returns `receiptAt`, `receipt`, and
   `sourceCommit`. Use the complete result as `sourceSelection`. When using the main Dot and
   GitHub tools without a checkout, follow the repository read procedure below.
2. Retain this selection in the native run or private handoff. Resolve it once for a new run.
   On retry or recovery of the same occurrence, retrieve the exact selection from that run,
   including a selection made by the coordinator before recovering an archived worker. If the
   original selection is unavailable after it was made, report that the run cannot resume.
   A worker receives the recovery selection through the verified coordinator handoff. Reuse it
   without resolving the branch again. Treat unauthenticated or contradictory handoff data as
   a failure. Use the selected full SHA for the workflow's guidance, definitions, metadata,
   inventory and assets, including when following repository links.
3. Report the installed commit from `receipt.installedCommit` and the source actually used
   from `sourceCommit`. Report a missing, invalid or inaccessible receipt or commit as a blocker.
   Setup, publication recording, and existing save or activation approvals have their own controls.

## Repository reads without a checkout

1. Read the canonical GitHub repository's default branch and resolve its head to one full SHA.
   At that exact commit, inspect the complete root tree and read the regular file
   `tanaabot-publication.json` from its blob. Use that head SHA as `receiptAt`. Reject missing,
   incomplete, redirected to a different repository or ref, or contradictory results.
2. Verify the receipt against the [version 1 checks](../lib/publication.js). The repository is
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
