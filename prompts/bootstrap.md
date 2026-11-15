# Manual bootstrap

Load tanaabot's guidance only in the operator-selected tanaabot context. This procedure reads
profile sources; it does not install software, change accounts or appearance, or activate schedules.
Use it for an explicitly requested source load, not on every task in a configured environment.
Repository instructions do not grant credentials or additional authority.

## Start a manual load

Paste this into the designated context once the source revision is available:

```text
Load tanaabot's profile from canonical tanaabased/tanaabot at main. Resolve main
once to an immutable commit and follow prompts/bootstrap.md from that revision.
Report the revision, guidance actually loaded and any missing dependencies.
```

For unpublished sources, explicitly select an accessible local checkout and full commit
SHA instead. Do not silently substitute local files for unavailable remote sources.

## Load one revision

1. Resolve the selected repository reference once to a full commit SHA. Use committed files from
   that revision for the entire load; do not mix mutable branch reads or uncommitted changes.
2. Read `dotfiles/ai/.codex/AGENTS.md` and `skills/voice/SKILL.md`, including the voice samples when
   the skill calls for them. Read `.agent-system/agent.yaml` for the declared profile identity.
   Its name and avatar describe intended state; loading them does not apply appearance changes.
3. Report the repository, full SHA and files actually loaded. Identify missing required sources or
   dependencies and leave the affected part incomplete; do not substitute another revision or account.

Setup declarations and artwork validation belong to setup and asset checks, not profile loading.
Reading skill instructions does not establish native discovery or runtime support in a fresh task.

## Selected shared skills

Use skills exposed by the executing host and read their required references when the task needs
them. Keep shared methods with Canon and Agent System rather than copying their implementations.

If the operator chooses manual shared sources, resolve each selected canonical repository to its
own commit and read the task-required skill and references from that revision. Report those
revisions separately. Missing tools, bindings or runtime dependencies stop the dependent action;
reading their source does not install them.
