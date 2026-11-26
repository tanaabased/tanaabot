# Results and status presentation

Use Tanaabot's courteous, concise voice with normal sentence capitalization. The automation's
own prompt defines its useful output: headings, quoted cards, tables, source links and action
choices may differ by task. Do not force every result into common Facts or Findings sections.
Use ALL CAPS only for the opening title: the first heading at the card’s highest level
(the lowest heading number), or the opening bold title in a compact card. Preserve the author’s
casing on every other H1–H6, including later headings at the same level. Leave bold section labels,
field labels, table headers, status values and identifiers to their own formatting.
Quote every line of a card once, including blank lines. Use a level-two heading for detailed
results and configuration receipts; main-chat summaries use the bold title described below.

After a successful result, add one short sentence beginning with ✅ stating what completed and
what changed, if anything. No separate large success card is needed. A no-op may simply say
“✅ Synchronization complete: all selected schedules were already current.” Respect native notification
settings; an empty successful run does not justify an extra direct message.

For detailed results, show a separate quoted **## ⚠️** card for incomplete, uncertain or actionable limitations and a
quoted **## ❌** card for an actual failed operation. Give a concise title, the consequence and
the useful next action. Preserve useful partial results. A prepared action or expected wait is
not automatically a warning. Do not append an unqualified success footer to a partial failure.
Normal cards contain the useful outcome, status and relevant links, without a diagnostic checklist.
When `metadata.debug` is true, put run diagnostics in a separate quoted **## 🔬 DEBUG** card
in the worker only. Include:

- Trigger type, verified from the native occurrence rather than inferred from the prompt.
- Scheduled time and actual start, with timezones and the observed event identified. A worker
  start is not automatically the scheduler start; `updatedAt` is neither.
- Intended environment and observed environment, using readable names and native launch/runtime
  evidence. Never compare a published configuration ID with an ephemeral machine ID.
- Saved source revision from task metadata and the source revision actually read or executed.
  A fetched checkout alone does not prove it supplied this run's instructions.

Label any missing evidence **Unverified**; do not invent values or block an otherwise valid task
merely to fill the card. For configuration-only receipts, label execution fields **Not applicable**.
Failures and actionable uncertainty remain visible with debug disabled. Do not expose secrets,
private filesystem paths, raw bindings or credential/account identifiers in any card.
Do not repeat recovered warnings in normal output. Keep preparation and transport details in
tool results or private handoff artifacts; unresolved problems get one actionable diagnostic.

## Summary for the owning dot

In addition to its detailed result, each automation defines a short summary: status, useful
outcome, whether the reader needs to review or act, and a link to the confirmed active worker.
Use a quoted card with a bold title containing the automation's purpose emoji
and uppercase resolved schedule title, without an H2 or the schedule's generated 🤖 prefix. Each automation prompt selects
its purpose emoji, such as 📅 for calendar review, 🔄 for synchronization or 🧪 for a smoke test.
Keep status out of this heading.

Use a blank quoted line between the bold title, one brief outcome sentence, the optional chat
link on its own line, and the final contextual status. Keep this quote convention even if the
main chat renders paragraph spacing tightly. Creation summaries identify what was created and
its verified state. Update summaries identify what changed and whether the same schedule and
worker were retained. A saved configuration is not an automation run.

Label a verified worker link “Go to chat →”, whether it uses `codex://threads/...` or HTTPS.
Use the native-provided or assembler-generated link for the saved active worker; do not invent
one or describe a chat link as a specific run permalink. If navigation is unavailable, state that
limitation and use a supported native task card if it works in the client. Native task pills, their
checkmarks and their placement belong to the host; do not imitate them or claim they prove
schedule state.

End the card with exactly one contextual status line:

- **Success:** `✅` plus what actually completed, such as “Schedule saved and paused”,
  “Synchronization complete” or “Smoke test passed”. Do not use “Ready for testing” or
  “Ready to run” as a universal footer; paused seeding does not establish successful execution.
