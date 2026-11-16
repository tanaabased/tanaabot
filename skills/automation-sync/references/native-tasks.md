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
    "environments": [{ "id": "verified-published-config-id", "name": "tanaabot" }],
    "destination": { "kind": "dot", "id": "verified-main-chat-id" }
  }
}
```

`environments` contains only published runnable configurations from native controls. Names select
exactly one entry; a missing or ambiguous match stops assembly. Never substitute a local computer.
Optional `workspaceDir` selects the clean source checkout when invoked elsewhere.

Tanaabot's shared policy defaults to Cloud `tanaabot`, reusable workers under `REPORTS`, and chat
titles equal to each authored display name without an emoji. Per-job `overrides.codex.environment`,
`thread` and `group` use the Agent System schema. To customize a group, also declare a persistent
`thread`, as required by that schema. Only Cloud selectors are implemented by this integration;
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

For a new worker, use the native Cloud-chat creation control with the selected published configuration
ID and an initialization-only prompt that requests the [initialization card](#initialization-card).
Wait for that initialization to finish. Use native sidebar
controls to find or create the desired section and place the chat there. Apply authorized title/group
changes to an existing worker without replacing its ID. Verify its Cloud configuration from native
association or the original launch receipt, not a name or repository claim. A missing existing worker
or a known native configuration mismatch stops the affected action; do not create a replacement automatically.
Use the saved binding and successful native launch. `environmentId` below is the published
configuration ID from those controls, never a machine ID reported inside the container.
Do not require the worker to independently reproduce the configuration ID.

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

Create one replacement using the same published Cloud configuration and desired sidebar placement.
Verify initialization, active status and placement, then supply its ordinary worker fields plus
`replaces: { "id": "retired-worker-id", "status": "archived", "environmentId": "verified-config-id" }`.
These are current native observations, not an authorization flag or a persisted replacement ledger.
The retired ID must match the schedule's saved binding. Explicit authored thread targets remain
binding; change that source through operator authorization before replacing an explicitly pinned chat.

Rebind the same native schedule ID using the returned `expectedCurrent` and exact compiled task.
Preserve cadence and enabled state; the assembler rejects a replacement that also changes either.
Resolve such source/state differences separately before replacement. Before saving, reconcile the
current native record and use conditional update controls where supported. If another run already
rebound it, reuse that verified binding and recompute; never overwrite it with a competing replacement.
For uncertain saves, read the same schedule before retrying. After a successful rebind, ordinary
sync uses the new saved worker ID and needs no `replaces` evidence. Initialization emits `CHAT CREATED`
in the new worker; deliver the schedule's separate `UPDATED` card there after verified saving.
No schedule is deleted.

### Initialization card

In the creation prompt, identify the worker's automation and supply its emoji from
`prompts/automations/requests.json` and its authored display name. Instruct the worker to complete
required Cloud startup checks, then finish initialization with one small quoted card in its own
chat. Do not run the automation, change schedules or send a separate main-chat summary.

Use an H2 with the emoji, uppercase display name and `· CHAT CREATED`. Keep a blank quoted line
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
another `CHAT CREATED` card. After a schedule is saved, deliver its separate
[configuration card](./configuration-receipts.md) to the same worker.

## Assemble schedules

Repeat with `mode: "sync"` (also the default), adding `existingTasks` and `context.workers`:

```json
{
  "mode": "sync",
  "id": "sync",
  "context": {
    "environments": [{ "id": "verified-published-config-id", "name": "tanaabot" }],
    "destination": { "kind": "dot", "id": "verified-main-chat-id" },
    "workers": [
      {
        "automationId": "sync",
        "id": "verified-worker-id",
        "status": "active",
        "environmentId": "verified-published-config-id",
        "name": "AUTOMATION SYNC",
        "group": "REPORTS",
        "url": "codex://threads/verified-worker-id"
      }
    ]
  },
  "existingTasks": []
}
```

Normalize saved native schedules into `existingTasks` records with `id` and `task`:

| `task` field      | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| `name`            | Native schedule name: 🤖 plus the uppercase display name              |
| `enabled`         | Actual active/paused state as a boolean                               |
| `schedule`        | Shared normalized native cadence and timezone                         |
| `execution`       | `{ "kind": "inherited" }`: the hosted coordinator's execution context |
| `destination`     | Owning main chat, `{ "kind": "dot", "id": "native-id" }`              |
| `model`, `effort` | Coordinator's native overrides, or `null` for native defaults         |
| `prompt`          | Exact compiled coordinator prompt, including its worker request       |

The worker uses the published Cloud environment and receives its own metadata, all shared worker
guidance and the authored automation prompt. Its opening is rendered from the shared
`prompts/automations/partials/request.md` template, the automation display name, and its emoji
and short request in `prompts/automations/requests.json`. Each selected automation needs an entry.
Saved schedule ownership remains metadata-first, with only the supported optional canary preceding it.
The client owns preview length and collapse behavior; the template does not create an accordion.
The coordinator continues that worker, waits for its
result and returns the compact linked summary through normal main-chat delivery. Scheduling a
coordinator does not itself bind a Cloud environment. Prompt guidance directs the supported native
delegation established by the pilot; it does not create missing tools or native settings.

For unrelated tasks, only `id`, `task.name` and `task.prompt` are needed. Read remaining fields for
marker-matched tasks. Do not invent unavailable native values. The ownership marker identifies
repository, agent and automation; an unmarked name collision or multiple matching markers stops
the action. `operations` returns `create`, `update` or `unchanged`, with the existing `nativeId` and
`expectedCurrent` for updates. If another writer changed that record, recompute before application.

Apply exact compiled prompts and settings through the owning dot's native schedule controls.
Apply returned operations in order: the synchronizer comes first when selected. For a sync-only
bootstrap use `id: "sync"` in both targets and sync requests, resolving only its worker. Verify
its saved prompt before a distinct Run now; an update cannot replace the already-running dispatcher.
Newly compiled metadata carries `dispatchVersion: 2` to distinguish that next invocation.
Never use the contributor's local scheduler as a substitute or write scheduler files. Preserve
local-time cron when `timezone` is null; do not insert UTC or the Cloud worker's timezone. Inspect
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
