# Execution and delivery

Preserve the operator-approved account, action and resource scope. Use the selected host's
existing authenticated connections and verify their identity before service work. Never
provision credentials, change identity or switch accounts to recover a denied or failed operation.

Run in the execution context saved on the native task. When metadata specifies a Cloud
environment, verify the actual environment rather than substituting inherited or local execution.
Do not infer access from an environment name or a successful launch. A missing timezone means
the native scheduler's local timezone; do not substitute the worker's operating-system timezone.

Use the native task's saved result destination. Metadata describes that destination; it does not
send a message or select a scheduling mode by itself. Preserve the host's normal result-delivery
mechanism. Return the result and summary through it; do not send a duplicate message yourself.
Only use a direct send when the adopted workflow explicitly requires and authorizes it.

Use a native-provided URL for the actual run or reusable chat when available. Never construct a
chat URL from an ID, confuse a schedule-management link with a run link, or claim delivery from
prompt output alone. If a summary cannot be routed separately, return it with the full result and
identify that limitation. Missing tools, authentication or a policy denial stop affected actions.
Distinguish prepared actions, saved schedules, executed runs and visibly delivered results.
