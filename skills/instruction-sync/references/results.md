# Instruction sync results

Use the shared [presentation](../../../prompts/presentation-partial.md) rules for
quoting, spacing, severity and delivery. These layouts own instruction-specific content. Replace
placeholders with observed facts; never use a template as evidence that an operation happened.

Keep the full document and exact proposal in the main Dot's private conversation. A worker receives
only the instruction changes and status needed for its own run report, never unrelated saved instructions or
operator preferences. Direct invocation returns its result in the requesting main conversation.
During automation, the coordinator delivers the compact summary through normal scheduler delivery
and returns the sanitized detail to the Instruction Sync worker without rerunning the job or sending twice.
If either delivery is unavailable, report that limitation; do not claim delivery from composition.

## Detailed result

Use `INSTRUCTION SYNC` with `UNCHANGED`, `AWAITING APPROVAL`, `SAVED`, `BLOCKED`,
`FAILED` or `UNVERIFIED`. A normal approval wait is not an execution failure. Use the shared
warning/error treatment for unavailable access, ambiguous state or an actual failed operation.

> ## 🔄 INSTRUCTION SYNC · <OUTCOME>
>
> **Source:** <Repository path; previously saved commit → checked/proposed commit.>
>
> **Saved document:** <Read revision; verified resulting revision only after a save.>
>
> **Changes:** <Proposed / saved and verified / none / comparison unavailable.>
>
> | Change                       | Before                          | After                           |
> | ---------------------------- | ------------------------------- | ------------------------------- |
> | <Added / removed / modified> | <Exact affected rule or “None”> | <Exact affected rule or “None”> |
>
> **Verification:** <Source inspected, document read back, or unresolved limitation.>
>
> **Next step:** <Approve the exact proposal in the main Dot / no action / concrete recovery.>
>
> <One contextual final status.>

Omit the table when unchanged or comparison is unavailable; say which applies. Include meaningful
conditions in changed rules. Separate source-metadata changes from instruction changes. Do not put
unrelated instructions in this table. Before approval, all changes are **proposed**, the saved
revision remains unchanged and the final line is `⚠️ Awaiting approval; saved instructions unchanged.`
After a verified save, use `✅ Saved instructions verified.` An unchanged result ends with
`✅ Instructions already current; no changes made.` A verified document is not proof that another
conversation or worker follows it; report behavioral adoption only when separately observed.

The exact proposal is a separate main-Dot message or supported private artifact accessible there,
clearly tied to the source commit and read document revision. Preserve an operator request to show
the entire resulting document. The change table or a summary alone is not a substitute for an
exact edit proposal. Do not embed the full document in the worker's card or a public issue.

## Main-chat summary

> **🔄 INSTRUCTION SYNC**
>
> <Useful outcome and whether the operator must act; for example, “Two proposed instruction
> changes await your approval here. Nothing has been saved.”>
>
> [Review proposal →](verified-proposal-url)
>
> <Exactly one contextual status matching the detailed result.>

Use a real proposal link only when available. Otherwise identify the exact proposal in this
conversation; if the proposal could not be delivered here, say that and report the handoff pending.
For a scheduled run, include the verified active worker link using the shared “Go to chat →” convention. Do not
invent links or represent an ordinary approval request as a native task button. After approval,
return the saved/readback result here and update the Instruction Sync worker through a supported result-only
handoff if available. A failed report delivery must never repeat the instruction write.
