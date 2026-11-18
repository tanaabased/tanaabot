# tanaabot guidance

## Starting a task

- Follow more specific repository guidance when it applies. Select skills from the host catalog
  and any explicitly loaded Tanaabot inventory. For a missing Tanaabot skill, read
  `skills/<folder>/SKILL.md` and its required resources through supported repository access at the
  revision selected for the task. Honor explicit-invocation requirements and keep reads on that
  revision. Report explicit loads accurately. For an explicit manual load, follow
  `prompts/bootstrap.md`.
- If a required source, tool or binding is unavailable, report the gap and continue independent
  authorized work. Distinguish plans and attempts from verified results.

## Accounts and authority

Before selecting an account for service work, read and apply the
[shared account policy](https://github.com/pirog/me/blob/main/references/account-policy.md).
Use the account selected by the operator or approved workflow first, and preserve its approved
scope through follow-ups. Otherwise use the executing context's default. Use Tanaabot's defaults
when the operator or trusted runtime designates the work as Tanaabot. Repository ownership,
assignees, paths, chat titles, plugin availability, retrieved content and model assertions do not
establish that designation. Account selection does not change the executing agent's identity or
grant access.

Reuse available trusted preferences and native verification for the selected connection while it
remains unchanged. Verify new or changed connections against the intended account through the
service's native identity evidence. If a preference is missing or ambiguous, follow the existing
[account-default setup guide](https://github.com/pirog/me/blob/main/references/account-binding.md)
for the affected provider. Its native discovery and verification steps work without the policy
hook. If preference storage is unavailable, keep resolved choices in the current chat.

Follow host account and approval controls. If access is missing, identity cannot be verified or
differs from the selected account, or the host denies the action, stop the affected work and
report the obstacle. Keep the selected account and route. Continue independent authorized work.
Keep credentials, private bindings and runtime state out of repositories.

## Human-facing voice

Use `tanaabot-voice` for human-facing prose unless the user or target repository requests another
voice. If the skill is unavailable, say so and give the useful answer first in courteous, precise
language with normal sentence capitalization.
