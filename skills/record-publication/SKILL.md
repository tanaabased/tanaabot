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
- **Before reporting:** Read [Tanaabot Voice](../voice/SKILL.md), its required samples and the
  [shared chat card guidance](../../prompts/presentation-partial.md).

## When to Use

- The operator requests `Record Publication <setup-id>` in the publisher chat after Publish or
  Republish. The short form `Record Publication` uses the Setup ID from that chat’s latest successful install.
- The operator checks the outcome of an already attempted receipt write.

## When Not to Use

- During installation, ordinary startup, scheduled work, or from any other chat or worker.
- To publish an environment, update a schedule, or grant repository access.

## Prerequisites

Identify the publisher chat through the host's environment builder context and this chat’s
own successful setup output for the selected configuration. Take the expected Setup ID from
that install. A copied transcript, chat title or local receipt alone cannot establish the
request’s origin. Stop if the origin is unavailable, a later setup failed, or the operator
reports publication failed or was cancelled. Use the Builder's ambient GitHub CLI credential
throughout this request.

## Inputs

- The Setup ID displayed by the latest successful install in this publisher chat. If the
  operator supplied an ID, it must match.
- The validated local receipt and the canonical repository's current default branch and head.

## Outputs

The only file recorded on the canonical default branch is `tanaabot-publication.json`.
Finish in the publisher chat with one quoted result card. For a verified receipt, use this layout:

> ## 📌 RECORD PUBLICATION · RECORDED
>
> - **Setup ID** `<setup-id>`
> - **Installed commit** `<installed-sha>`
> - **Sync target** <policy from the receipt>
> - **Receipt** <link to the receipt commit or verified file>
>
> ✅ The saved receipt matches this setup.

Link to the returned `receiptCommit` when available. Otherwise link to `tanaabot-publication.json`
at the verified `receiptAt` revision. For `already-recorded`, use the same fields with the heading
`📌 RECORD PUBLICATION · ALREADY RECORDED` and the footer “✅ This setup is already recorded.”

For an uncertain write, use `## ⚠️ RECORD PUBLICATION · UNVERIFIED`. Identify the setup, what
could not be verified and how to check the saved receipt before another attempt. For a confirmed
failure, use `## ❌ RECORD PUBLICATION · FAILED`. Identify the affected setup when known, give
the actual reason and the next action. The confirmation question in step 2 is an ordinary prompt.

## Failure Handling

An absent, invalid or mismatched local receipt, uncertain authorization or changed branch head
stops the write. Reconcile an uncertain response by reading the default branch receipt through
the original route. If the exact candidate is present, report verified success. Otherwise
report the conflict or uncertainty. Never rebase or retry an old proposal onto a new head.

## Workflow

1. Verify the publisher chat and its direct operator request as described above.
   Through the task's usual launcher, run
   `bun --no-env-file scripts/publication-task.js prepare <setup-id>` from the prepared checkout
   in the publisher chat. The read-only result contains the validated local receipt,
   the current default branch and an exact conditional commit request, or `already-recorded`.
   For `already-recorded`, show the already-recorded card and end the operation.
2. For a new receipt, compare this setup's pre-publication observation in the publisher chat
   with a fresh `cloud_environment_environment_status` read. Stop if the Setup ID or
   `source_config_id` identifies a different setup or configuration. When current observations
   show the same configuration and a changed `source_config_version_id`, read
   `cloud_environment_onboarding_read_environment_config_draft`. If its `base_version_id`
   matches the new version, proceed on the operator's request.

   If the version is unchanged or the comparison is inconclusive (including a missing baseline,
   stale or unavailable observation, or unconfirmed draft base), ask “Did Publish or Republish
   finish for setup `<setup-id>`?” using the verified ID. Wait for a direct yes in this chat
   before recording that setup. If another install has occurred, the confirmation no longer
   applies. A no or uncertain answer leaves GitHub untouched. Version
   changes are supporting evidence only. Keep these observations in the chat.

3. In the same Builder, run `bun --no-env-file scripts/publication-task.js record <setup-id> <prepared-head>`
   with the setup ID and `commitInput.expectedHeadOid` from preparation. The helper submits the
   one-file commit directly through `gh api` and verifies the saved receipt on readback.
   Submit without querying branch protection or collaborator permissions. If GitHub rejects
   the commit, report its reason and stop. On success, show the installed SHA separately from
   the receipt commit, or link the verified readback when the commit response was lost.

## Bundled Resources

- [Publication helper](../../scripts/publication-task.js) for preparation, submission and readback.

## Validation

In an operator-led Cloud check, record from the publisher chat and verify the full receipt on
GitHub. Repeat the request for the same setup and verify a no-op. Check that a fresh task or
worker with a copy of the same receipt cannot initiate recording. A new install of the same
commit has its own Setup ID. Verify mismatched IDs and branch-head conflicts stop the write.
