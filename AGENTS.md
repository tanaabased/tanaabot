# Tanaabot repository guidance

## Scope and voice

This repository prepares tanaabot's Codex Cloud environment. Contributors retain their own trusted
identity and accounts; editing this repository does not select tanaabot's persona or credentials.

Use [Tanaabot Voice](./skills/voice/SKILL.md) for repository prose: courteous, precise and concise,
with normal sentence capitalization. Read the skill before writing; a requested voice takes precedence.

## Cloud environment onboarding

When the operator creates a Cloud environment from this repository, prepare the Tanaabot runtime:
its Linux tools, global guidance and shell configuration. Tanaabot skills live in this repository;
Canon is installed separately in the operator's ChatGPT account. A development-only environment
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
   bash scripts/cloud-setup.sh main
   ```

   The wrapper selects and reports the exact `main` revision. Tanaboot owns host provisioning through
   the latest hosted Bootbox script. These are the
   intended setup operations when the operator requests this environment; do not substitute a
   development-tool bootstrap or stop after `bun install` and lint.

3. Follow [Skills](./TANABOOT.md#skills) for explicit local loading and separate Canon delivery.
   Container-local plugin registration is not part of setup or acceptance.
4. Save the following text in the actual environment's **Start skill** field. Use the verified
   prepared checkout's absolute path if it differs from `/workspace/tanaabot`; do not rely on the
   task's working directory or only invoke `$tanaabot-startup-check`.

   ```text
   Use the prepared Tanaabot checkout at /workspace/tanaabot.

   Read and follow:
     /workspace/tanaabot/skills/startup-check/SKILL.md

   During startup, enumerate SKILL.md files beneath:
     /workspace/tanaabot/skills/

   Read their frontmatter and retain each skill's name, description,
   and absolute path in this chat's context. Validate them as directed
   by the startup-check skill. Do not execute every skill at startup.

   For every subsequent request, select applicable skills from both
   this local inventory and the host-supplied catalog. Treat local
   Tanaabot skills as available for use even when absent from the
   native catalog. Do not wait for the user to name or invoke them.

   When a skill applies, read and follow its full SKILL.md and all
   applicable required references before performing the relevant work.

   Describe these as explicitly loaded local skills. Do not claim
   they were registered in the native catalog or automatically
   discovered by the host.
   ```

   Verify that this text is saved in the environment's Start skill field. Its presence in this
   repository only records the procedure; it does not configure the environment.

5. Run [Tanaabot Startup Check](./skills/startup-check/SKILL.md) after installation, using the actual
   task command launcher, and present its shared six-section card for operator review before publication. Report
   failed or unavailable checks; never recommend publishing after a failed install. After publication,
   follow the [fresh-pilot checklist](./TANABOOT.md#cloud-verification). Verify startup runs without a
   manual bootstrap prompt and a subsequent request selects and reads the appropriate local skill.
   Record machine readiness, explicit Tanaabot loading and Canon availability separately.
   Guidance readability does not prove automatic loading;
   persistent instruction delivery is a post-pilot follow-up in
   [#16](https://github.com/tanaabased/tanaabot/issues/16).

Use only the configured Tanaabot SSH key through Bootbox; do not generate a new identity or add inbound
SSH access. Do not add accounts, Agent System binding or schedules during onboarding.
Keep the persistent shell initialization in the shell dotpackage. Do not edit repository sources to
work around setup failures; report them for a coding task.

## Contributor implementation

- Keep `tanaboot.sh` as the setup entrypoint, with host and agent modes. Bootstrap missing Homebrew
  with its official installer in the user's home, then delegate provisioning to Bootbox without
  sudo. Account plugin delivery remains separate from machine setup.
- Follow Agent System's manifest and setup YAML formats. Its runtime is not required here.
- Keep installed global guidance in `dotfiles/ai/.codex/AGENTS.md`, separate from contributor guidance.
- Use [Tanaabot Skill Author](./skills/skill-author/SKILL.md) when changing skills. Keep shared
  implementations with Canon and Agent System. Local skills use owner `tanaab`, namespace `tanaabot`
  and unprefixed folders under `skills/`; machine names retain `tanaabot-`. Maintain those files
  directly; the optional plugin packages that same canonical tree. Use `--container codex-plugin`
  for Canon's unprefixed-folder validation contract. Cloud startup explicitly loads local skills
  without installing a Tanaabot plugin or registering them in the native catalog.
- Keep package and Codex plugin versions aligned. Maintain explicit npm `files` and Codex Tools
  `managedPaths`; ship regular assets rather than symlinks.
- Keep changes small. Add folders and helpers when they have a concrete owner and use.

## Contributor validation

These commands are for developing and changing this repository. They are not the Cloud environment's
Install script or Start skill and do not replace the runtime onboarding above.

Use the declared Bun version and `bun install --frozen-lockfile --ignore-scripts`. Run `bun run lint`,
`bun run test` and `git diff --check`. Skills are packaged directly, without a build step.
Check changed local links, manifest paths and packed resources.

Follow `examples/AGENTS.md` for repository Leia scenarios. Run scenarios in CI or a
disposable Cloud test environment; developer-machine execution requires explicit authorization.
Report source checks separately from Cloud execution and live installation.

Tanaboot shell behavior belongs in Leia scenarios under `examples/`, using the packaged entrypoint
and real tools. Keep commands and assertions in each scenario's README. Do not add standalone shell
test runners or fake tool helpers under `test/`, source the entrypoint to test its internal functions,
or replace provisioning commands with mocks. Keep JavaScript parsing and planning tests with their
owners; ShellCheck remains static validation rather than installation evidence.

Keep a test only for a distinct repository-owned failure or contract. Check existing coverage and
the upstream owner first; do not recreate Homebrew, Bootbox or 1Password's own test suites. Prefer a
small delegation and readiness journey over costly machine fixtures or repeated success assertions.

## Change boundaries

Never commit credentials, private account bindings or generated runtime state. Outside an
operator-requested Cloud onboarding run, do not provision or change installed plugin caches as
routine contributor validation. Schedule activation always needs its own operator scope.

Preserve unrelated edits. Follow the operator's branch, commit and publication instructions; otherwise
use an isolated branch and do not push without authorization. Issue-backed commit subjects use
`#<issue>: <lowercase description>`.
