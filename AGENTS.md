# Tanaabot repository guidance

## Scope and voice

This repository prepares tanaabot's Codex Cloud environment. Contributors retain their own trusted
identity and accounts; editing this repository does not select tanaabot's persona or credentials.

Use [Tanaabot Voice](./skills/voice/SKILL.md) for repository prose: courteous, precise and concise,
with normal sentence capitalization. Read the skill before writing; a requested voice takes precedence.

## Implementation

- Keep `tanaboot.sh` as the setup entrypoint, with host and agent modes. Delegate provisioning to
  Bootbox and plugin installation to Codex Tools. Fresh-task Cloud verification remains #5.
- Follow Agent System's manifest and setup YAML formats. Its runtime is not required here.
- Keep installed global guidance in `dotfiles/ai/.codex/AGENTS.md`, separate from contributor guidance.
- Use [Tanaabot Skill Author](./skills/skill-author/SKILL.md) when changing skills. Keep shared
  implementations with Canon and Agent System. Local skills use owner `tanaab`, namespace `tanaabot`
  and the `codex-plugin` container layout.
- Keep package and Codex plugin versions aligned. Maintain explicit npm `files` and Codex Tools
  `managedPaths`; ship regular assets rather than symlinks.
- Keep changes small. Add folders and helpers when they have a concrete owner and use.

## Validation

Use the declared Bun version and `bun install --frozen-lockfile --ignore-scripts`. Run `bun run lint`,
`bun run test` and `git diff --check`. Check changed local links, manifest paths and packed resources.

Follow `examples/AGENTS.md` for repository Leia scenarios. Run scenarios in CI or a
disposable Cloud test environment; developer-machine execution requires explicit authorization.
Report source checks separately from Cloud execution and live installation.

## Change boundaries

Never commit credentials, private account bindings or generated runtime state. Do not run provisioning,
change installed plugin caches or activate schedules as routine validation. Those actions need their
own operator scope.

Preserve unrelated edits. Follow the operator's branch, commit and publication instructions; otherwise
use an isolated branch and do not push without authorization. Issue-backed commit subjects use
`#<issue>: <lowercase description>`.
