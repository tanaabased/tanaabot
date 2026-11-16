# Authorized smoke pilot

Use the canonical sync workflow during an operator-authorized validation window. The manual seed
at `d94791ea378efa6a7e3b2e061544a8714b2997d3` created and paused the synchronizer and original smoke
schedule; it did not run either automation. Preserve their native schedule IDs and reusable
workers in `REPORTS`. No cleanup or replacement of those workers is needed for this pilot.

## Create and update

1. Inspect existing schedules and their verified workers. Confirm the original `smoke-test` is
   still paused. If its live enabled setting differs from the source, reconcile that difference
   with the operator before applying; this pilot must not silently toggle the original task.
2. Preview synchronization from clean canonical GitHub `main`. The new `smoke-test-canary`
   definition is enabled and runs every five minutes. Create its distinctly named `SMOKE TEST
CANARY` worker in the published Tanaabot environment and `REPORTS`, using initialization only.
   Verify the native next occurrence before applying when available, and read it back after
   creation. A native cadence that cannot represent five minutes is a limitation, not permission
   to substitute another schedule. Do not invoke Run now as part of saving the configuration.
3. Apply the prepared actions only with live pilot authorization. Verify that the canary has a
   new native schedule ID and is enabled. Verify that the original smoke task retains its native
   ID, worker and paused state, and that the literal first line in its saved native prompt is
   `TANAABOT-SYNC-CANARY: ORBITAL-GOOSE-731`. Inspect the scheduler's Edit view as well as readback.
   The ownership marker must remain intact. Shared presentation changes may also update the
   existing synchronizer; retain its native ID, worker and paused state. Leave unrelated schedules
   untouched.
4. Follow [configuration receipts](./configuration-receipts.md) after verified writes. Inspect the
   canary worker's creation receipt and original worker's update receipt, including the before →
   after changes. Each affected automation gets one separately delivered main-chat summary with
   its verified “Go to chat →” link. Check actual worker rendering, main-chat message separation
   and deep-link behavior independently of saved state. Receipt delivery must not run the job.
5. Synchronize again without source or native changes. Confirm no schedule writes, duplicates,
   timestamp changes or update receipts. Keep existing IDs and workers.

## Scheduled occurrence and cleanup

When the operator authorizes the live run, let the next five-minute canary occurrence execute;
no immediate manual test run is needed. Inspect `TANAABOT-SCHEDULE-CANARY-1`, observed environment,
native run evidence, the detailed worker output and separately delivered main-chat summary.
Pause the canary after the first observed run and verify the paused state. If the operator pauses
it before a run occurs, record execution as unverified. Do not call manual Run now unattended
execution, and do not infer that the synchronizer can mutate schedules from a successful canary run.

Before another synchronization, set the canary's source `enabled` to false through an authorized
source change and synchronize that revision so it stays paused. A temporary manual pause is not
source convergence; syncing an enabled definition would otherwise re-enable it. Keep the original
smoke task and synchronizer paused unless the operator separately changes their intended state.
Removal requires its own explicit scope; do not automatically delete schedules or workers.

An unattended synchronizer invocation remains a separate check. If its Cloud worker cannot apply
schedules, preserve the supported dot handoff and distinguish prepared actions from verified writes.
