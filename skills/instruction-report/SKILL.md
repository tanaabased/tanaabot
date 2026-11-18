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
- **Before writing the report:** Read [Tanaabot Voice](../voice/SKILL.md) and its required samples.

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
Do not delegate the inventory and pretend a worker can inspect the parent's instruction context.
A missing tool limits coverage; it does not prevent an honest partial report.

## Inputs

The explicit report request, accessible instruction context, the saved-document reader when
available, and relevant operator messages or recorded preferences accessible through supported reads.

## Outputs

Return the report privately in the requesting conversation. No instructions, memories, settings or
schedules change. Do not publish its private contents to GitHub or send it to another conversation.

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
3. Inspect accessible relevant operator messages and recorded preferences read-only. Preserve scope
   and conditions, distinguish direct messages from summaries and identify superseded directions.
   Include only operating preferences relevant to this assistant. Exclude credentials, unrelated
   personal information, protected platform text and other assistants' directions.
4. For repository guidance, report the managed source metadata actually retrieved, or its absence.
   Distinguish supplied instruction context, an earlier explicit file read, saved document text and
   behavioral evidence. Inspect additional repository guidance only when requested or already
   available; label newly inspected text **Source inspected now; prior adoption unverified**.
   Never fetch latest merely to fill a baseline or treat a source read as a refresh.
5. Report conflicts and coverage gaps without resolving them by mutation. A saved instruction can
   be retrieved without proving that every conversation follows it. Recalled preferences may be
   useful but are not a verified persistence record. If asked whether updates are possible, describe
   only observed controls and their per-edit approval requirement; do not invoke the writer.

Use this layout, replacing placeholders with observed facts:

> ## 📋 TANAABOT · INSTRUCTION REPORT
>
> **Coverage:** <Sources inspected; saved document present / empty / unavailable / not inspected.>
>
> **Saved document:** <Target scope and returned revision, or the precise access limit.>
>
> **Repository guidance:** <Retrieved path/revision and what is known about loading.>
>
> **Changes:** None.
>
> | Instruction        | Scope or conditions | Source                                                                        | Evidence                                                  |
> | ------------------ | ------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
> | <Actual direction> | <When it applies>   | <Direct user message / saved document / preference summary / repository file> | <Retrieved / available in context / recalled or inferred> |
>
> **Conflicts and limits:** <Superseded or conflicting directions and unexamined sources.>
>
> **Access and persistence:** <What could be read; what remains unknown about storage or adoption.>

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
Native Dot and Cloud behavior require separate authorized trials; package validation does not prove
instruction completeness, automatic loading or later compliance.
