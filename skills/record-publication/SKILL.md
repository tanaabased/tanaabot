---
name: tanaabot-record-publication
description: Record a Tanaabot Cloud setup on the operator’s explicit request in the publisher chat after Publish or Republish.
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

Record the setup receipt from the Cloud environment builder chat where the operator publishes. That
receipt supplies the source policy for Automation Sync and Instruction Sync.

## Required Reading

- **Always:** Read the [account and authority guidance](../../dotfiles/ai/.codex/AGENTS.md#accounts-and-authority)
  and [GitHub routing](../../instructions/github.md).
- **Before reporting:** Read [Tanaabot Voice](../voice/SKILL.md) and its required samples.

## When to Use

- The operator requests `Record Publication` in the publisher chat after Publish or Republish.
  An explicit Setup ID is optional.
- The operator checks the outcome of an already attempted receipt write.

## When Not to Use

- During installation, ordinary startup, scheduled work, or from any other chat or worker.
- To publish an environment, update a schedule, or grant repository access.

## Prerequisites

Identify the publisher chat through the host's environment builder context and this chat’s
own successful setup output for the selected configuration. Take the expected Setup ID from
that install. A copied transcript, chat title or local receipt alone cannot establish the
request’s origin. Stop if the origin is unavailable, a later setup failed, or the operator
reports publication failed or was cancelled. Verify the selected GitHub account and route
for each action. Keep the existing authorized writer and keep write credentials out of workers.

## Inputs

- The Setup ID displayed by the latest successful install in this publisher chat. If the
  operator supplied an ID, it must match.
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

1. Verify the publisher chat and its direct operator request as described above.
   Through the task's usual launcher, run
   `bun --no-env-file scripts/publication-task.js prepare <setup-id>` from the prepared checkout
   using the verified read account. The read-only result contains the validated local receipt,
   the current default branch and an exact conditional commit request, or `already-recorded`.
   For `already-recorded`, report “This setup is already recorded” and end the operation.
2. For a new receipt, compare this setup's pre-publication observation in the publisher chat
   with a fresh `cloud_environment_environment_status` read. Stop if the Setup ID or
   `source_config_id` identifies a different setup or configuration. When current observations
   show the same configuration and a changed `source_config_version_id`, read
   `cloud_environment_onboarding_read_environment_config_draft`. If its `base_version_id`
   matches the new version, proceed on the operator's request.

   If the version is unchanged or the comparison is inconclusive (including a missing baseline,
   stale or unavailable observation, or unconfirmed draft base), ask “Did Publish or Republish
   finish for setup `<setup-id>`?” using the verified ID. Wait for a direct yes in this chat
   before handing off that setup. If another install has occurred, the confirmation no longer
   applies. A no or uncertain answer leaves GitHub untouched. Version
   changes are supporting evidence only. Keep these observations in the chat.

3. Hand the exact prepared result to the explicitly authorized repository writer through the
   existing private workflow. Show the setup ID, source selector, installed SHA and branch or
   commit target. The writer verifies the direct operator request originated in the publisher
   chat through trusted context or a publisher-only write route. If it cannot verify that
   origin, stop before writing. The writer verifies its selected account, target and authorization,
   retaining the prepared branch head. This handoff does not authorize a different actor or
   an unrelated write.
4. If normal repository policy allows a direct commit, use GitHub's
   [`createCommitOnBranch`](https://docs.github.com/en/graphql/reference/commits#createcommitonbranch)
   with the returned `commitInput` unchanged, including `expectedHeadOid`. Only submit the
   receipt file. If repository policy requires a PR, use the normal authorized PR route from
   the prepared head. Preserve the one-file diff, recheck the publisher request and original receipt
   before merge, and report pending until the default branch has the verified receipt. Never
   change a branch rule or bypass review.
5. Independently read the receipt on the current default branch. With the verified read
   connection, `bun --no-env-file scripts/publication-task.js recorded` reports the branch SHA
   and complete receipt. Verify it matches the prepared receipt. Use the GitHub write result for
   the receipt commit, or link the immutable readback when the receipt commit is unknown.
   Report the installed SHA separately. Leave Cloud publication and schedule activation
   to their existing controls.

## Bundled Resources

- [Publication helper](../../scripts/publication-task.js) for receipt validation and read-only preparation.

## Validation

In an operator-led Cloud check, record from the publisher chat and verify the full receipt on
GitHub. Repeat the request for the same setup and verify a no-op. Check that a fresh task or
worker with a copy of the same receipt cannot initiate recording. A new install of the same
commit has its own Setup ID. Verify mismatched IDs and branch-head conflicts stop the write.
