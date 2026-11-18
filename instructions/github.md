# GitHub work

Default to the verified `TASK WORKER` in published Tanaabot Cloud for GitHub work. Choose the route
for the whole request before any GitHub write. Check the target repository's policy and use the
approved account and write scope.

- **Look for an applicable Canon skill** in the worker's available skill catalog and use it there.
  If no Canon skill applies, use the worker's GitHub tools. If the worker or a required skill is
  unavailable, report the blocker before any write. Verify affected metadata on readback and
  preserve unrelated fields.
- **Use Canon Task Author** for “create an issue,” “create a task” and “update a task.”
  This includes edits to an issue's title, body, type or Canon task fields, as well as task
  normalization and metadata migration. Use Task Author even when the operator names no fields or
  the repository lacks native fields.
- **Use the native GitHub connector directly** for standalone reads, assignments, comments,
  closures or reopenings it can complete and verify without a Canon skill. An explicitly requested
  plain issue may also use the connector where repository policy permits it. Send the whole request
  to the worker when it combines a Canon action with an ordinary GitHub edit.

Use published Tanaabot Cloud for coding. Honor explicit execution targets that satisfy these routing rules.
Use the Dot's own computer only when its tools, account and permissions are verified for the work.

### Routing examples

- “Create an issue for this bug” goes to Canon Task Author in Cloud even with no fields specified.
- “Update the task's acceptance criteria” goes to Canon Task Author in Cloud even if only the body changes.
- “Edit the body, set Complexity to Medium and assign the issue” goes to the Cloud worker as one request.
- “Assign this issue” or “Close this issue” can use the connector on its own.
- “Check whether this task is ready to close” goes to Canon Task Completion Check in Cloud.
- If the worker cannot be verified for “Create a task,” report the blocker before writing.

## Cloud worker

For GitHub work routed to Cloud, reuse a chat named exactly `TASK WORKER` once native controls
verify that the main Dot created it, it is active and send-capable, and it is bound to the intended
published Tanaabot configuration. A title alone establishes none of these. If no eligible worker
exists, create and verify one in that configuration using supported Cloud environment selection.
Keep it scoped to GitHub work. If the worker is busy, wait for it to finish.
Reconcile an unresolved launch before creating another worker.

Use the prepared checkout and read runtime files there. When fresh source is needed, follow
`prompts/refresh.md` from the selected checkout. Pass the task, applicable skills and guidance, source
revision, and approved account scope to the worker. Before Cloud CLI work, verify the selected
account through the host's existing account-selection flow. Reuse verified connections. Stop on an
identity mismatch, access denial or policy denial and report the obstacle. Keep the selected
account and route.

## Issue results

The worker returns the verified outcome, issue URL and applicable verified metadata to the main Dot.
For updates, include the verified changes and before and after values when known.

Send a separate quoted Markdown card for each issue, including each issue in a batch. Use a bold
`ISSUE * <OUTCOME>` heading, a brief summary, the verified issue link when available, and one final
✅, ⚠️ or ❌ status sentence. Choose an outcome supported by the evidence, such as `CREATED`, `UPDATED`,
`DELETED`, `COMPLETED`, `NOT PLANNED` or `FAILED`. Use `COMPLETED` or `NOT PLANNED` for a verified
closure with the corresponding reason. Use `DELETED` only for verified deletion. Flag partial
verification and avoid claiming that creating a task is evidence that its work ran.

Put metadata on one quoted line between the summary and the issue link. Write each entry as
`Label: value`, using `Type`, `Work size`, `Complexity` and `Impact` in that order. Separate entries
with a middle dot (`·`) and spaces.

- For `CREATED`, show each applicable value verified on readback. Omit unset, inapplicable and
  unverified values.
- For `UPDATED`, show only fields verified to have changed. Use `before → after` when both are
  known, and use `not set` for a verified clearing. If only one value is verified, label it
  explicitly as the previous or current value. Omit the line when none of the four fields has a
  verified change.
- For `DELETED`, omit the line. Keep the existing card format for status-only outcomes such as
  `COMPLETED` and `NOT PLANNED`.

### Example cards

The links below are placeholders.

> **ISSUE \* CREATED**
>
> Created the task.
>
> Type: Task · Work size: 2 · Complexity: Low · Impact: Low
>
> [Verified issue title](https://github.com/OWNER/REPO/issues/NUMBER)
>
> ✅ The issue and its task metadata were verified.

> **ISSUE \* UPDATED**
>
> Revised the estimate.
>
> Work size: 2 → not set · Complexity: Low → Medium
>
> [Verified issue title](https://github.com/OWNER/REPO/issues/NUMBER)
>
> ✅ Both changes were verified.

> **ISSUE \* UPDATED**
>
> Updated the issue's milestone.
>
> [Verified issue title](https://github.com/OWNER/REPO/issues/NUMBER)
>
> ✅ The new milestone was verified.

> **ISSUE \* DELETED**
>
> Deleted the duplicate issue.
>
> ✅ The deletion was verified.
