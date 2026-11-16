# Authorized smoke pilot

Use the canonical sync workflow during an operator-authorized validation window. Keep the
existing synchronizer and original smoke schedule IDs and their workers in `REPORTS`. The
canary worker was already initialized; reuse it. Its five-minute schedule was rejected and
was not saved. Confirm current native state before applying; do not infer absence from that
earlier result or create duplicate workers.

## Pass one: upgrade the synchronizer only

1. Run the existing saved synchronizer once. If Run now requires temporary enablement, do that
   only within the authorized pilot window and restore its paused state afterward.
2. Fetch clean canonical GitHub `main`, pin one commit, and immediately read that revision's sync
   skill. An incoming dispatcher without `dispatchVersion: 2` selects the bootstrap path. Use
   `id: "sync"` in both targets and sync assembly; an explicit sync-only request does the same.
3. Update only the synchronizer, preserving its native ID, worker and intended paused state.
   Verify the saved prompt has `dispatchVersion: 2`, the new worker header, and the applied source
   revision. Show its `AUTOMATION SYNC · UPDATED` configuration card first.
4. End this pass without changing the smoke task or creating/enabling the canary schedule.
   Saving a new dispatcher does not replace the one already running. Do not automatically start
   pass two or claim the new dispatcher executed.

## Pass two: execute the updated saved task

1. Start a distinct Run now from the updated saved synchronizer. Verify the incoming request
   actually contains `dispatchVersion: 2` and its generated readable header. Fetch and pin current
   canonical `main` and load that skill; record the saved dispatcher and selected source revisions
   separately if they differ.
2. Select `all`. If the synchronizer changed again, apply and verify it first. Update the original
   smoke task in place, retaining its ID, worker and paused state. Its literal first saved prompt
   line must change from `TANAABOT-SYNC-CANARY: ORBITAL-GOOSE-731` to
   `TANAABOT-SYNC-CANARY: ORBITAL-GOOSE-732`. Check the native editor and saved result.
3. Create the separate `smoke-test-canary` schedule using its existing worker. Its authored
   cadence is every ten minutes, with `enabled: true`. Verify the native scheduler can represent
   that cadence exactly and inspect its next occurrence and saved state. Do not silently translate
   the schedule or invoke Run now on the canary during configuration.
4. Inspect the actual incoming worker message: its own title and short request must precede the
   JSON and prose. Check the client's preview and collapse behavior; Markdown alone does not
   establish either. Confirm forwarding preserved the generated content.
5. Follow [configuration results](./configuration-receipts.md). Inspect the original smoke worker's
   `SMOKE TEST · UPDATED` card and the canary worker's `SMOKE TEST CANARY · CREATED` card, including
   saved state, source revision, IDs and before/after changes. Verify real quoted H2 rendering,
   blank lines after titles and before final statuses, and absence of routine preparation cards.
   Confirm each compact summary arrives separately in the main chat and its link opens the right
   worker. Transcript text alone does not establish visual rendering or message separation.

## No-op, scheduled occurrence and cleanup

Synchronize unchanged before cleanup. Confirm no writes, duplicates, timestamp changes or update
cards. Retain every saved schedule ID and worker. Leave unrelated schedules untouched.

Let one authorized ten-minute canary occurrence execute. Inspect `TANAABOT-SCHEDULE-CANARY-1`,
native scheduled-run evidence, observed execution environment, worker output and main-chat summary.
Pause the canary after the first observed run and verify it. If paused before it runs, record
execution as unverified. A manual run does not prove unattended execution.

Before syncing again, change the canary source to `enabled: false` through an authorized source
change and synchronize it. Otherwise the enabled source would re-enable the paused schedule.
Keep the original smoke test and synchronizer paused and restore any temporary enablement.
Do not delete schedules or workers automatically.

An unattended synchronizer creating or updating a schedule is a separate remaining check.
Neither manual sync pass nor a scheduled canary proves it. Preserve the supported coordinator
handoff if the worker lacks scheduling tools, and distinguish prepared actions from saved changes.
