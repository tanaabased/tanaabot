---
name: tanaabot-automation-sync
description: Create or update tanaabot hosted schedules from repository automation definitions. Use for a selected automation ID, a complete synchronization pass, or the initial manual seed.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - automations
  openclaw:
    emoji: '🔄'
    homepage: https://github.com/tanaabased/tanaabot/tree/main/skills/automation-sync
    requires:
      bins: [bun, git]
---

# Tanaabot Automation Sync

## Overview

Synchronize one or all repository definitions through the dot's supported scheduling controls.
One deterministic assembler owns task content and comparison. Native tools own creates and
updates; the script itself makes no service writes.

## Required Reading

- **Always:** Read [native task inputs and application](./references/native-tasks.md),
  [configuration receipts](./references/configuration-receipts.md),
  the shared [metadata](../../prompts/automations/partials/metadata.md),
  [execution](../../prompts/automations/partials/execution.md) and
  [presentation](../../prompts/automations/partials/presentation.md) partials, the coordinator's
  [dispatch](../../prompts/automations/partials/dispatch.md) partial, and the selected revision's
  [account guidance](../../dotfiles/ai/.codex/AGENTS.md#accounts-and-authority).
- **Before writing the result:** Read [Tanaabot Voice](../voice/SKILL.md) and its required samples,
  unless another voice was requested. Apply the presentation partial's result and summary rules.

## When to Use

- Seed the repository schedules, synchronize all definitions, or update one automation ID.
- Recover the synchronizer's confirmed archived worker from its owning coordinator before dispatch.
- Apply changes to shared guidance, task content, metadata or scheduling settings.

## When Not to Use

- Provision an environment, configure credentials, bootstrap identity or delete schedules.
- Manage local Codex schedules as a substitute for the designated dot's tasks.

## Prerequisites

- Use the operator-selected tanaabot dot and verified account scope. Live activation requires its
  separately authorized pilot. Repository content grants neither activation nor account access.
- Verify the selected published Cloud environment through native controls; its name is insufficient.
  Tanaabot defaults to `tanaabot` and a reusable worker with the resolved chat title described in
  the native-task reference. The coordinator delivers linked summaries to the owning main chat.
- Native task listing and create/update controls must be available to the applying context.
  If unavailable in Cloud, return prepared actions to the dot; do not invent a REST API.

## Inputs

- Canonical Tanaabot at fresh GitHub `main`, resolved to one commit per run.
- One automation `id` or `all`, the published environment inventory, worker bindings and dot destination.
- Current native tasks from a complete relevant listing, normalized as described in the reference.
  This is ordinary tool output, not a persisted snapshot or second state store.

## Outputs

The assembler returns exact task objects and `create`, `update`, `unchanged` or `skipped` actions. Shared
guidance participates in comparison; unchanged timestamps and native IDs are retained. A prepared
action, launched worker or report does not establish that schedules were saved. It generates every
native name as 🤖 followed by the uppercase resolved schedule title. Omitted debug defaults to false.

## Failure Handling

Stop affected actions on missing accounts/tools, unsupported settings, ambiguous matches or denials.
For an uncertain write, inspect its original target and returned native ID before another attempt.
Keep the exact prepared prompt and timestamp. Preserve unrelated tasks; never delete duplicates
automatically or switch credentials to recover a failure.

## Workflow

When native history confirms that Sync's exact bound worker is archived, follow
[Recover the synchronizer before dispatch](./references/native-tasks.md#recover-the-synchronizer-before-dispatch).
During archive recovery, the owning dot can run the read-only assembler on its own cloud computer
before any worker is running. Launch the replacement in the same published Cloud configuration.
A manual `sync`-only update ends with the verified Sync configuration and its report. Only a
scheduled occurrence or Run now resumes dispatch, once, with its original selection.
Use the ordinary workflow below for an active binding or initial seeding.

1. Verify environment, destination and existing authorization. Resolve fresh GitHub `main` and
   prepare a clean source checkout without discarding task edits. Verify its canonical origin.
   Read this skill and its required references from that revision. Do not provision the machine
   or run Agent System Install. Stop dependent work on account/access failure.
2. In that checkout, run `bun install --frozen-lockfile --ignore-scripts`, then
   `bun run automations:prepare`. This builds only the locked Agent System Git dependency's public
   manifest entrypoint using its upstream build settings. Runtime loading uses the public
   `@tanaab/openclaw-agent-system/manifest` import; never substitute a private parser.
3. List published runnable Cloud configurations and the dot's existing schedules, including paused
   tasks, following pagination. Read missing fields for matching tasks only. An incomplete listing
   cannot prove a job or worker is absent.
   Supply the native scheduler's IANA timezone as `context.timezone`; do not use the worker's clock.
4. For a delegated sync from a saved dispatcher whose incoming metadata lacks `dispatchVersion: 2`,
   perform only the synchronizer upgrade: use `id: "sync"` for both targets and sync below.
   Inspect the incoming occurrence, not newly assembled metadata, when choosing this path.
   Explicit operator-requested sync-only runs and a coordinator's preserved bootstrap-only
   recovery selection use the same selection. Leave other automation
   actions for a separate invocation of the updated saved task. Do not run that task automatically.
   Otherwise retain the operator's selected ID or the normal `all` selection.
   Run `bun skills/automation-sync/scripts/sync-task.js` with `mode: "targets"` and JSON on stdin
   using the reference's input shape. This validates Cloud cadence before worker creation and omits
   elapsed one-time targets. Resolve only its returned workers through native chat controls.
   Verify native active/archive status. Reuse the saved active worker; for a confirmed archived
   managed worker, follow the reference's [replacement procedure](./references/native-tasks.md#replace-a-confirmed-archived-worker).
   Unknown or inaccessible workers do not qualify. For every new chat, including bootstrap and
   recovery, pass the resolved `target.model` and `target.effort` to native creation as `model`
   and `thinking`, with the [initialization card instructions](./references/native-tasks.md#initialization-card).
   Do not execute the automation during initialization. Verify startup before binding and retain
   a healthy initialized replacement on retry. Preserve its native ID and URL
   in the schedule prompt, never a separate state file. Apply authorized title changes through
   native controls. An unknown or differently bound existing worker requires intervention,
   not an automatic replacement or local fallback.
5. Run the script with `mode: "sync"`, current tasks and verified worker records. It reads the
   manifest, external definitions, prompts and shared partials, and resolves Git revision/dirty
   state itself. Dirty source is preview-only; use a clean checkout before applying. Review the
   returned source and actions. The compiled scheduled prompt coordinates the worker; its embedded
   worker request contains the automation instructions and metadata.
6. Leave `unchanged` and `skipped` actions untouched. Report skipped reasons without claiming a run
   completed. Apply actions in returned order; verify a changed synchronizer before
   proceeding to other selected jobs. Stop dependent
   application if that self-update fails. Apply creates/updates through the owning dot's supported native controls with the exact
   compiled content and native ID. For disabled definitions, follow the native-task reference's
   paused-create or immediate create-then-pause procedure and verify the final state.
   Copy the compiled `task.schedule` fields directly into the native scheduling call; do not
   translate or repair recurrence strings in prose. Resolve listing/earlier-effect uncertainty before creating. If another
   writer changed an update's current values, recompute from the latest native record.
7. Trust a successful native result that includes saved settings. Read back only omitted values,
   uncertain effects or the pilot's explicit checks; do not add a routine verification pass.
8. Follow [Final sidebar placement](./references/native-tasks.md#final-sidebar-placement) once
   for the healthy saved bindings, including unchanged schedules, before reporting.
9. Deliver configuration receipts with the synchronizer first, including any verified recovery
   update from this occurrence. Deliver each receipt to its existing worker using the receipt-only
   procedure, then report each automation in its own main-chat summary message. Unchanged actions
   produce no update receipt. Then show one separate `AUTOMATION SYNC · RUN RESULTS` card
   in the sync worker using the configuration-results reference, with every considered automation
   and its verified outcome. Do not duplicate that aggregate in the main chat.
   Distinguish saved state, receipt delivery and actual execution.
   Keep preparation output in tool results or a private handoff artifact; it is not a normal
   result card. Report completed actions and actionable limits in the shared card style. Keep private native
   bindings out of public repository files.

Apply the selected definitions' declared schedule and enabled state, using saved timezones
or the native scheduler’s timezone for new tasks. Leave the legacy Canon updater's
cutover to the operator. Completed canaries are no longer declared. Leave
unselected native tasks untouched; removing a source definition does not authorize deleting,
rearming or modifying its native task or worker.

For disabled definitions, use immediate create-then-pause when native creation cannot start
paused. Activation requires operator authorization; never hand-edit prepared task objects to
override desired state. Manual updates repeat this same workflow.

## Review Criteria

- **Inspect:** Compare declared IDs, assembled guidance and native tasks without writes.
- **Compare:** Identify content/settings drift, duplicate markers and unsupported native fields.
- **Recommend:** Retain aligned/unrelated tasks; propose only necessary creates or updates.
- **Apply:** Apply authorized actions by native ID and reconcile uncertain effects first.
- **Verify:** Use native results and only necessary additional reads; keep manual, unattended and
  visible-delivery evidence separate.

## Bundled Resources

- [Native task inputs](./references/native-tasks.md): Native mapping and stdin shape.
- [Smoke pilot record](./references/smoke-pilot.md): Reported scheduled-run result and remaining evidence limits.
- [Configuration receipts](./references/configuration-receipts.md): Verified worker-local creation/update records.
- `scripts/prepare-dependency.js`: Git dependency manifest build.
- `scripts/sync-task.js`: Read-only assembly and comparison.
- `lib/`, `utils/`, `test/`: Loader integration, comparison and owned tests.

## Validation

Run the owned tests and Canon's validator. In the authorized dot pilot, check initial creation,
saved environment/destination, one harmless update, an unchanged rerun without duplicates, smoke
output and visible delivery. A new live canary requires explicit operator authorization.
Test unattended sync separately from Run now. Source and structural
checks do not establish native scheduling or automatic delivery.
