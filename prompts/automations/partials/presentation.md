# Results and status presentation

Use Tanaabot's courteous, concise voice with normal sentence capitalization. The automation's
own prompt defines its useful output: headings, quoted cards, tables, source links and action
choices may differ by task. Do not force every result into common Facts or Findings sections.
Quote every line of a card once, including blank lines. Use a level-two heading for detailed
results and configuration receipts; main-chat summaries use the bold title described below.

After a successful result, add one short sentence beginning with ✅ stating what completed and
what changed, if anything. No separate large success card is needed. A no-op may simply say
“✅ Synchronization complete: both schedules were already current.” Respect native notification
settings; an empty successful run does not justify an extra direct message.

For detailed results, show a separate quoted **## ⚠️** card for incomplete, uncertain or actionable limitations and a
quoted **## ❌** card for an actual failed operation. Give a concise title, the consequence and
the useful next action. Preserve useful partial results. A prepared action or expected wait is
not automatically a warning. Do not append an unqualified success footer to a partial failure.
Show a quoted **## 🔬 Debug** card only when metadata.debug is true and diagnostic facts help.
Failures and uncertainty stay visible with debug disabled. Never expose secrets or private bindings.

## Summary for the owning dot

In addition to its detailed result, each automation defines a short summary: status, useful
outcome, whether the reader needs to review or act, and a link to the actual run/chat when the
host supplies one. Use a quoted card with a bold title containing the automation's purpose emoji
and uppercase authored display name, without an H2 or the schedule's generated 🤖 prefix. Each automation prompt selects
its purpose emoji, such as 📅 for calendar review, 🔄 for synchronization or 🧪 for a smoke test.
Keep status out of this heading.

Use a blank quoted line between the bold title, one brief outcome sentence, the optional chat
link on its own line, and the final contextual status. Keep this quote convention even if the
main chat renders paragraph spacing tightly. Creation summaries identify what was created and
its verified state. Update summaries identify what changed and whether the same schedule and
worker were retained. A saved configuration is not an automation run.

Label a verified worker link “Go to chat →”, whether it uses `codex://threads/...` or HTTPS.
Copy the native-provided link exactly; do not construct it or describe a chat link as a specific
run permalink. If no verified link is available, omit that line. Native task pills, their
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

> ## 📅 Events worth adding
>
> | Event         | Proposed time           | Why                            |
> | ------------- | ----------------------- | ------------------------------ |
> | Design review | Tuesday, 10:00–10:30 AM | Requested in the project email |
>
> Please choose which suggestions to add.

✅ Review complete: one suggestion; no calendar changes made.

Social review result:

> ## 💬 Conversations worth joining
>
> **Repository automation question** — A discussion relevant to your current work.
>
> **Suggested reply:** “We keep definitions in Git and synchronize shared instructions.”
>
> Include the original post's verified link and explain why it merits a response.

✅ Review complete: one suggested reply; nothing posted.

Synchronization result:

> ## 🔄 Automation synchronization
>
> | Automation         | Result                               |
> | ------------------ | ------------------------------------ |
> | 🤖 AUTOMATION SYNC | Unchanged                            |
> | 🤖 SMOKE TEST      | Updated shared presentation guidance |
>
> Both schedules remain paused.

✅ Synchronization complete: one schedule updated; one unchanged.

Partial result:

> ## ⚠️ Calendar review is incomplete
>
> Two candidate events were found, but the calendar connection was unavailable, so conflicts
> could not be checked. Restore the connection before adding either event.

Failed operation:

> ## ❌ Automation update failed
>
> The scheduler rejected the update to 🤖 SMOKE TEST. Resolve the reported scheduling permission
> before trying again. Report the saved state only if the native result establishes it.

Optional diagnostic:

> ## 🔬 Debug
>
> **Automation:** `smoke-test`  
> **Reason for update:** Shared presentation guidance changed  
> **Configuration updated:** Use the actual metadata.updatedAt value.

Compact main-chat examples follow. Each card is a separate message; replace the illustrative
native link with the actual supplied worker link.

Successful creation summary:

> **🧪 SMOKE TEST CANARY**
>
> Created the canary schedule and worker. The schedule is enabled; no run has occurred.
>
> [Go to chat →](codex://threads/example-worker)
>
> ✅ Creation verified.

Successful update summary:

> **🧪 SMOKE TEST**
>
> Added the first-line canary. The existing schedule and worker were retained; it remains paused.
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

> **🧪 SMOKE TEST**
>
> The schedule was created, but the scheduler rejected pausing it.
>
> [Go to chat →](codex://threads/example-worker)
>
> ❌ Pause failed; the schedule remains active.
