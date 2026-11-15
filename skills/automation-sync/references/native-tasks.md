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
For initial seeding, inspect existing native chats before creating one; names alone do not establish
automation ownership. If a prior create was uncertain, reconcile it before another create.

For a new worker, use the native Cloud-chat creation control with the selected published configuration
ID and an initialization-only prompt. Wait for that initialization to finish. Use native sidebar
controls to find or create the desired section and place the chat there. Apply authorized title/group
changes to an existing worker without replacing its ID. Verify its Cloud configuration from native
association or the original launch receipt, not a name or repository claim. A missing existing worker
or an environment mismatch stops the affected action; do not create a replacement automatically.

Keep the native-provided chat URL. A worker without a verified URL cannot satisfy linked-summary
delivery and stops schedule assembly. Do not construct URLs from IDs. Native worker IDs and URLs
live in the saved schedule prompt and current native responses, not a separate database.

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
        "environmentId": "verified-published-config-id",
        "name": "AUTOMATION SYNC",
        "group": "REPORTS",
        "url": "https://native-provided-chat-url.example/"
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
guidance and the authored automation prompt. The coordinator continues that worker, waits for its
result and returns the compact linked summary through normal main-chat delivery. Scheduling a
coordinator does not itself bind a Cloud environment. Prompt guidance directs the supported native
delegation established by the pilot; it does not create missing tools or native settings.

For unrelated tasks, only `id`, `task.name` and `task.prompt` are needed. Read remaining fields for
marker-matched tasks. Do not invent unavailable native values. The ownership marker identifies
repository, agent and automation; an unmarked name collision or multiple matching markers stops
the action. `operations` returns `create`, `update` or `unchanged`, with the existing `nativeId` and
`expectedCurrent` for updates. If another writer changed that record, recompute before application.

Apply exact compiled prompts and settings through the owning dot's native schedule controls.
Never use the contributor's local scheduler as a substitute or write scheduler files. Preserve
local-time cron when `timezone` is null; do not insert UTC or the Cloud worker's timezone. Inspect
the displayed next run during seeding to confirm local midnight. The later smoke schedule is not
a completion dependency. Source `enabled: false` means paused, regardless of other defaults.

All consumed partials participate in comparison, including coordinator dispatch. A changed partial
updates every affected task. Generated timestamps and source revision alone do not force updates;
unchanged schedules retain their exact prompts, timestamps and native IDs. Successful native
responses establish saved settings when returned; read back only missing values, uncertain effects
and explicit pilot checks. Never repeat a denied or uncertain create.

If the Cloud worker cannot save schedules, it returns prepared actions to the coordinator for
application through this same workflow. Report the handoff as pending until application succeeds.
Unsupported unattended application requires the README's manual seed; never claim it was saved.
