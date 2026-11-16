# Authorized smoke pilot

Use the canonical sync workflow during an operator-authorized validation window. Keep the existing
synchronizer and original smoke schedule IDs. The original `smoke-test-canary` now declares
`enabled: false`; preserve its paused state and archived chat history. The fresh
`smoke-test-canary-2` declares an enabled hourly schedule and uses its own worker and marker.
Inspect current native state before applying; source definitions do not establish what was saved.
For a quick bounded pilot, first author an operator-selected future `schedule.at` timestamp for
canary #2 and publish that source change. The assembler will skip it after that time; do not replace
it with a relative delay on every sync. Leave the other definitions' cadence and enabled state alone.

## Run the current synchronizer

1. Use Run now on the existing version-2 synchronizer. If temporary enablement is required, restore
   its paused state afterward. Fetch and pin clean canonical GitHub `main`, then load that revision's
   sync skill and required references. Select `all`; update and verify sync first if it changed.
   Saving its new prompt does not prove the current invocation used that new dispatcher.
2. Retain the original smoke schedule and active worker. Resolve each worker's native archive
   status. For a confirmed archived managed worker, follow the [replacement procedure](./native-tasks.md#replace-a-confirmed-archived-worker)
   and retain its native schedule ID, cadence and enabled state. Unknown status is not permission
   to create a replacement. Keep archived chats intact.
3. Initialize the new `SMOKE TEST CANARY #2` worker in the selected published Cloud configuration
   and `REPORTS`. Inspect its `CHAT CREATED` card. Reconcile previous attempts before creating;
   reuse an existing verified worker if this step already succeeded.
4. Save `smoke-test-canary-2` with its compiled schedule and declared enabled state. Verify the next
   occurrence and saved worker ID. Do not run the canary manually during configuration. Inspect
   the separate `SMOKE TEST CANARY #2 · CREATED` schedule card in that same worker.
5. Inspect the separate main-chat summaries and their “Go to chat →” links. Test the final active
   worker on iOS and desktop, including an assembler-generated link when native creation supplied
   no URL. If a client cannot navigate, test a native task card; if neither works, report navigation
   unavailable. Backend access does not establish client navigation. Do not link an archived worker.

If the saved dispatcher still predates `dispatchVersion: 2`, first perform a sync-only upgrade with
`id: "sync"` for both targets and assembly, verify saving, and stop. A separate Run now then follows
the steps above. Version-2 dispatchers do not need this bootstrap on every source update.

## No-op, scheduled occurrence and cleanup

Synchronize unchanged before cleanup. Confirm no writes, duplicate workers, timestamp changes or
new creation/update cards. Retain the saved schedule IDs and replacement bindings. A source change
between runs is not an unchanged test.

Let the authorized occurrence of canary #2 execute. Inspect `TANAABOT-SCHEDULE-CANARY-2`,
native scheduled-run evidence, observed execution environment, worker output and main-chat summary.
Check that the incoming request's readable title precedes its metadata and instructions, and inspect
actual card rendering and separate summary delivery. A transcript alone does not prove those visuals.

For a one-time pilot, sync again after its scheduled time and confirm it is skipped without
rearming or replacing its worker. A skipped result alone does not prove it executed.
For the hourly fallback, pause canary #2 after the first observed run and verify it. If paused before it runs, record execution
as unverified. Before another sync, make an authorized source change to set its `enabled: false`;
otherwise normal sync would re-enable it. Keep the original canary, smoke test and synchronizer
paused and restore temporary enablement. Do not delete or archive schedules or workers automatically.

If archive replacement still needs a live trial, obtain authorization to archive a selected test
worker, then synchronize and verify exactly one active replacement, the same saved schedule ID and
unchanged cadence/state. Run another unchanged sync and confirm no further replacement. Ordinary
scheduled dispatch must not perform this repair. Interrupted or competing native operations need
their own controlled trial; pure assembler tests do not prove exclusive native creation.

An unattended synchronizer creating or updating a schedule remains a separate check. Neither a
manual sync nor a scheduled canary proves it. Preserve the supported coordinator handoff if the
worker lacks scheduling tools, and distinguish prepared actions from verified saved changes.
