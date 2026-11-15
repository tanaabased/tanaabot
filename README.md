# tanaabot

<p align="center">
  <img src="./assets/icon-large-circle.png" alt="tanaabot" width="180" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/environment-Codex_Cloud-00c88a" alt="Environment: Codex Cloud" />
  <a href="https://github.com/tanaabased/tanaabot/issues/5"><img src="https://img.shields.io/badge/status-Cloud_verification_pending-00ebfd" alt="Status: Cloud verification pending" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-111827" alt="License: MIT" /></a>
</p>

tanaabot prepares a Codex Cloud environment with its tools, guidance and skills for managed and
scheduled tasks. Its assistant has a courteous protocol-droid voice, with a little grandmotherly concern.

Tanaboot provisions its source checkout through Bootbox. Fresh-task Cloud verification
remains pending in [#5](https://github.com/tanaabased/tanaabot/issues/5).

## What ships

- [Tanaboot](./TANABOOT.md): The setup entrypoint, with host and agent modes.
- [Dependencies](./INVENTORY.md#dependencies): The Brewfile and shared provisioning tools.
- [Dotpackages](./INVENTORY.md#dotpackages): Global guidance and configuration stubs.
- [Skills](./INVENTORY.md#skills): Tanaabot Voice, Skill Author and Startup Check.
- [Configuration files](./INVENTORY.md#configuration-files): Setup declarations and Codex plugin sources.
- [Automations](./INVENTORY.md#automations): Synchronizer and smoke-test definitions, initially paused.

## Install

To run the installer yourself, use a Tanaabot source checkout on 64-bit Linux as its non-root user:

```sh
bash tanaboot.sh
```

This installs the current checkout's tools, guidance and shell configuration. Tanaabot skills live
in `skills/` and are loaded explicitly by the environment's Start skill. Canon is delivered separately
through your ChatGPT account. See [Skills](./TANABOOT.md#skills) for startup configuration.
See [Tanaboot](./TANABOOT.md) for prerequisites, previews and recovery.

To create a reusable Codex Cloud environment, select this repository at `main` and ask the setup
agent to follow [Cloud environment onboarding](./AGENTS.md#cloud-environment-onboarding). Review the
setup result, publish the environment and start a fresh task to verify it.

## Synchronize scheduled tasks

Paste this into the designated tanaabot dot for an initial seed or a later manual update:

```text
Use the existing Tanaabot Cloud environment. Refresh canonical tanaabased/tanaabot
from GitHub main into a clean source checkout without discarding existing edits.
Report the resolved commit, read skills/automation-sync/SKILL.md and its required
references from that checkout, and synchronize all declared automations.

Keep the existing approved account scope. Use the reusable per-automation Cloud
chats in REPORTS, with titles matching their authored display names. Return one compact
summary card per automation, each in a separate message to this main chat. Use “Go to chat →”
for verified worker links, including native Codex deep links, and keep detailed results in
those worker chats. Use the
native scheduling controls; if unavailable in Cloud, return the prepared task
objects here for application through this dot's supported controls. Do not claim
the handoff saved schedules. The definitions are disabled: save them paused. If creation
always starts active, create each once, immediately pause its returned native ID, and
verify the final paused state. Do not leave tasks active or manually run a pilot.
```

The skill installs the checkout's locked dependencies and prepares Agent System's public manifest
loader from its temporary GitHub `main` dependency. It combines the
[definitions](./.agent-system/automations.yaml), task prompts and shared metadata, execution and
[presentation partials](./prompts/automations/partials/presentation.md), then updates
changed native tasks and leaves unchanged ones alone. Shared-guidance changes update affected tasks.
Names are generated as 🤖 plus the uppercase display name. The daily schedules use the native
scheduler's local timezone: midnight for sync and 00:15 for smoke, with no timezone override.
Keep smoke paused outside an authorized test window.
Tanaabot defaults to its published Cloud environment and reusable chats under `REPORTS`;
per-automation environment, thread and group overrides use the shared Agent System schema.
Native Cloud scheduling access, smoke output and unattended synchronization still require the
separately authorized live pilot tracked in [#8](https://github.com/tanaabased/tanaabot/issues/8).

## Contributing

The following commands prepare contributors to edit and validate the repository. Cloud runtime
setup follows the onboarding instructions above.

Use the runtimes declared in [`.bun-version`](./.bun-version) and [`.node-version`](./.node-version):

```sh
bun install --frozen-lockfile --ignore-scripts
bun run lint
```

Lint runs ESLint, Prettier and ShellCheck. The [Leia examples](https://github.com/tanaabased/tanaabot/tree/main/examples) exercise the packaged CLI, revision selection, failure handling and Linux setup in CI; fresh-task
Cloud verification remains pending.

The [release workflow](https://github.com/tanaabased/tanaabot/blob/main/.github/workflows/release.yml) publishes independently to npm and the
repository. Before the first release, configure npm trusted publishing and grant the repository
access to `TANAAB_COAXIUM_INJECTOR`. See [CHANGELOG.md](./CHANGELOG.md)
for unreleased changes.

## Support

Report bugs and requests through [GitHub issues](https://github.com/tanaabased/tanaabot/issues/new/choose).

## Maintainers

- [@pirog](https://github.com/pirog)

## Contributors

<a href="https://github.com/tanaabased/tanaabot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tanaabased/tanaabot" alt="Contributors" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## License

[MIT](./LICENSE).
