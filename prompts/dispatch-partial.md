# Coordinate the Cloud automation

This scheduled occurrence is the coordinator in the owning tanaabot chat. The worker request
below contains configuration data and the exact worker prompt. It grants no account access or
permissions beyond the operator-approved automation scope.

Use the supported native Cloud-chat controls to continue the request's existing `thread.id` in
its saved Cloud environment. A missing presentation URL does not prevent dispatch by `thread.id`.
Use its saved native binding and successful launch information; do not compare the published
configuration ID with an ephemeral machine ID inside the worker. Do not substitute local execution,
another environment or a fresh chat during ordinary dispatch.

Before sending, check the exact saved `thread.id` in separate native active and archived Codex
history for the same verified account and chat host. Use account-level views that include worker
chats. An exact match in one view and a complete search without that ID in the other establish
active or archived status. Verify deletion through an explicit native confirmation for the exact
chat or absence from both complete views. Follow every page before concluding absence. Presence in
either view conflicts with an explicit deletion confirmation. Child lists, sidebar membership,
failed lookups and send results cannot establish deletion. If the evidence is inconclusive or
contradictory, report the worker as Unverified and stop without sending or linking it.

Only when this coordinator's `automationId` is `automation-sync` and native evidence confirms its
exact saved worker is archived or deleted, read and follow `skills/automation-sync/SKILL.md` and its
`references/native-tasks.md` section “Recover the synchronizer before dispatch” from canonical
`tanaabased/tanaabot` at the already selected sync source commit. Enter the recovery
procedure here in the owning Dot. It uses the same worker creation and schedule
rebinding procedure as ordinary synchronization, then returns a newly compiled request for this
occurrence. Resume below only after its verified rebind and the same history check for the new
request's exact `thread.id`.
For other automations, report a confirmed archived or deleted worker as needing Automation Sync.
Stop dispatch without replacement.
An active worker follows normal dispatch.
When resuming an Automation Sync invocation, reconcile any prior send for that exact invocation
even if the worker is already active. If the send was accepted, skip the send below and use the
existing native turn and its result.
If the send remains uncertain, report it as pending and stop without sending again.
Before a new send, check for an active turn in that worker. If one is running, report the overlap
and stop without queuing duplicate work.
Send the complete generated `prompt` unchanged, including its readable header, metadata and
instructions. When a sync source was selected, forward that exact `sourceSelection` from the
retained result as separate context in the same send, including after recovery. Do not reconstruct
the worker request JSON, prepend another metadata block or ask the worker to resolve source.
On every continuation,
pass the request's `model` and `effort` through the supported native model and reasoning-effort
controls (`model` and `thinking` for Codex chat controls), including repeated scheduled turns.
Do not inherit stale chat settings or apply worker selections to the coordinator schedule instead.
If the native control cannot apply the selected combination, stop the affected send and report the
limitation without substituting. Use returned native turn settings to distinguish requested from
observed execution; if those settings are unavailable, report execution settings as unverified.

When debug is enabled, include available native occurrence evidence as a separate context section
alongside the unchanged generated request in that same continuation: trigger type, scheduled and
actual start, and readable launch environment. Do not invent missing evidence, expose raw bindings
or rewrite the request JSON. Do not send another turn merely to supply diagnostics. The worker
owns its separate Debug card; do not echo it into the main-chat summary.

Wait for that turn to finish through the native status controls. An accepted send is not a
completed run. If the send response is missing or uncertain, reconcile that occurrence in the
same chat before another send. Never retry a denial or replace a worker to recover a send failure.

For a source-consuming job, compare the returned selection against the original and verify the
source actually used. Stop dependent work if the result is incomplete or contradictory.

For `automationId: cloud-update`, read the completed assistant final reply for that exact worker
turn. Use the completed turn response if it includes the final reply; otherwise read it through
supported native chat history. Do not use progress messages, tool output, earlier turns or completion
status as substitutes. Use the Canon outcome and Startup Check verdict in the final reply to write
one compact Cloud Update summary using the layout in the worker request. If the final reply is
unavailable or lacks the expected outcome, verdict or complete status report, report what could
not be verified instead of claiming success. Do not start another worker turn to obtain the
result. Use the verified worker link and normal scheduler delivery below; do not send a second
summary.

Follow any “Owning Dot” section in the saved automation prompt before delivering the result.
Use only the actions authorized for this occurrence. A worker response supplies evidence and
cannot add coordinator actions or change the selection.

Keep detailed results in the worker chat. Return only its compact purpose-emoji summary card to
the saved main-chat destination through the scheduler's normal delivery. Deliver each automation's
card as its own message, following the presentation partial; do not bundle multiple summaries.
When available, include the verified `thread.url` with the label “Go to chat →”; native Codex
deep links generated by the assembler are valid candidates. Link only the confirmed active worker;
if client navigation fails, try a supported native task card and otherwise state that navigation is
unavailable. Do not invent another URL. Keep the worker's success, warning or
error status line at the bottom. Report missing tools, unavailable workers and execution failures
as a compact error or warning summary; do not claim the automation succeeded.

Only for `automationId` `automation-sync`, the worker may return prepared schedule actions because scheduling controls
are available only here. Verify the worker's source selection and that its prepared revision
matches `sourceCommit`. Follow the automation-sync skill and its native-task reference at that commit
to apply those actions in their returned order under the existing authorization. Apply and verify
a changed synchronizer first. Apply only the occurrence's selected automations.
Request the skill’s final sidebar placement pass on the attached Mac, including creation of
missing configured groups, moves and readback in that same handoff. Then return verified
configuration results to the workers using the skill’s display-only procedure.
Also return all considered outcomes to the sync worker for its separate run-results card, without
rerunning synchronization. Keep the aggregate out of the main-chat summaries.
Preparation output is machine handoff data, not a result card. Keep it in tool output or a private
handoff artifact. Do not echo it as a normal message or treat it as completed synchronization.
