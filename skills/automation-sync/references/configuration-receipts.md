# Configuration results

After a native create or material update has been verified, deliver its full configuration
receipt to the automation's existing reusable worker chat. This is a private configuration
record, not a scheduled invocation. Do not publish native IDs or destination details to GitHub.
An unchanged action produces no update receipt.

Use the saved scheduler settings, the prepared source commit and verified worker binding.
Include only observed facts; mark unavailable fields unverified. For an update, compare the
previous saved values with the verified result rather than describing the desired plan as applied.

Use one quoted card with an H2 containing the purpose emoji, uppercase resolved schedule title
and a spaced middle dot followed by `CREATED` or `UPDATED`, for example
`> ## 🔄 AUTOMATION SYNC · UPDATED`. Do not put “receipt” in the visible title. Include:

- What was created or materially changed, including relevant before → after values.
- Configured cadence, timezone, next occurrence when useful, and saved enabled/paused state.
- Whether the schedule and worker were retained, without printing their private IDs.
- Sidebar placement only when useful: report the observed result separately from saved schedule
  state, using the [final placement pass](./native-tasks.md#final-sidebar-placement) result.
- A verified worker link when useful and whether a run actually occurred. Configuration alone
  does not establish execution.

Keep source-revision comparisons and environment diagnostics in the separate worker Debug card
only when `debug: true`, following the shared presentation partial. Do not include raw bindings,
private paths or native schedule IDs in visible cards. Use those internally for reconciliation.

Separate sections with blank quoted lines and keep each field readable on its own line. Put a
blank quoted line immediately after the H2 title and before the final status. Finish
with one contextual ✅/⚠️/❌ status line inside the quote. A receipt confirms saved configuration,
not completion of the automation's work. Follow the shared presentation partial for the separate
main-chat summary, whose link points to this worker.

If delivery uses a worker continuation, send an explicit receipt-only instruction: display the
supplied verified configuration card, do not execute the saved job or synchronize schedules, and
do not send another main-chat summary. Do not include the compiled executable worker request.
Wait for receipt delivery to finish before reporting it delivered. If the worker is already
running, leave delivery pending rather than interrupting it or launching duplicate work.

If delivery fails, retain the successful scheduler result and report receipt delivery separately.
Do not repeat a verified schedule write to repair presentation. Reconcile uncertain delivery in
the same worker before sending again. The live pilot must inspect actual worker rendering;
saved scheduler state and a prepared Markdown card do not establish that the receipt was shown.

Keep preparation tables, transport details and raw metadata in tool results or private handoff
artifacts. If a problem
is recovered, do not repeat its warning as a successful result. If it remains unresolved, show
one actionable warning or error with the affected saved state and next step. Compact summaries
belong only in the main chat, not before or after the worker's configuration card.

## Synchronization run results

After native application finishes, display one separate aggregate card in the sync worker.
If sync itself was created or updated, show its configuration card first, then this run-results
card as a separate message. An unchanged sync needs only the run-results card; never invent an
update to produce two cards. Keep each automation's configuration receipt in its own worker.
If an unchanged schedule still has a placement limitation, include it in the run-results note
without inventing a configuration update or blocking other work.

Use one row per automation considered in this invocation. Report verified native outcomes,
not the assembler's proposed operations: ✅ Created, ✅ Updated, ✅ Unchanged, ⚠️ Skipped or
❌ Error. Include a concise note where useful. Mark unapplied handoffs or unavailable evidence
as ⚠️ Pending or ⚠️ Unverified, never success. An elapsed one-shot is Skipped; that alone does
not establish that it ran. For example, after verified application:

> ## 🔄 AUTOMATION SYNC · RUN RESULTS
>
> | Automation      | Status     | Note                                                  |
> | --------------- | ---------- | ----------------------------------------------------- |
> | AUTOMATION SYNC | ✅ Updated | Saved new instructions; retained schedule and worker. |
>
> ✅ Synchronization complete. The saved schedule is current.

Use a contextual final status reflecting failures, pending actions or missing evidence. Do not
duplicate this aggregate in the main chat; retain its individual compact linked summaries.
If the coordinator owns native writes, return the verified outcomes to the sync worker for this
report without rerunning synchronization. Raw preparation JSON stays in tool results or private
handoff artifacts.

For a full sync, include a separate **Tanaabot instructions** row alongside the automation rows.
Use the main Dot's observed result: ✅ Unchanged, ⚠️ Awaiting approval (document unchanged),
✅ Saved and verified, ⚠️ Pending/Blocked/Unverified, or ❌ Failed. Do not turn worker source
preparation into a successful instruction comparison. If the instruction check was outside the
approved scope, mark it **Not checked** with that reason. Omit the row for single-ID and bootstrap-only
passes. Keep schedule outcomes intact when the instruction check cannot proceed.

Read and follow [instruction results](../../instruction-sync/references/results.md) and its shared
presentation dependency before rendering the separate detailed instruction result and compact
main-chat summary. Keep the exact proposal in the main Dot. An expected approval wait needs no
extra failure card; use `⚠️ Instruction changes await approval; schedules <verified outcome>.`
as the aggregate's contextual footer when appropriate. An approval continuation updates only the
instruction result through a supported result-only handoff, without new schedule configuration cards
or a second sync execution. If handoff is unavailable, keep the worker's result pending and report
the verified instruction result in the main Dot with the delivery limitation.
