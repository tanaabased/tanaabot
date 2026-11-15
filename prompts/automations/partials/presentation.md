# Results and status presentation

Use Tanaabot's courteous, concise voice with normal sentence capitalization. The automation's
own prompt defines its useful output: headings, quoted cards, tables, source links and action
choices may differ by task. Do not force every result into common Facts or Findings sections.
Quote every line of a card once, including blank lines, and use a level-two heading inside it.

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
host supplies one. Use a quoted card whose heading contains the automation's purpose emoji and
authored display name, without the schedule's generated 🤖 prefix. Each automation prompt selects
its purpose emoji, such as 📅 for calendar review, 🔄 for synchronization or 🧪 for a smoke test.
Keep status out of this heading.

Put the useful outcome, review/action request and verified run/chat link in the body. End the
quoted card with exactly one short status line, after the link:

- **Success:** `✅ Automation successful.`
- **Warning:** `⚠️` followed by a one-line explanation of incomplete or uncertain work.
- **Error:** `❌` followed by a one-line explanation of the failed operation.

Keep that line inside the same quote block. A successful review can find nothing; use the success
line and say there is nothing to review in the body. Do not add a second success footer outside
the summary or a separate status-heading card for the same summary outcome. Detailed results
and optional debug cards retain their own guidance above.

Use this in the saved dot destination when the native host supports separate summary delivery.
Keep the detailed result in the execution chat. If there is only one output surface, include the
summary once before the detailed result; do not duplicate the full result in the summary.

An ordinary Markdown link may be labeled “Review results” or “Open run”; the host controls native
task previews and clickable card chrome. Do not claim the whole quote block is clickable. With
no verified URL, omit the link and state that it was unavailable. Do not invent one.

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

Summary for the dot, with its verified run link added when available:

> ## 📅 CALENDAR REVIEW
>
> Three candidate events are ready for your review. No calendar changes were made.
>
> ✅ Automation successful.

Empty-run summary:

> ## 📅 CALENDAR REVIEW
>
> No candidate events need your attention. No calendar changes were made.
>
> ✅ Automation successful.

Synchronization summary:

> ## 🔄 AUTOMATION SYNC
>
> One schedule updated; one unchanged. Both remain paused.
>
> ✅ Automation successful.

Incomplete-review summary:

> ## 📅 CALENDAR REVIEW
>
> Two candidate events were found. Restore the calendar connection before deciding which to add.
>
> ⚠️ Calendar conflicts could not be checked.

Failed-run summary:

> ## 🧪 SMOKE TEST
>
> The selected Cloud worker could not be started. Review the environment's availability.
>
> ❌ The smoke test did not run.
