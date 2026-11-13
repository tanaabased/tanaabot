# Tanaabot repository guidance

## Scope and voice

This repository prepares tanaabot's Codex Cloud environment. Contributors retain their own trusted
identity and accounts; editing this repository does not select tanaabot's persona or credentials.

Use [Tanaabot Voice](./skills/voice/SKILL.md) for repository prose: courteous, precise and concise,
with normal sentence capitalization. Read the skill before writing; a requested voice takes precedence.

## Cloud environment onboarding

When the operator creates a Cloud environment from this repository, prepare the Tanaabot runtime:
its Linux tools, global guidance, Tanaabot plugin and Canon plugin. A development-only environment
is a separate, explicitly requested use case. Dependency installation and lint alone do not complete
Tanaabot onboarding.

1. Prepare network access before running installation. This environment uses **Enable all public
   internet access**. Use the Cloud onboarding tools to propose that setting, preserving other
   configuration, and direct the operator to review and save it. Verify the running environment's
   observed network policy and access to `https://bootbox.tanaab.sh/bootbox.sh` after saving. A saved
   draft alone does not prove the policy was applied. If access still fails, report the blocker and
   resume after the environment is refreshed; do not publish an incomplete installation.
2. Use the existing Tanaabot checkout. Read [Tanaboot usage](./TANABOOT.md#usage), then run and record
   this as the environment's Install script from the checkout root:

   ```sh
   bash scripts/cloud-setup.sh main --codex-plugin canon#main
   ```

   The wrapper selects and reports the exact `main` revision. Tanaboot owns host provisioning through
   the latest hosted Bootbox script and plugin installation through Codex Tools. These are the
   intended setup operations when the operator requests this environment; do not substitute a
   development-tool bootstrap or stop after `bun install` and lint.

3. Read and apply `.agents/skills/tanaabot-startup-check/SKILL.md` from this checkout. Configure the
   environment's Start skill to invoke `$tanaabot-startup-check` and follow that repository skill.
   It reuses Tanaboot's checks and reports actual guidance and skill discovery. It is repository-only
   and must not be installed as part of the Tanaabot plugin.
4. Verify the installation and report the resolved Tanaabot and Canon revisions and any failed
   checks. Tanaboot requires a non-root Linux user and the prerequisites in its usage guide. Report
   an incompatible execution user, missing prerequisite or network failure instead of silently
   changing the environment's purpose or creating another installer.
5. Present the successful installation and check results for operator review before publication.
   A saved Install script or a runnable environment does not establish installation success. Never
   recommend publishing after a failed install. After publication, verify the
   Start skill in a fresh task and record tool paths, automatically loaded guidance and native skill
   discovery there. Installation and enabled-plugin state alone do not prove fresh-task discovery.

Do not add accounts, authentication, SSH access, Agent System binding or schedules during onboarding.
Keep the persistent shell initialization in the shell dotpackage. Do not edit repository sources to
work around setup failures; report them for a coding task.

## Contributor implementation

- Keep `tanaboot.sh` as the setup entrypoint, with host and agent modes. Bootstrap missing Homebrew
  with its official installer in the user's home, then delegate provisioning to Bootbox without
  sudo and plugin installation to Codex Tools.
- Follow Agent System's manifest and setup YAML formats. Its runtime is not required here.
- Keep installed global guidance in `dotfiles/ai/.codex/AGENTS.md`, separate from contributor guidance.
- Use [Tanaabot Skill Author](./skills/skill-author/SKILL.md) when changing skills. Keep shared
  implementations with Canon and Agent System. Local skills use owner `tanaab`, namespace `tanaabot`
  and the `codex-plugin` container layout under `skills/`. Repository-only skills live under
  `.agents/skills/` with the `standalone` layout and `tanaabot-`-prefixed folder names.
- Keep package and Codex plugin versions aligned. Maintain explicit npm `files` and Codex Tools
  `managedPaths`; ship regular assets rather than symlinks.
- Keep changes small. Add folders and helpers when they have a concrete owner and use.

## Contributor validation

These commands are for developing and changing this repository. They are not the Cloud environment's
Install script or Start skill and do not replace the runtime onboarding above.

Use the declared Bun version and `bun install --frozen-lockfile --ignore-scripts`. Run `bun run lint`
and `git diff --check`. Check changed local links, manifest paths and packed resources.

Follow `examples/AGENTS.md` for repository Leia scenarios. Run scenarios in CI or a
disposable Cloud test environment; developer-machine execution requires explicit authorization.
Report source checks separately from Cloud execution and live installation.

## Change boundaries

Never commit credentials, private account bindings or generated runtime state. Outside an
operator-requested Cloud onboarding run, do not provision or change installed plugin caches as
routine contributor validation. Schedule activation always needs its own operator scope.

Preserve unrelated edits. Follow the operator's branch, commit and publication instructions; otherwise
use an isolated branch and do not push without authorization. Issue-backed commit subjects use
`#<issue>: <lowercase description>`.
