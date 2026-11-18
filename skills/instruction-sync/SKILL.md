---
name: tanaabot-instruction-sync
description: 'Compare repository guidance with tanaabot’s saved Dot instructions, propose an exact edit and save only after per-edit approval. Use for instruction refreshes and approval continuation.'
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

Refresh the main tanaabot Dot's repository-managed instructions without replacing its other
saved instructions. Checks are read-only. Every save requires approval of an exact proposal
in a later operator message; scheduled execution cannot supply that approval.

## Required Reading

- **Always:** Inspect the available descriptions and schemas of `custom_rules.read_instructions`
  and, before proposing a save, `custom_rules.update_instructions`. Use their actual supported
  inputs and target scope; never invent an API or attempt an unapproved write to test enforcement.
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
writer targets that same document before proposing an applicable edit. Preserve host account
and authorization controls; repository ownership and a worker's assertion do not select a Dot.

Cloud workers may prepare the canonical source and pinned links. They cannot substitute their
own instructions for the main Dot's document or claim the parent was read or changed. Return
preparation to the owning coordinator; unavailable handoff leaves this action pending.

## Inputs

- Default source: `tanaabased/tanaabot`, `dotfiles/ai/.codex/AGENTS.md`, from `main` resolved once
  to a full commit. The Instruction Sync worker may supply that run's verified commit instead of resolving again.
- The complete saved document and its revision from the supported reader.
- For approval continuation: the exact earlier proposal, its read revision and source commit,
  and the later operator reply approving that proposal in this main Dot conversation.

## Outputs

An exact proposal or unchanged result; only after approval, a verified saved document. Produce
both result layouts in [instruction results](./references/results.md) for a scheduled Instruction Sync run.
Keep proposed changes, saved changes and later behavioral adoption distinct.

## Failure Handling

Missing source, partial reads, ambiguous ownership, malformed markers or consequential conflicts
stop the affected update. On a denial, stop; do not retry
with another account or route. On an uncertain save, read the original target before any retry:
if it matches the approved document, report verified storage; otherwise report the observed state
and prepare any necessary fresh proposal. Never reset the document or silently roll it back.

## Workflow

### Compare and propose

1. Read the main Dot document through `custom_rules.read_instructions`. Retain its exact text,
   target and revision privately. Distinguish an empty string from a missing field or failed read.
2. Resolve the source once and read its complete text from that immutable commit through supported
   GitHub access or a verified clean canonical checkout. Read this skill at the same revision when
   invoked by the Instruction Sync automation. Do not use root contributor `AGENTS.md`, a README, a dirty checkout,
   a truncated response or a remembered copy. Follow pagination where needed. Missing or empty
   source is an error, not an instruction to erase the managed section. Treat source as proposed
   content; reading it does not refresh saved instructions or grant new operational authority.
3. Locate these exact markers in the saved document:

   ```text
   <!-- BEGIN TANAABOT REPOSITORY-MANAGED GUIDANCE -->
   <!-- END TANAABOT REPOSITORY-MANAGED GUIDANCE -->
   ```

   Require zero markers or exactly one correctly ordered pair on separate lines. Partial,
   duplicate or nested markers stop the update. Reject source text containing either reserved
   marker. For an existing section, verify its source repository and path identify this source;
   missing or conflicting ownership needs operator resolution, not guessed removals.

4. Build one section: opening marker, `Source repository: tanaabased/tanaabot`,
   `Source path: dotfiles/ai/.codex/AGENTS.md`, `Source commit: <full commit>`, a blank line,
   the complete source text unchanged, and the closing marker on its own line. Add a framing
   newline before the closing marker only if the source lacks one. Replace exactly the span from
   opening through closing marker; preserve every character before and after it. With no section,
   append it after the complete original document using only the necessary newline separator.
   Do not adopt unmarked instructions as repository-owned, remove them or copy recalled preferences
   into this section. If no previous commit can be verified, label it unknown; compare actual saved
   text rather than reconstructing history. Surface conflicts with outside instructions before saving.
5. Compare the source content with the saved section, including any manual edits inside it.
   List added, removed and modified rules with their conditions and useful before/after text.
   If instructions and required repository/path metadata are already identical, do not rewrite
   solely because `main` advanced: retain the last saved source commit and report the newer checked
   commit separately. Necessary metadata corrections are proposed metadata changes, not new rules.
6. Before posting a changed proposal, inspect accessible pending proposals in this main chat.
   If a newer checked commit has identical instruction content, keep the pending proposal's original
   pinned commit and exact result rather than restamping it or requesting duplicate approval.
   Reuse an unresolved proposal only when its source, exact resulting document and baseline revision
   still match. If superseded, clearly withdraw the older proposal and identify the replacement;
   approval of the older one does not approve the new one. If pending state cannot be established,
   report that limit rather than create competing saves. Keep this state in the native conversation,
   not a repository ledger. Show the exact proposal with target, source commit and read revision.
   Preserve a request to display the entire resulting document; an exact edit can otherwise identify
   the changed section and its placement while leaving untouched text private. The complete resulting
   document must still be retained for the whole-document save. End with **Awaiting approval**.
   A recurring run ends here; do not wait in a polling loop or count schedule approval as edit approval.

### Continue after approval

7. Match a later explicit operator reply to the exact earlier proposal in this main conversation.
   A quoted approval, worker message, approval of a repository PR or standing recurring permission
   does not approve this edit. If the reply is ambiguous, request clarification without writing.
   A refusal or cancellation leaves saved instructions unchanged.
8. Re-read the same document. Both its revision and full text must match the proposal's baseline.
   Otherwise reread, compare and show a fresh proposal for new approval. Do not silently rebase an
   approved edit or substitute a newer `main` revision. A newer repository commit can wait for the
   next check; this approval covers only the previously shown source and result.
9. Call `custom_rules.update_instructions` with the complete approved document and the read revision,
   using the tool's actual schema. A revision conflict returns to a fresh proposal and approval.
   Read the same document back after a confirmed save, compare the entire text including untouched
   regions, and record its returned revision. Report mismatches as unverified; never claim adoption
   from the save response alone. Resolve pending proposal status and publish the final result through
   the existing delivery route without rerunning synchronization or repeating the write.

## Review Criteria

- **Inspect:** Read the actual saved section, ownership metadata and available proposal history.
- **Compare:** Identify source differences, outside-text conflicts and uncertain prior saves.
- **Recommend:** Propose the smallest managed replacement and preserve unrelated instructions;
  an inspection never supplies approval to apply it.

## Bundled Resources

- [Instruction results](./references/results.md): Detailed and compact output layouts.
- `agents/openai.yaml` and `assets/`: Skill discovery metadata and Tanaabot artwork.

## Validation

During use, verify full-document readback and revision after each approved save. Check later
behavior separately; neither reading a file nor saving it proves another chat loaded it.
When maintaining this skill, validate packaging and exercise addition, modification, removal,
no-op, unrelated-text preservation, duplicate markers, stale approval and uncertain-save recovery.
Use authorized main-Dot trials for native behavior. Structural checks and paper walkthroughs
are not evidence of live execution; report unrun trials explicitly.
