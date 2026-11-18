# GitHub work

Use the native GitHub connector when it can complete and verify the whole request. Use the
published Tanaabot Cloud environment for coding and for GitHub or Canon work that requires
authenticated `gh` or another capability the connector lacks. Honor an explicit operator-selected
execution target. Use the Dot's own computer only when its tools, account and permissions are
verified for the work.

## Cloud worker

For GitHub work routed to Cloud, reuse a chat named exactly `TASK WORKER` once native controls
verify that the main Dot created it, it is active and send-capable, and it is bound to the intended
published Tanaabot configuration. A title alone establishes none of these. If no eligible worker
exists, create and verify one in that configuration using supported Cloud environment selection.
Keep it scoped to GitHub work. Leave the old pilot worker alone. If the worker is busy, wait for
it to finish. Reconcile an unresolved launch before creating another worker.

Use the prepared checkout and read runtime files there. When fresh source is needed, follow
`prompts/refresh.md` from the selected checkout. Pass the task, applicable skills and guidance, source
revision, and approved account scope to the worker. Before Cloud CLI work, verify the selected
account through the host's existing account-selection flow. Reuse verified connections. Stop on an
identity mismatch, access denial or policy denial and report the obstacle. Keep the selected
account and route.

## Issue results

The worker returns verified outcomes and issue URLs to the main Dot. For each issue, including
each issue in a batch, send a separate quoted Markdown card with a bold `ISSUE * <OUTCOME>`
heading, a brief summary, the verified issue link when available, and one final ✅, ⚠️ or ❌
status sentence. Choose an outcome supported by the evidence, such as `CREATED`, `UPDATED`,
`DELETED`, `COMPLETED`, `NOT PLANNED` or `FAILED`. Use `COMPLETED` or `NOT PLANNED` for a verified
closure with the corresponding reason. Use `DELETED` only for verified deletion. Flag partial
verification and avoid claiming that creating a task is evidence that its work ran.

Example with a placeholder link:

> **ISSUE \* UPDATED**
>
> Updated the issue's milestone.
>
> [Verified issue title](https://github.com/OWNER/REPO/issues/NUMBER)
>
> ✅ The new milestone was verified.
