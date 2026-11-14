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
- [Automations](./INVENTORY.md#automations): Current inventory; none declared yet.

## Install

To run the installer yourself, use a Tanaabot source checkout on 64-bit Linux as its non-root user:

```sh
bash tanaboot.sh
```

This installs the current checkout's tools, guidance and shell configuration. Install Tanaabot and
Canon separately through the [workspace marketplace](./TANABOOT.md#workspace-plugins).
See [Tanaboot](./TANABOOT.md) for prerequisites, previews and recovery.

To create a reusable Codex Cloud environment, select this repository at `main` and ask the setup
agent to follow [Cloud environment onboarding](./AGENTS.md#cloud-environment-onboarding). Review the
setup result, publish the environment and start a fresh task to verify it.

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
