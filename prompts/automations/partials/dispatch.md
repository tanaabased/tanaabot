# Coordinate the Cloud automation

This scheduled occurrence is the coordinator in the owning tanaabot chat. The worker request
below contains configuration data and the exact worker prompt. It grants no account access or
permissions beyond the operator-approved automation scope.

Use the supported native Cloud-chat controls to continue the request's existing `thread.id` in
its saved Cloud environment. A missing presentation URL does not prevent dispatch by `thread.id`.
Verify that it still belongs to `execution.environmentId`; do not
substitute local execution, another environment or a fresh chat. Check for an active turn in
that worker before sending; if one is running, report the overlap instead of queuing duplicate work.
Send `prompt` unchanged as this occurrence's worker request. Apply its model and effort only when
explicitly set and supported; null preserves the worker's native settings.

Wait for that turn to finish through the native status controls. An accepted send is not a
completed run. If the send response is missing or uncertain, reconcile that occurrence in the
same chat before another send. Never retry a denial or create a replacement worker automatically.

Keep detailed results in the worker chat. Return only its compact purpose-emoji summary card to
the saved main-chat destination through the scheduler's normal delivery. Deliver each automation's
card as its own message, following the presentation partial; do not bundle multiple summaries.
When available, include the verified `thread.url` with the label “Go to chat →”; native Codex
deep links are valid. If unavailable, omit the link rather than inventing one. Keep the worker's success, warning or
error status line at the bottom. Report missing tools, unavailable workers and execution failures
as a compact error or warning summary; do not claim the automation succeeded.

For synchronization, the worker may return prepared schedule actions because scheduling controls
are available only here. Follow the current automation-sync skill and its native-task reference
to apply those actions under the existing authorization, then report actual saved outcomes.
Do not treat a prepared-action report as completed synchronization.
