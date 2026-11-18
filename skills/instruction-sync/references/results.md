# Instruction sync results

Use the shared [presentation](../../../prompts/presentation-partial.md) rules for quoting,
spacing, severity and delivery. Replace placeholders with observed facts.

Keep the migration review, removal text from the saved document, and exact replacement in
the private main Dot conversation. Send the existing Cloud worker only the outcome, source
and revision metadata, and sanitized change summaries by source file. Use counts when a
description would expose private material. Deliver the compact card through the coordinator
and return the sanitized detailed card through the result-only handoff. Report unavailable
delivery without rerunning the job or repeating a save.

## Detailed result

Use `INSTRUCTION SYNC` with `MIGRATION REVIEW`, `AWAITING APPROVAL`, `UNCHANGED`, `SAVED`,
`BLOCKED`, `FAILED` or `UNVERIFIED`. Use one contextual final status.

> ## 🔄 INSTRUCTION SYNC · <OUTCOME>
>
> **Source** — <Pinned checked or proposed commit, ordered source inventory with immutable
> links, and previously saved commit when different.>
>
> **Saved document** — <Read revision and any verified resulting revision.>
>
> **Changes** — <Proposed, saved and verified, none, or unavailable.>
>
> | Source file              | Additions          | Changes            | Removals           |
> | ------------------------ | ------------------ | ------------------ | ------------------ |
> | <Path or Source unknown> | <Summary or count> | <Summary or count> | <Summary or count> |
>
> **Verification** — <Complete source read, full saved-text readback or precise limit.>
>
> **Next step** — <Review legacy text, approve the exact replacement, or address a blocker when applicable.>
>
> <One contextual final status.>

Omit the table when no comparison is available or no rules changed. Keep metadata corrections
out of rule counts. In the main Dot, include the private removal details and exact full
replacement separately when proposing a save. On the worker, summarize unattributed removals
by count under **Source unknown**.

For a migration review or approval wait, use a status such as `⚠️ First replacement needs
migration review.` or `⚠️ Exact replacement awaiting approval.` After a verified save, use
`✅ Saved instructions verified.` An unchanged result ends with
`✅ Instructions already current.` Report later adoption only when observed separately.

## Main-chat summary

> **🔄 INSTRUCTION SYNC**
>
> <Outcome and action, for example “The exact replacement is ready for your review in this chat.”>
>
> [Go to chat →](verified-worker-url)
>
> <One contextual status matching the detailed result.>

For a scheduled run, link the verified active worker when available. Point to the exact
proposal in the main Dot through a verified link or its location in this conversation.
Report an undelivered proposal as pending. After approval, return the saved/readback result
here and update the worker through the same result-only handoff when available.
