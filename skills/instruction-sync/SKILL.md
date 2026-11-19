---
name: tanaabot-instruction-sync
description: 'Propose a full replacement of tanaabot’s saved Dot instructions from the repository. Use for instruction refreshes and exact-proposal approval.'
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - instructions
  openclaw:
    emoji: '🔄'
    homepage: 'https://github.com/tanaabased/tanaabot/tree/main/skills/instruction-sync'
---

# Tanaabot Instruction Sync

## Overview

Rebuild the main tanaabot Dot's complete editable saved instructions from one repository commit.
Checks are read-only. The first replacement requires a private migration review. Every save
requires approval of the exact document in a later operator message.

## Required Reading

- **Always:** Inspect the available descriptions and schemas of `custom_rules.read_instructions`
  and, before proposing a save, `custom_rules.update_instructions`. Use their actual supported
  inputs and target scope; never invent an API or attempt an unapproved write to test enforcement.
- **Before comparing or assembling instructions:** Read [instruction sources](./references/source.md)
  and the [shared sync source procedure](../../prompts/sync-source.md).
- **Before reporting:** Read [instruction results](./references/results.md), the shared
  [presentation rules](../../prompts/presentation-partial.md), and
  [Tanaabot Voice](../voice/SKILL.md), including its required samples.

Resolve repository resources from the same selected revision. Use supported repository reads
when the main Dot lacks a local checkout; a Cloud filesystem path is not a main-Dot path.

## When to Use

- The operator requests an instruction refresh, comparison or continuation of an exact approval.
- The separately authorized Instruction Sync automation requests its read-only comparison and proposal.

## When Not to Use

- Merely discovering or reading this skill, or reporting instructions without a refresh request.
- Changing conversational memories, platform instructions, ChatGPT-wide settings or another Dot.
- Provisioning Cloud, loading worker instructions or changing schedules.

Use [Instruction Report](../instruction-report/SKILL.md) for the separate read-only inventory.

## Prerequisites

The operator-selected main tanaabot Dot must have a supported reader targeting its own saved
instruction document. A missing reader is unavailable access, not an empty document. Confirm the
writer can condition the save on the expected revision of that same document before proposing
an applicable edit. Preserve host account and authorization controls; repository ownership
and a worker's assertion do not select a Dot.

Cloud workers verify the source and return the pinned inventory. Only the owning Dot reads or
updates its editable document. An unavailable or incomplete handoff leaves synchronization pending.

## Inputs

