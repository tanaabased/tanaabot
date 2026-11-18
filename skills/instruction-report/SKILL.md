---
name: tanaabot-instruction-report
description: 'Report tanaabot’s accessible saved instructions and operator preferences without changing them. Use when the operator explicitly requests an instruction report.'
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - instructions
  openclaw:
    emoji: '📋'
    homepage: 'https://github.com/tanaabased/tanaabot/tree/main/skills/instruction-report'
---

# Tanaabot Instruction Report

## Overview

Report the operator instructions tanaabot can actually access, with their sources and limits.
This is a read-only inventory, not an instruction refresh or a complete internal audit.
Run only when the operator explicitly requests an instruction report; discovering this skill
or including it in a startup inventory does not invoke it.

## Required Reading

- **Before reading a saved document:** Inspect the available description and schema of
  `custom_rules.read_instructions` or an explicitly supported equivalent, including target scope.
- **Before attributing saved text:** Read [saved provenance](../instruction-sync/references/source.md#saved-provenance).
- **Before writing the report:** Read the shared [presentation rules](../../prompts/presentation-partial.md)
  and [Tanaabot Voice](../voice/SKILL.md) with its required samples.

Use already available resources or supported reads of the selected repository revision when
local files are unavailable. Do not assume the main Dot has a Cloud checkout.

## When to Use

The operator asks what instructions tanaabot is following, what is saved, or where those
instructions came from, without requesting an update.

## When Not to Use

Do not apply repository guidance, change memories or settings, activate schedules, inspect another
assistant without scope, or attempt to disclose protected platform instructions. For a requested
refresh, use [Instruction Sync](../instruction-sync/SKILL.md) separately.

## Prerequisites

Use the requesting Tanaabot conversation and supported read-only access within the operator's scope.
Keep all report work in that conversation. A missing reader limits coverage without blocking a
partial report.

## Inputs

The explicit report request, accessible instruction context, the saved-document reader when
available, and relevant operator messages or recorded preferences accessible through supported reads.

## Outputs

Return a compact overview and a detailed private inventory in the requesting conversation.

## Failure Handling

Distinguish **Empty** (successful read with a present empty instruction string), **Unavailable**
(no supported access or failed read), and **Not inspected**. State the affected source and useful
coverage limit. Never infer an empty document from a missing field, search result or absent tool.
Do not fabricate a complete inventory from memory or retry a denial through a different account.

## Workflow

1. Establish what is already present before fetching additional instruction sources. Do not count
   this report prompt or a one-off task request as a new standing preference. Identify the requesting
   assistant and conversation without inferring identity from repository names.
2. Discover the supported saved-document reader and establish its actual target before calling it.
   For the main Dot, read its saved document through `custom_rules.read_instructions` when available.
   Record returned status and revision, including an empty result. If running in Cloud with no
   reader, report that; do not substitute local `AGENTS.md` for the parent's saved document.
3. Inventory the actual saved text by source file using its own recorded import commit and path
   markers. Give each file's role, summarize its saved guidance and link verified sources at the
   immutable commit. Show any unmarked or unattributed legacy text under **Source unknown**.
   Report missing evidence explicitly and leave unverified links out. A source read verifies
   attribution only. Saved text, material explicitly loaded in this conversation and later
   observed behavior each require their own evidence.
4. List relevant conversation-derived preferences separately with their scope and evidence.
   Distinguish direct operator messages from summaries and flag conflicts or superseded rules.
   Exclude credentials, private bindings, personal information, protected platform text and
   other assistants' directions.
5. Show both cards privately as separate messages when supported. Use observed facts and a single
   contextual status line per card. Report conflicts and limits without changing the document.

> **📋 INSTRUCTION REPORT**
>
> <Saved document coverage, verified source count or limits, and any separately observed behavior.>
>
> <One contextual final status.>

> ## 📋 INSTRUCTION REPORT · DETAILS
>
> **Saved document** — <Target, read revision and saved import commit, or the observed access limit.>
>
> **<Source path>** — <File role, saved guidance and verified immutable source link. Repeat per file.>
>
> **Source unknown** — <Unattributed saved guidance, if present.>
>
> **Conversation preferences** — <Relevant directions and their evidence, when available.>
>
> **Observed behavior** — <What later behavior was observed, or the verification limit.>
>
> <One contextual final status.>

Keep the report useful rather than exhaustive. An empty saved document can coexist with real
conversation-derived preferences; say so. Do not claim that accessible operator directions are
all instructions governing the assistant.

## Bundled Resources

- `agents/openai.yaml` and `assets/`: Skill discovery metadata and Tanaabot artwork.
- [Instruction Sync](../instruction-sync/SKILL.md): Separately invoked proposal and approved-save flow.

## Validation

During use, tie each reported direction to its source and evidence level, state unread sources and
confirm no mutations occurred. When maintaining this skill, validate its package and test empty,
unavailable and populated-reader cases, direct versus summarized preferences, and source-only reads.
In an authorized main-Dot trial, verify both visible cards against the saved document and its
pinned sources. Check that unmarked text and conversation preferences retain their own attribution.