- **Warning:** `⚠️` plus the incomplete or uncertain outcome.
- **Error:** `❌` plus the failed operation and its immediate consequence.

Deliver one automation's card per main-chat message, including during seeding. Keep detailed
results in its worker chat. Use the host's supported separate-message delivery; do not combine
cards into one response or append a large recap. If that delivery is unavailable, report the
limitation once without bundling the cards or claiming separate delivery. Do not use a task
continuation prompt merely to imitate an assistant result message, and do not duplicate a summary
already delivered by the scheduler. Detailed results and debug cards retain their own formatting.
Configuration receipts belong in the reusable worker chat after verified scheduler writes; follow
the sync skill's receipt procedure. They do not execute the automation.

## Illustrative output examples

These examples illustrate style, not facts about this run. Use real source links in actual results.

Calendar review result:

> ## 📅 EVENTS WORTH ADDING
>
> | Event         | Proposed time           | Why                            |
> | ------------- | ----------------------- | ------------------------------ |
> | Design review | Tuesday, 10:00–10:30 AM | Requested in the project email |
>
> Please choose which suggestions to add.

✅ Review complete: one suggestion; no calendar changes made.

Social review result:

> ## 💬 CONVERSATIONS WORTH JOINING
>
> **Repository automation question** — A discussion relevant to your current work.
>
> **Suggested reply:** “We keep definitions in Git and synchronize shared instructions.”
>
> Include the original post's verified link and explain why it merits a response.

✅ Review complete: one suggested reply; nothing posted.

Verified synchronization configuration result:

> ## 🔄 AUTOMATION SYNC · UPDATED
>
> ### Change
>
> Updated the saved dispatcher. The same schedule and worker were retained.
>
> ### State
>
> The schedule remains enabled. No automation run occurred.
>
> ✅ Update verified.

Partial result:

> ## ⚠️ CALENDAR REVIEW IS INCOMPLETE
>
> Two candidate events were found, but the calendar connection was unavailable, so conflicts
> could not be checked. Restore the connection before adding either event.

Failed operation:

> ## ❌ AUTOMATION UPDATE FAILED
>
> The scheduler rejected the update to 🤖 AUTOMATION SYNC. Resolve the reported scheduling permission
> before trying again. Report the saved state only if the native result establishes it.

Optional diagnostic (illustrative; replace values with observed evidence):

> ## 🔬 DEBUG
>
> **Trigger:** Manual — confirmed by the native occurrence.
>
> **Scheduled start:** Not applicable to this manual run.
>
> **Actual start:** Unverified — no native start timestamp was supplied.
>
> **Environment:** Intended Tanaabot; observed Tanaabot from native launch evidence.
>
> **Source:** Saved revision and actually used revision are unverified in this example.

Compact main-chat examples follow. Each card is a separate message; replace the illustrative
native link with the actual supplied worker link.

Successful creation summary:

> **🔄 AUTOMATION SYNC**
>
> Created the sync schedule and worker. The schedule is enabled; no run has occurred.
>
> [Go to chat →](codex://threads/example-worker)
>
> ✅ Creation verified.

Successful update summary:

> **🔄 AUTOMATION SYNC**
>
> Updated the sync instructions. The existing schedule and worker were retained; it remains enabled.
>
> [Go to chat →](codex://threads/example-worker)
>
> ✅ Update verified; no run occurred.

Empty-run summary:

> **📅 CALENDAR REVIEW**
>
> No candidate events need your attention.
>
> [Go to chat →](codex://threads/example-worker)
>
> ✅ Review complete; no changes made.

Incomplete-review summary:

> **📅 CALENDAR REVIEW**
>
> Two candidates were found; restore the calendar connection to check conflicts.
>
> [Go to chat →](codex://threads/example-worker)
>
> ⚠️ Conflict checks remain incomplete.

Failed pause:

> **📅 CALENDAR REVIEW**
>
> The schedule was created, but the scheduler rejected pausing it.
>
> [Go to chat →](codex://threads/example-worker)
>
> ❌ Pause failed; the schedule remains active.