- The fixed [source set](./references/source.md#resolve-the-desired-source) at the canonical commit
  selected by the shared sync source procedure. Scheduled runs use the worker's verified source
  selection and complete ordered inventory.
  A scheduled prompt still requesting a marked-section sync or lacking that handoff must stop
  and report that the Instruction Sync schedule needs synchronization.
- The complete saved document and its revision from the supported reader.
- For approval continuation: the exact earlier proposal, its read revision and source commit,
  and the later operator reply approving that proposal in this main Dot conversation.

## Outputs

A private first-replacement review when needed, then an exact full-document proposal or an
unchanged result. Report a verified save only after readback. Use both
[result layouts](./references/results.md) for scheduled runs.

## Failure Handling

An incomplete source read, unknown saved-document state or unresolved migration decision blocks
the proposal. On a denial, stop on the selected account and route. On an uncertain save, read
the original target. Report verified storage if it matches the approved document. Otherwise
report the observed state and prepare any necessary fresh proposal. Avoid an automatic retry
or rollback.

## Workflow

### Compare and propose

1. Read the main Dot document through `custom_rules.read_instructions`. Retain its exact text,
   target and revision privately. Distinguish an empty string from a missing field or failed read.
2. Read the complete [source set](./references/source.md#resolve-the-desired-source). On a
   manual check, resolve the shared policy once via GitHub. On a scheduled run, use the worker's
   verified source selection and read every listed file at that commit. Report the recorded
   installed commit separately from the sync source, or explicitly report the first-publication
   fallback. Retain the selection for retries.
   Stop if the handoff does not establish complete enumeration and reads, or if any content
   the Dot needs is unavailable. Every file in the replacement comes from this one commit.
3. Compare against the actual saved text using [saved provenance](./references/source.md#saved-provenance).
   Recognize the old marked section for attribution only. Before the first full replacement,
   privately review the complete editable document with the operator. Identify what is already
   represented in the source, what might belong in the repository, and exactly what else would
   be removed. Label unattributed text **Source unknown** and keep it in this conversation.
   Wait for the operator's disposition of the existing text against this saved revision; if the
   document changes, review the new baseline before proposing. An empty document has nothing to
   migrate. Migrate only explicitly approved, repository-appropriate rules through the normal
   repository workflow, then start a new check once the recorded policy selects a commit that
   contains them. Keep protected platform
   instructions, credentials, private bindings, personal information and conversational
   preferences out of the repository and the Cloud handoff. Approval of the migration review
   does not approve a save.
4. Build the whole replacement in the [saved format](./references/source.md#saved-provenance).
   Include exactly the selected source text and its provenance framing. Never append to
   the existing document or carry forward text from it. Compare actual saved text to the
   replacement, including manual edits and unmarked text. Group additions, changes and
   removals by source path, showing unattributed removals privately under **Source unknown**.
   If the verified saved format, ordered paths and exact text already match apart from the
   commit stamp, keep the saved commit and report the checked commit separately as a no-op.
   Describe any other provenance changes separately from rule changes.
5. Before posting a changed proposal, inspect accessible pending proposals in this main chat.
   If a newer checked commit has identical instruction content, keep the pending proposal's original
   pinned commit and exact result rather than restamping it or requesting duplicate approval.
   Reuse an unresolved proposal only when its source, exact resulting document and baseline revision
   still match. If superseded, clearly withdraw the older proposal and identify the replacement;
   approval of the older one does not approve the new one. If pending state cannot be established,
   report that limit rather than create competing saves. Keep this state in the native conversation,
   not a repository ledger. Show the target, pinned source inventory, read revision, removal
   details and exact full replacement privately in the main Dot. Present the replacement as
   literal text with an enclosing fence long enough to preserve its contents. If the full
   proposal cannot be shown, stop before approval. End with **Awaiting approval**. A recurring
   run ends at review, proposal, no-op or failure. A schedule or worker cannot approve a save.

### Continue after approval

6. Match a later explicit operator reply to the exact earlier proposal in this main conversation.
   A quoted approval, worker message, approval of a repository PR or standing recurring permission
   does not approve this edit. If the reply is ambiguous, request clarification without writing.
   A refusal or cancellation leaves saved instructions unchanged.
7. Re-read the same document. Both its revision and full text must match the proposal's baseline.
   Otherwise reread, compare and show a fresh proposal for new approval. Do not silently rebase an
   approved edit or substitute a newer source revision. A newer repository commit can wait for the
   next check; this approval covers only the previously shown source and result.
8. Call `custom_rules.update_instructions` with the complete approved document and the expected revision,
   using the tool's actual schema. A revision conflict returns to a fresh proposal and approval.
   Read the same document back after a confirmed save, compare the entire text with the approved
   replacement, and record its returned revision. Report mismatches as unverified; never claim adoption
   from the save response alone. Resolve pending proposal status and publish the final result through
   the existing delivery route without rerunning synchronization or repeating the write.

## Review Criteria

- **Inspect:** Read the complete editable document, source inventory and available proposal history.
- **Compare:** Identify drift, intentional removals, unattributed text and uncertain prior saves.
- **Recommend:** Show the exact replacement and any pending migration decision for operator review.

## Bundled Resources

- [Instruction results](./references/results.md): Detailed and compact output layouts.
- [Instruction sources](./references/source.md): Pinned source inventory and saved provenance.
- `agents/openai.yaml` and `assets/`: Skill discovery metadata and Tanaabot artwork.

## Validation

In the authorized main-Dot pilot, review the legacy text, then verify that the exact approved
addition, modification and deletion appear in the complete readback. Confirm that identical
source is a no-op and an incomplete listing or file read cannot propose a removal. Check both
sync layouts and the read-only report against what was actually delivered. Check later behavior
in a separate request and record its evidence apart from saved text and visible delivery.
When maintaining the skill, validate its package and scheduled prompt assembly.
