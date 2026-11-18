# Native task inputs and application

The assembler is read-only. Native tools resolve environments, create or continue Cloud chats,
organize the sidebar, and save schedules. These normalized objects are not a native API schema.
Use complete current native listings, including paused schedules; follow pagination before
concluding anything is absent. Do not manufacture empty inventories to force creation.

## Resolve workers

Run `bun skills/automation-sync/scripts/sync-task.js` with JSON on stdin:

```json
{
  "mode": "targets",
  "id": "all",
  "context": {
    "timezone": "America/New_York",
    "environments": [{ "id": "verified-published-config-id", "name": "tanaabot" }],
    "destination": { "kind": "dot", "id": "verified-main-chat-id" }
  }
}
```

`environments` contains only published runnable configurations from native controls. Names select
exactly one entry; a missing or ambiguous match stops assembly. Never substitute a local computer.
Optional `workspaceDir` selects the clean source checkout when invoked elsewhere.

Tanaabot's shared policy defaults to Cloud `tanaabot` and reusable workers. Chat titles use
`thread.name`, then `display-name`, then the automation ID with spaces, without an added emoji.
Per-job `overrides.codex.environment` and `thread` use the Agent System schema.
Schedule and card names use `display-name`, then `thread.name`,
then the automation ID with spaces. A named `thread` alone is sufficient for a shared title.
Only Cloud selectors are implemented by this integration;
`native`, `dot`, `auto`, named computers and independent workers stop with an unsupported-setting
diagnostic. Agent System's own omitted defaults remain unchanged.

The returned targets describe desired environment and chat settings. Find an existing binding in
the matching schedule's metadata (`worker.id`), or use an explicitly authored native thread ID.
Inspect the exact worker in native active or archived history, following pagination as needed.
An ID lookup or successful send does not establish active status. Supply `status: "active"` only
for a confirmed active worker. Missing, inaccessible, ambiguous or offline results are unknown,
not archive evidence. Unknown and archived workers cannot be assembled as ready bindings.
For initial seeding, inspect existing native chats before creating one; names alone do not establish
automation ownership. If a prior create was uncertain, reconcile it before another create.

