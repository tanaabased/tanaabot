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
- [Dotpackages](./INVENTORY.md#dotpackages): Global guidance and runtime configuration.
- [Skills](./INVENTORY.md#skills): Voice, skill authoring, startup checks and instruction reporting/sync.
- [Configuration files](./INVENTORY.md#configuration-files): Setup declarations and Codex plugin sources.
- [Automations](./INVENTORY.md#automations): Scheduled automation inventory.

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

Follow the [Cloud rollout steps](./TANABOOT.md#cloud-verification), then paste this into the
designated tanaabot dot to seed or update the synchronizer:

```text
Read and follow skills/automation-sync/SKILL.md and its required references
from the latest main revision of https://github.com/tanaabased/tanaabot.

Synchronize only automation-sync in the existing published Tanaabot Cloud
environment. Verify the saved schedule, dispatcher and worker binding, then
report the result and stop without running the automation.
```

After verifying the saved synchronizer, select **Run now** on **🤖 AUTOMATION SYNC** for the full sync.

The [definitions](./.agent-system/automations.yaml) enable `automation-sync` at midnight and both
`cloud-update` and `instruction-sync` at 1 a.m. in the native scheduler’s timezone (Eastern for this deployment).
Existing schedules retain their saved timezone. Sync updates itself first and leaves unchanged
tasks alone. A final best-effort desktop pass places workers in their configured sidebar sections.
Workers receive configuration and run-results cards, and the main chat receives compact linked
summaries. Debug is opt-in through `debug: true` in
[agent.yaml](./.agent-system/agent.yaml), followed by synchronization.

Cloud Update reports the Canon result, then runs Startup Check for the worker’s current status report.

## Inspect or refresh saved instructions

In the main tanaabot Dot, ask it to read and follow
[`skills/instruction-report/SKILL.md`](./skills/instruction-report/SKILL.md) from a resolved
repository revision for a read-only inventory, or
[`skills/instruction-sync/SKILL.md`](./skills/instruction-sync/SKILL.md) to propose a refresh.
Use supported repository reads if these skills are absent from the host catalog.
The separate [Instruction Sync automation](./prompts/instruction-sync.md) runs the
read-only comparison. To save a change, approve the exact proposal in a later main-chat reply.
Unchanged checks need no approval.

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
