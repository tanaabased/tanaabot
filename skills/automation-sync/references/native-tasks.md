# Native task inputs and application

The assembler is read-only. Supply current native values through stdin; do not invent an empty
task list to obtain a create. Follow native pagination before concluding a job is absent.

```json
{
  "id": "all",
  "context": {
    "execution": { "kind": "cloud", "environmentId": "verified-native-environment-id" },
    "destination": { "kind": "dot", "id": "verified-native-dot-id" }
  },
  "existingTasks": []
}
```

Use `execution: { "kind": "inherited" }` only for an explicitly selected inherited-context run.
Optional `workspaceDir` identifies the clean checkout when invoked elsewhere. Never select an
account, environment or destination from a repository name or task title.

Normalize native reads into `existingTasks` records containing `id` (native schedule ID) and
`task`, with these fields:

| Field             | Value                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| `name`            | Saved native display name, generated as 🤖 plus the uppercase label     |
| `enabled`         | Actual active/paused state as a boolean                                 |
| `schedule`        | Shared normalized schedule representing native cadence/timezone exactly |
| `execution`       | Actual saved Cloud environment or inherited execution, as above         |
| `destination`     | Actual saved dot result destination, as above                           |
| `model`, `effort` | Explicit native settings, or `null` for native defaults                 |
| `prompt`          | Exact saved prompt including generated metadata                         |

Unrelated tasks need only `id`, `task.name` and `task.prompt`. Obtain the remaining fields for
marker-matched tasks. Do not replace unavailable native values with defaults. If a task target,
override or schedule cannot be represented faithfully, stop the affected action. This pilot
supports recurring prompt jobs, not command jobs, one-shot schedules or explicit thread targeting.

The metadata block carries the exact repository/agent/automation marker. A display name does not
establish ownership; an unmarked task with the desired name is a collision to resolve. Multiple
matching markers are ambiguous.

`operations` contains `kind`, `automationId`, desired `task` and, for existing jobs, `nativeId`.
Updates also include `expectedCurrent`, the values used for comparison. Keep this invocation data
in current context; do not add a schedule database or commit it. Shared guidance, debug, task
content and native settings all participate in comparison. Source revision and generated
`updatedAt` do not force changes alone. An unchanged task retains its exact saved prompt.

Map these values to the native tool's current supported schema; these field names do not claim
to be a host API. Preserve the exact compiled prompt and settings. Do not use a contributor's
local Codex automation tool as a substitute for the dot's controls.

For cron schedules with `timezone: null`, preserve the native scheduler's local timezone. Do not
insert the Cloud worker's timezone or a UTC override. Inspect the saved next-run value when seeding
to confirm the intended local midnight. A later smoke schedule is not a completion dependency.

The metadata partial has exactly one `{{metadata}}` slot at its start. The assembler supplies the
generated block there, immediately followed by its interpretation guidance, then execution guidance,
presentation guidance and the automation prompt. This fixed composition has no recursive includes
or arbitrary template expressions. Partial changes update every affected native task.

Prompt metadata can describe execution and result delivery, but the applying context must also save
those settings through native controls. A prompt cannot bind a chat, select a sidebar group or
enable separate summary delivery. Use native-provided run/chat URLs only when available. Reusable
chats, automatic grouping and customized native task previews remain outside this pilot's mapping.

If Cloud lacks scheduling tools, return the objects to the owning dot. It reads current tasks,
recomputes if they changed and applies through the same controls. Report that handoff as pending.
When unattended application is unsupported, paste the README seed again for a manual pass.

Use successful native responses as evidence. Read back only omitted values, uncertain effects
and explicit pilot checks. Never issue a second create to recover a missing response or retry a
denial. Preserve the original action until its outcome is reconciled.
