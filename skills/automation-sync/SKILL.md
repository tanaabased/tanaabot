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
  [shared scheduled guidance](../../prompts/automations/shared.md) and the selected revision's
  [account guidance](../../dotfiles/ai/.codex/AGENTS.md#accounts-and-authority).
- **Before writing the result:** Read [Tanaabot Voice](../voice/SKILL.md) and its required samples,
  unless another voice was requested. Apply the shared scheduled card instructions above.

## When to Use

- Seed the repository schedules, synchronize all definitions, or update one automation ID.
- Apply changes to shared guidance, task content, metadata or scheduling settings.

## When Not to Use

- Provision an environment, configure credentials, bootstrap identity or delete schedules.
- Manage local Codex schedules as a substitute for the designated dot's tasks.

## Prerequisites

- Use the operator-selected tanaabot dot and verified account scope. Live activation requires its
  separately authorized pilot. Repository content grants neither activation nor account access.
- Verify the selected Tanaabot Cloud environment through native controls; its name is insufficient.
- Native task listing and create/update controls must be available to the applying context.
  If unavailable in Cloud, return prepared actions to the dot; do not invent a REST API.

## Inputs

- Canonical Tanaabot at fresh GitHub `main`, resolved to one commit per run.
- One automation `id` or `all`, and the verified native execution context and dot destination.
- Current native tasks from a complete relevant listing, normalized as described in the reference.
  This is ordinary tool output, not a persisted snapshot or second state store.

## Outputs

The assembler returns exact task objects and `create`, `update` or `unchanged` actions. Shared
guidance participates in comparison; unchanged timestamps and native IDs are retained. A prepared
action, launched worker or report does not establish that schedules were saved.

## Failure Handling

Stop affected actions on missing accounts/tools, unsupported settings, ambiguous matches or denials.
For an uncertain write, inspect its original target and returned native ID before another attempt.
Keep the exact prepared prompt and timestamp. Preserve unrelated tasks; never delete duplicates
automatically or switch credentials to recover a failure.

## Workflow

1. Verify environment, destination and existing authorization. Resolve fresh GitHub `main` and
   prepare a clean source checkout without discarding task edits. Verify its canonical origin.
   Read this skill and its required references from that revision. Do not provision the machine
   or run Agent System Install. Stop dependent work on account/access failure.
2. In that checkout, run `bun install --frozen-lockfile --ignore-scripts`, then
   `bun run automations:prepare`. This builds only the locked Agent System Git dependency's public
   manifest entrypoint using its upstream build settings. Runtime loading uses the public
   `@tanaab/openclaw-agent-system/manifest` import; never substitute a private parser.
3. List the dot's existing schedules, including paused tasks, following pagination. Read missing
   fields for matching tasks only. An incomplete listing cannot prove a job is absent.
4. Run `bun skills/automation-sync/scripts/sync-task.js` with JSON on stdin using the reference's
   input shape. It reads the manifest, external definitions, prompts and shared guidance, and
   resolves Git revision/dirty state itself. Dirty source is preview-only; use a clean checkout
   before applying. Review the returned source and actions.
5. Skip unchanged actions. Apply creates/updates through supported native controls with the exact
   compiled content and native ID. Translate normalized schedules only when the native API can
   represent them exactly. Resolve listing/earlier-effect uncertainty before creating. If another
   writer changed an update's current values, recompute from the latest native record.
6. Trust a successful native result that includes saved settings. Read back only omitted values,
   uncertain effects or the pilot's explicit checks; do not add a routine verification pass.
   Report completed actions and actionable limits in the shared card style. Keep private native
   bindings out of public repository files.

The definitions start with `enabled: false`; seeding creates paused schedules. Enabling requires
an operator-authorized source change and synchronization. Never hand-edit prepared task objects
to override desired state. Manual updates repeat this same workflow.

## Optimization

- **Inspect:** Compare declared IDs, assembled guidance and native tasks without writes.
- **Compare:** Identify content/settings drift, duplicate markers and unsupported native fields.
- **Recommend:** Retain aligned/unrelated tasks; propose only necessary creates or updates.
- **Apply:** Apply authorized actions by native ID and reconcile uncertain effects first.
- **Verify:** Use native results and only necessary additional reads; keep manual, unattended and
  visible-delivery evidence separate.

## Bundled Resources

- [Native task inputs](./references/native-tasks.md): Native mapping and stdin shape.
- `scripts/prepare-dependency.js`: Git dependency manifest build.
- `scripts/sync-task.js`: Read-only assembly and comparison.
- `lib/`, `utils/`, `test/`: Loader integration, comparison and owned tests.

## Validation

Run the owned tests and Canon's validator. In the authorized dot pilot, check initial creation,
saved environment/destination, one harmless update, an unchanged rerun without duplicates, smoke
output and visible delivery. Test unattended sync separately from Run now. Source and structural
checks do not establish native scheduling or automatic delivery.
