---
name: tanaabot-record-publication
description: Record the verified setup of a newly published Tanaabot Cloud environment. Use only when the operator explicitly requests Record Publication with the expected setup ID.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - publication
  openclaw:
    emoji: '📌'
    homepage: https://github.com/tanaabased/tanaabot/tree/main/skills/record-publication
    requires:
      bins: [bun, gh]
---

# Tanaabot Record Publication

## Overview

Record the receipt from a fresh task in the intended published Tanaabot environment. That
receipt supplies the source policy for Automation Sync and Instruction Sync.

## Required Reading

- **Always:** Read the [account and authority guidance](../../dotfiles/ai/.codex/AGENTS.md#accounts-and-authority)
  and [GitHub routing](../../instructions/github.md).
- **Before reporting:** Read [Tanaabot Voice](../voice/SKILL.md) and its required samples.

## When to Use

- The operator explicitly requests `Record Publication <setup-id>` after Publish or Republish.
- The operator checks the outcome of an already attempted receipt write.

## When Not to Use

- During installation, startup, scheduled work, draft setup, or in a reusable sync worker.
- To publish an environment, update a schedule, or grant repository access.

## Prerequisites

Use the fresh task's native launch or association evidence to verify the intended published
configuration and successful launch from it. A machine ID, chat title, repository mount or
setup ID alone cannot establish that association. A draft, failed publish, existing worker
or unavailable evidence stops recording. Verify the selected GitHub account and route for
each action. Use a read connection in the Cloud task and the operator-authorized GitHub
write path for the repository commit. Keep write credentials out of sync workers.

## Inputs

- The expected setup ID displayed at the end of the install you published.
- The validated local receipt and the canonical repository's current default branch and head.

## Outputs

The full receipt as the only changed file, `tanaabot-publication.json`, on the canonical
default branch. Show the setup ID, installed SHA, sync target and independently verified
receipt commit or readback link. Repeating an already recorded setup is a no-op.

## Failure Handling

An absent, invalid or mismatched local receipt, uncertain authorization or changed branch head
stops the write. Reconcile an uncertain response by reading the default branch receipt through
the original route. If the exact candidate is present, report verified success. Otherwise
report the conflict or uncertainty. Never rebase or retry an old proposal onto a new head.

## Workflow

1. Verify the fresh native launch, published configuration and current operator request.
   Through the task's usual launcher, run
   `bun --no-env-file scripts/publication-task.js prepare <setup-id>` from the prepared checkout
   using the verified read account. The read-only result contains the validated local receipt,
   the current default branch and an exact conditional commit request, or `already-recorded`.
   For `already-recorded`, show that verified result and end the operation.
2. Hand the exact prepared result to the explicitly authorized repository writer through the
   existing private workflow. Show the setup ID, source selector, installed SHA and branch or
   commit target. The writer verifies its selected account, target and operator authorization,
   retaining the prepared branch head. This handoff does not authorize a different actor or
   an unrelated write.
3. If normal repository policy allows a direct commit, use GitHub's
   [`createCommitOnBranch`](https://docs.github.com/en/graphql/reference/commits#createcommitonbranch)
   with the returned `commitInput` unchanged, including `expectedHeadOid`. Only submit the
   receipt file. If repository policy requires a PR, use the normal authorized PR route from
   the prepared head. Preserve the one-file diff, recheck the publication and original receipt
   before merge, and report pending until the default branch has the verified receipt. Never
   change a branch rule or bypass review.
4. Independently read the receipt on the current default branch. With the verified read
   connection, `bun --no-env-file scripts/publication-task.js recorded` reports the branch SHA
   and complete receipt. Verify it matches the prepared receipt. Use the GitHub write result for
   the receipt commit, or link the immutable readback when the receipt commit is unknown.
   Report the installed SHA separately. Leave Cloud publication and schedule activation
   to their existing controls.

## Bundled Resources

- [Publication helper](../../scripts/publication-task.js) for receipt validation and read-only preparation.

## Validation

Verify the current publication and exact setup ID before preparing a write and read the full
receipt back after recording it. In the operator-led Cloud check, confirm that two successful
publications yield distinct IDs, a fresh task sees its own receipt, and the old task cannot
record the new ID. Verify same-receipt retries and branch-head conflicts without repeated writes.
