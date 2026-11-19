# Tanaabot repository guidance

## Purpose and contributor identity

This repository prepares tanaabot's Codex Cloud environment. Contributors retain their own trusted
identity and accounts; editing this repository does not select tanaabot's persona or credentials.

## Documentation house style

Use [Tanaabot Voice](./skills/voice/SKILL.md) for repository prose: courteous, precise and concise,
with normal sentence capitalization. Read the skill before writing; a requested voice takes precedence.
When authoring a chat card, follow the [shared presentation rules and examples](./prompts/presentation-partial.md)
for headings, quoting, and spacing.

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

3. See [Install](./README.md#install) for local skill loading and separate Canon delivery.
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
   start a fresh chat. Verify startup runs without a
   manual bootstrap prompt and a subsequent request selects and reads the appropriate local skill.
   Record machine readiness, explicit Tanaabot loading and Canon availability separately.
   Guidance readability and saved instructions in the main Dot do not establish automatic loading in Cloud.

   Only during this pre-publication onboarding review, when the install succeeds, Startup Check
   passes and its verified Setup ID matches the ID printed by this install, read
   `cloud_environment_environment_status` before the operator publishes. Keep the current
   `source_config_id` and `source_config_version_id` alongside this Setup ID in the publisher
   chat. Mark unavailable observations as unknown. End the reply with this separate card,
   substituting the verified Setup ID for `<setup-id>`.

   > **📦 NEXT STEP · RECORD PUBLICATION**
   >
   > Click **Publish** (or **Republish** for a rebuild). Once it succeeds, send this
   > command here in the publisher chat.
   >
   > `Record Publication <setup-id>`

Use only the configured Tanaabot SSH key through Bootbox; do not generate a new identity or add inbound
SSH access. Do not add accounts, Agent System binding or schedules during onboarding.
Keep the persistent shell initialization in the shell dotpackage. Do not edit repository sources to
work around setup failures; report them for a coding task.

## Sources of truth

- [Tanaboot](./tanaboot.sh) owns host and agent setup. Keep provisioning in Bootbox and
  revision selection in the [Cloud wrapper](./scripts/cloud-setup.sh).
- [Global guidance](./dotfiles/ai/.codex/AGENTS.md) is installed in the runtime. Top-level
  `instructions/*.md` files hold main-Dot topic guidance. Put detailed procedures in the owning skill.
- [The agent manifest](./.agent-system/agent.yaml) selects the setup declarations and automations.
  Use Agent System’s manifest format and public loader.
- The optional Codex plugin packages the canonical `skills/` tree. Keep the package and plugin
  versions aligned, maintain explicit npm `files` and Codex Tools `managedPaths`, and ship regular files.
- Update [the inventory](./INVENTORY.md) when adding, renaming or removing entries. List each skill
  by its linked base title and each automation by ID. Sort each table by its first column, ignoring case.

## Workflow routing

- Use [Tanaabot Skill Author](./skills/skill-author/SKILL.md) for skill changes. It owns naming,
  packaging and the Canon validator settings.
- Put GitHub worker selection and issue cards in [GitHub guidance](./instructions/github.md).
  Put skill authoring defaults for the main Dot in [Skills guidance](./instructions/skills.md).

## Automation authoring

Read [Automation Sync](./skills/automation-sync/SKILL.md) and its required references before editing
an automation. Use the existing assembler, [execution](./prompts/execution-partial.md) and
[presentation](./prompts/presentation-partial.md) rules.

- Automation Sync owns schedule configuration, worker binding and sidebar placement. Give each
  recurring task its own ID and prompt. Only that task performs its work.
- Keep the definition, prompt and request metadata aligned on schedule, timezone, enabled state and
  execution settings. Use the default `REPORTS` group for results the operator reviews routinely.
  Use `TANAABOT` for maintenance workers.
- State inputs, source, account, authorized actions and resource scope. Specify how to handle
  unchanged results, overlap, missing access and uncertain writes.
- Include a representative worker result and compact linked main-chat summary. Report every run,
  including blocked or failed outcomes. Keep initialization and saved-schedule receipts distinct from run results.

## Test design

Keep JavaScript parsing and planning tests with their owning code. Test shell behavior through
the packaged public command in Leia, using real tools. Cover Tanaabot’s delegation and readiness
contracts. Follow `examples/AGENTS.md` for scenario design and execution.

## Validation

Use the declared Bun version and run:

```sh
bun install --frozen-lockfile --ignore-scripts
bun run lint
bun run test
git diff --check
```

Check changed links and packed resources. Run Leia scenarios in CI or a disposable Cloud environment.
Developer-machine execution requires explicit authorization. Report source checks, saved settings,
live execution and visible delivery separately when applicable.

## Change boundaries

Keep credentials, private account bindings and generated runtime state out of commits. Provisioning,
installed plugin cache changes and schedule activation need their own operator scope.
Preserve unrelated edits. Follow the operator’s branch, commit and publication instructions;
otherwise use an isolated branch and do not push. Issue-backed commit subjects use
`#<issue>: <lowercase description>`.
