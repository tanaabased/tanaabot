# Configuration results

After a native create or material update has been verified, deliver its full configuration
receipt to the automation's existing reusable worker chat. This is a private configuration
record, not a scheduled invocation. Do not publish native IDs or destination details to GitHub.
An unchanged action produces no update receipt.

Use the saved scheduler settings, the prepared source commit and verified worker binding.
Include only observed facts; mark unavailable fields unverified. For an update, compare the
previous saved values with the verified result rather than describing the desired plan as applied.

Use one quoted card with an H2 containing the purpose emoji, uppercase authored display name
and a spaced middle dot followed by `CREATED` or `UPDATED`, for example
`> ## 🔄 AUTOMATION SYNC · UPDATED`. Do not put “receipt” in the visible title. Include:

- Purpose of the automation.
- Published Cloud environment, reusable worker and `REPORTS` placement.
- Source repository and exact source commit applied to this configuration.
- Configured cadence, actual scheduler timezone and displayed next occurrence when available.
- Result destination and native schedule ID.
- Saved enabled/paused state and whether an automation run occurred. Do not infer execution from
  chat initialization, receipt delivery or a native task checkmark.
- For updates, a before → after section listing actual changes and confirming whether the native
  schedule ID and worker were retained.

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

Use one row per automation considered in this invocation. Report verified native outcomes,
not the assembler's proposed operations: ✅ Created, ✅ Updated, ✅ Unchanged, ⚠️ Skipped or
❌ Error. Include a concise note where useful. Mark unapplied handoffs or unavailable evidence
as ⚠️ Pending or ⚠️ Unverified, never success. An elapsed one-shot is Skipped; that alone does
not establish that it ran. For example, after verified application:

> ## 🔄 AUTOMATION SYNC · RUN RESULTS
>
> | Automation           | Status     | Note                                                  |
> | -------------------- | ---------- | ----------------------------------------------------- |
> | AUTOMATION SYNC      | ✅ Updated | Saved new instructions; retained schedule and worker. |
> | SMOKE TEST CANARY #3 | ✅ Created | Enabled for the verified one-time occurrence.         |
>
> ✅ Synchronization complete. The canary has not run yet.

Use a contextual final status reflecting failures, pending actions or missing evidence. Do not
duplicate this aggregate in the main chat; retain its individual compact linked summaries.
If the coordinator owns native writes, return the verified outcomes to the sync worker for this
report without rerunning synchronization. Raw preparation JSON stays in tool results or private
handoff artifacts.