For every new worker, including initial seeding and archive recovery, first run targets assembly
and use its resolved `target`. Pass `model: target.model` and `thinking: target.effort` explicitly
to native chat creation, along with `target.execution.environmentId` and an
initialization-only prompt that requests the [initialization card](#initialization-card).
Do not omit these controls for the first turn, inherit native defaults, use the retired worker's
stale settings or silently fall back to another model. Unsupported settings stop creation.
Wait for initialization to finish and record its result as `startup: "passed"`, `"failed"` or
`"unverified"`; failed or incomplete startup blocks binding. Reuse an already initialized, active
and healthy replacement rather than creating another chat to pick up source changes.
Apply authorized title changes to an existing worker without replacing its ID. Verify its Cloud configuration from native
association or the original launch receipt, not a name or repository claim. A missing existing worker
or a known native configuration mismatch stops the affected action; do not create a replacement automatically.
Use the saved binding and successful native launch. `environmentId` below is the published
configuration ID from those controls, never a machine ID reported inside the container.
Do not require the worker to independently reproduce the configuration ID.

Worker model selection uses `overrides.codex.model`, then top-level `model`, then the configured
`default` profile. Effort independently uses `overrides.codex.effort`, then top-level `effort`, then
the selected profile's effort or the effort configured for that model, then `high`. If the same
literal model has conflicting configured efforts, select a named profile or supply explicit effort.
Missing profiles and unsupported settings stop preparation. Native controls validate availability;
never silently substitute another model or effort. Apply the generated settings on every worker
continuation, including existing chats after a source change. The coordinator's schedule settings
remain separate. Saved requests and chat defaults do not prove which settings a turn executed with;
use native turn evidence when available and report unavailable execution evidence explicitly.

Keep a native-provided private chat link when available. Otherwise omit input `url`; the assembler
generates `codex://threads/<worker-id>` from the verified active worker ID. Do not have the model
invent links. After saving, confirm the schedule's worker ID matches before presenting its link.
Only link the final active worker. Backend lookup or send eligibility does not prove client navigation.
Test tap-through on iOS and desktop during the pilot; if a client cannot open the link, try its native
task card. If neither works, state that navigation is unavailable rather than silently dropping it.
Native worker IDs and optional links live in the saved schedule prompt and current native
responses, not a separate database.

### Replace a confirmed archived worker

During synchronization only, treat a managed worker confirmed archived by native history as retired.
Leave its archived chat and history intact. Reconcile any prior replacement attempt through its native
creation result and chat history before creating another worker; include the automation ID and retired
worker ID in a replacement's initialization prompt so that recovery can identify it without guessing
from its title. Reuse a verified active replacement if creation succeeded but schedule saving did not.

Run creation and rebinding serially through the owning coordinator. Check for an in-flight sync or
unresolved creation before creating; do not start a competing replacement. If exclusive application
cannot be established with the available native controls, leave replacement pending for a serialized
operator run. The assembler does not provide a lock or guarantee exactly-once native creation.

Use the creation and initialization procedure in Resolve workers above for one replacement in
the same published Cloud configuration. Verify initialization and active status.
Supply `startup: "passed"` and the ordinary worker fields plus
`replaces: { "id": "retired-worker-id", "status": "archived", "environmentId": "verified-config-id" }`.
These are current native observations, not an authorization flag or a persisted replacement ledger.
The retired ID must match the schedule's saved binding. Explicit authored thread targets remain
binding; change that source through operator authorization before replacing an explicitly pinned chat.

Rebind the same native schedule ID using the returned `expectedCurrent` and exact compiled task.
Preserve destination, coordinator settings, cadence and enabled state; the assembler rejects a
replacement that also changes them.
Resolve such source/state differences separately before replacement. Before saving, reconcile the
current native record and use conditional update controls where supported. If another run already
rebound it, reuse that verified binding and recompute; never overwrite it with a competing replacement.
For uncertain saves, read the same schedule before retrying. After a successful rebind, ordinary
sync uses the new saved worker ID and needs no `replaces` evidence. Initialization emits `CHAT CREATED`
in the new worker; deliver the schedule's separate `UPDATED` card during final reporting.
No schedule is deleted.

### Recover the synchronizer before dispatch

The owning dot handles Sync's archived binding for a manual `sync`-only update, a scheduled
occurrence or Run now. For an occurrence, retain its original selection before recovery
(normally `all`, or `sync` for a bootstrap-only occurrence).

1. Read the current native Sync schedule and confirm its exact bound worker is archived in native
   history. Follow [the replacement procedure](#replace-a-confirmed-archived-worker) to reconcile
   prior attempts and check for in-flight recovery. Reuse a healthy replacement when available.
   If another run already saved the rebind, verify the saved dispatcher and binding, then finish
   according to the entry point below. Unknown status or a failed send does not qualify for replacement.
2. On the owning dot's own cloud computer, prepare a clean checkout pinned to one canonical
   `tanaabased/tanaabot` GitHub `main` commit. Read that revision's skill and required references.
   Run `bun install --frozen-lockfile --ignore-scripts` and `bun run automations:prepare` there.
   Run the read-only assembler with `mode: "targets"` and `id: "sync"` using the verified
   published configuration listing, native scheduler timezone and saved dot destination.
   Check that the resolved environment ID matches the retired worker's published `tanaabot`
   configuration. This preflight requires no running instance of that configuration. If it fails,
   report the preflight error and stop before requesting a model. Do not launch a helper chat or
   guess first-turn settings.
3. If a replacement is needed, create one in that published configuration using the resolved
   `model: target.model` and `thinking: target.effort` on its first turn. Request initialization
   only, following [Resolve workers](#resolve-workers). A rejected combination stops recovery.
   Report the requested model and effort separately from native turn observations. Mark missing
   observations unverified. Before binding, verify passed startup, active status and the published
   configuration through native launch or association evidence. Check the published setup/version
   when available and report unavailable version evidence as unverified. Leave the old chat archived.
4. From the same clean checkout, run `mode: "sync"` with `id: "sync"`, current native tasks and
   the verified replacement and `replaces` evidence. Follow the shared rebind procedure to apply
   the exact prepared update to the existing schedule. Verify its saved dispatcher and worker ID,
   preserving schedule ID, cadence, enabled state, coordinator settings and destination. Reconcile
   an uncertain save before continuing and retain the healthy worker on retry. Desktop sidebar
   placement is best-effort after verification and never gates recovery.

The entry point determines what happens after verification.

- **Manual `sync`-only update.** After verifying the saved Sync configuration, report it and stop.
  Do not dispatch the worker request, queue Run now or touch other automations.
- **Scheduled occurrence or Run now.** Resume that same occurrence once with the newly saved worker
  request and its model and effort. Pass the original selection as separate coordinator context
  alongside the unchanged request. A new `dispatchVersion` does not widen a bootstrap-only run.
  Carry the verified rebind into final placement and reporting even if the resumed pass finds
  Sync unchanged. Do not send the old payload, repeat the save or queue another occurrence.

For rollout, manually load this skill from canonical `main` in the main Tanaabot dot and update
only `sync`. Verify the replacement binding and saved dispatcher before separately selecting
Run now for a full sync.

### Initialization card

In the creation prompt, identify the worker's automation and supply its emoji from
`prompts/requests.json` and its resolved chat title. Instruct the worker to complete
required Cloud startup checks, then finish initialization with one small quoted card in its own
chat. Do not run the automation, change schedules or send a separate main-chat summary.

Use an H2 with the emoji, uppercase resolved chat title and `· CHAT CREATED`. Keep a blank quoted line
after the heading and before the contextual status. For successful initialization:

> ## 🧪 SMOKE TEST CANARY · CHAT CREATED
>
> Reusable worker initialized. Awaiting schedule configuration.
>
> ✅ Worker ready. No automation has run.

If startup leaves an unresolved check, replace the body with the specific limitation and use
`⚠️ Worker setup needs attention. No automation has run.` For a confirmed startup failure, use
`❌ Worker setup failed. No automation has run.` Never infer readiness from chat creation alone.

This card records new chat initialization, not a saved schedule. Reusing a worker does not emit
another `CHAT CREATED` card. During final reporting, deliver the saved schedule's separate
[configuration card](./configuration-receipts.md) to the same worker.

## Assemble schedules

Repeat with `mode: "sync"` (also the default), adding `existingTasks` and `context.workers`:

```json
{
  "mode": "sync",
  "id": "sync",
  "context": {
    "timezone": "America/New_York",
    "environments": [{ "id": "verified-published-config-id", "name": "tanaabot" }],
    "destination": { "kind": "dot", "id": "verified-main-chat-id" },
    "workers": [
      {
        "automationId": "sync",
        "id": "verified-worker-id",
        "status": "active",
        "startup": "passed",
        "environmentId": "verified-published-config-id",
        "name": "AUTOMATION SYNC",
        "url": "codex://threads/verified-worker-id"
      }
    ]
  },
  "existingTasks": []
}
```

Copy saved native settings into `existingTasks` records with `id` and `task`:

| `task` field      | Value                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `name`            | Native schedule name: 🤖 plus the uppercase resolved schedule title                        |
| `enabled`         | Actual active/paused state as a boolean                                                    |
| `schedule`        | Object containing the exact native `schedule`, `default_timezone` and `timing_mode` fields |
| `execution`       | `{ "kind": "inherited" }`: the hosted coordinator's execution context                      |
| `destination`     | Owning main chat, `{ "kind": "dot", "id": "native-id" }`                                   |
| `model`, `effort` | Coordinator's native overrides, or `null` for native defaults                              |
| `prompt`          | Exact compiled coordinator prompt, including its worker request                            |

The worker uses the published Cloud environment and receives its own metadata, all shared worker
guidance and the authored automation prompt. Its opening is rendered from the shared
`prompts/request-partial.md` template, the resolved schedule title, and its emoji
and short request in `prompts/requests.json`. Each selected automation needs an entry.
Saved schedule ownership remains metadata-first, with only the supported optional canary preceding it.
The client owns preview length and collapse behavior; the template does not create an accordion.
The coordinator continues that worker, waits for its
result and returns the compact linked summary through normal main-chat delivery. Scheduling a
coordinator does not itself bind a Cloud environment. Prompt guidance directs the supported native
delegation established by the pilot; it does not create missing tools or native settings.

For unrelated tasks, only `id`, `task.name` and `task.prompt` are needed. Read remaining fields for
marker-matched tasks. Do not invent unavailable native values. The ownership marker identifies
repository, agent and automation; an unmarked name collision or multiple matching markers stops
the action. `operations` returns `create`, `update`, `unchanged` or `skipped`, with the existing `nativeId` and
`expectedCurrent` for updates. If another writer changed that record, recompute before application.

The assembler translates Agent System schedules into native VEVENT fields. Recurring intervals
must be at least one hour and use whole minutes; cron must also leave at least an hour between
runs. Daily, weekly, monthly and seasonal selections are supported when their day constraints
can be represented exactly. A restricted day-of-month OR weekday combination is rejected.
Native acceptance and execution still require the Cloud pilot; local compilation is not proof of either.

Use `schedule: {at: "<ISO timestamp with offset>"}` for a one-time run, with whole-second precision.
Relative `in` schedules and recurrence bounds are not supported yet. Choose a future timestamp
when preparing the pilot. Elapsed one-time definitions are skipped without creating workers,
changing saved tasks or claiming execution. To run again, explicitly author a new future time.
The assembler preserves saved recurrence anchors across syncs and prompt edits. Copy native
schedule fields directly; do not reconstruct them from a description or convert them back to cron.

Apply exact compiled prompts and settings through the owning dot's native schedule controls.
Apply returned operations in order: the synchronizer comes first when selected. For a sync-only
bootstrap use `id: "sync"` in both targets and sync requests, resolving only its worker. Verify
its saved prompt before a distinct Run now; an update cannot replace the already-running dispatcher.
Newly compiled metadata carries `dispatchVersion: 2` to distinguish that next invocation.
Never use the contributor's local scheduler as a substitute or write scheduler files. Supply the
native scheduler's IANA timezone as `context.timezone` in both modes. Omitted source timezones use
the saved task's timezone, or this native default for a new task. Do not substitute the Cloud
worker's timezone. Copy `task.schedule.schedule`, `task.schedule.default_timezone` and
`task.schedule.timing_mode` into the corresponding native call fields. Inspect
the displayed next run during seeding to confirm local midnight. The later smoke schedule is not
a completion dependency. Source `enabled: false` means paused, regardless of other defaults.

For a new disabled definition, prefer native paused creation. If creation always starts active,
create once and immediately pause the returned native ID before applying the next task. This
create-then-pause sequence is part of authorized seeding; it does not authorize a manual run.
Verify the final paused state. If the pause fails, report that the schedule remains active when
known, or that its state is unverified, and retain its ID for recovery. Do not recreate it or
claim paused success. If creation is uncertain, recover the existing ID before pausing; never
repeat an uncertain create. Existing tasks are updated directly to the declared enabled state.

All consumed partials participate in comparison, including coordinator dispatch. A changed partial
updates every affected task. Generated timestamps and source revision alone do not force updates;
unchanged schedules retain their exact prompts, timestamps and native IDs. Successful native
responses establish saved settings when returned; read back only missing values, uncertain effects
and explicit pilot checks. Never repeat a denied or uncertain create.

An authored task prompt may start with one optional diagnostic line matching
`TANAABOT-SYNC-CANARY: UPPERCASE-TOKEN`. The assembler copies it to the literal first line of the
saved coordinator prompt, immediately before the ownership metadata. Tokens contain uppercase
letters/digits separated by single hyphens. Metadata-first prompts remain supported. The line
participates in content comparison through the authored prompt; it does not replace ownership
matching, change the stable automation ID or reset timestamps on unchanged reruns. Do not prepend
arbitrary text or edit the live prompt to add it.

If the Cloud worker cannot save schedules, it returns prepared actions to the coordinator for
application through this same workflow. Report the handoff as pending until application succeeds.
Unsupported unattended application requires the README's manual seed; never claim it was saved.

## Final sidebar placement

The applying coordinator runs this pass once after schedule reconciliation and saved-binding
verification, before configuration receipts and run results. Include healthy reused workers for
unchanged schedules as well as newly bound workers; exclude skipped or unverified bindings.
After self-recovery, the resumed sync uses this same final pass. Group-only changes never require
worker recreation or a schedule update.

If this optional pass itself fails, report placement as unverified and retain the sync results.

1. Use an authorized connected Mac with native Codex sidebar controls. For a Cloud or scheduled
   coordinator, request the whole placement pass in one handoff to that Mac: list sections,
   create missing configured groups, move the selected workers and verify membership. If the Mac
   or handoff is unavailable, record that reason and finish the sync report. Do not invent a remote
   endpoint, start a helper chat without authorization, or substitute Cloud sidebar controls.
2. On that Mac, obtain the native chat and sidebar listing. Resolve exact bound chat IDs, following
   pagination when needed. Retain each chat's reported `hostId`; a Cloud chat may be `durable`
   while its sidebar item key says `local`. Never derive routing from that key or match by title.
3. Run the existing `sync-task.js` with `mode: "placement"`, the invocation's selected `id`, and
   `context.workers` containing only healthy saved bindings verified during this run, including
   unchanged schedules. Omit skipped or unverified bindings. This pass does not revalidate schedules
   or worker readiness. Include the desktop listing as `context.sidebar` (its `threads`, `pinnedThreads`, and
   `sections`). If desktop access is unavailable, omit `sidebar` and supply the specific reason as
   `context.sidebarUnavailable`. Use the same clean source snapshot as schedule reconciliation.
   This read-only pass loads the public Agent System manifest and resolves only its effective job
   `group`, including YAML-merged defaults from the declarations. No configured
   group means no placement request. There is no hard-coded section fallback or second parser.
4. On that same Mac, use the complete section listing. Match the manifest’s uppercase group
   name exactly and case-sensitively. For each name in `sectionsToCreate`, use
   `create_sidebar_section` with that exact name once. Read back the sidebar and rerun the
   planner before moving workers. If creation was uncertain, reconcile from the listing.
   If the group is still absent or multiple IDs have the exact name, report affected placements
   as unverified. Do not retry a denial, create a second section or rename a case variant.
5. For each `move` result, use native `move_thread_to_sidebar_section` with its exact arguments.
   Skip verified placements and unrelated chats. Before retrying an uncertain earlier move,
   inspect its current membership.
6. Read back the sidebar after moves and run the same placement planner against that listing to
   check membership. A successful move response alone is insufficient. Make at most one move
   attempt per worker in this pass; a remaining `move` result means placement was not verified,
   not an instruction to loop. Record a failed move or unavailable readback with its specific
   reason. Continue other in-scope placements and retain all successful schedule results.

Report which workers could not be placed or verified and why, separately from synchronization.
Do not roll back bindings, recreate workers, or alter schedules for a sidebar failure. A later
sync can repair placement even when every schedule is unchanged. An interactive desktop success
proves only that path; verify an actual scheduled wake reaching the authorized Mac before claiming
unattended placement works. Native execution remains outside the read-only planner.
