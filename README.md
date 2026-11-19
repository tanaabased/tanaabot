# tanaabot

<p align="center">
  <img src="./assets/icon-large-circle.png" alt="tanaabot" width="180" />
</p>

<p align="center">
  <a href="https://github.com/tanaabased/tanaabot/releases"><img src="https://img.shields.io/github/v/release/tanaabased/tanaabot?include_prereleases&sort=semver" alt="Latest release" /></a>
  <img src="https://img.shields.io/badge/Linux-64--bit-111827" alt="64-bit Linux" />
  <img src="https://img.shields.io/badge/Codex-tanaabot-00c88a" alt="Codex plugin: tanaabot" />
</p>

tanaabot is a custom Codex Dot for managed and scheduled tasks. This repository defines its identity,
instructions, tools, skills and schedules. It works primarily in its own Codex Cloud environment and
speaks with the courtesy of a protocol droid and a little grandmotherly concern.

## What ships

- [Identity](./.agent-system/agent.yaml) defines the Dot’s name and avatar.
- The [global guidance](./dotfiles/ai/.codex/AGENTS.md) and [topic instructions](./instructions) are the source for the Dot’s saved instructions.
- [Tanaboot](./TANABOOT.md) installs the [tools](./INVENTORY.md#dependencies) and [dotpackages](./INVENTORY.md#dotpackages). [Cloud setup](./CLOUD-SETUP.md) selects the revision to install.
- The [skills](./INVENTORY.md#skills) are also available as an installable [Codex plugin](./.codex-plugin/plugin.json).
- The [automations](./INVENTORY.md#automations) define the Dot’s scheduled tasks.

## Prerequisites

Startup Check requires Canon skills in the ChatGPT account that runs tanaabot. To install Canon,
open ChatGPT in that personal account and paste this prompt into a chat with **Plugin Creator**.

```text
Install Tanaab Canon as a private personal plugin in this ChatGPT account.
If my Canon plugin is already installed, show me its link and version.
Otherwise, import the stable npm release of @tanaab/canon tagged latest.
Preserve its tanaab namespace, skills and supporting files. Verify the saved
version and give me the plugin link and any remaining enablement step.
```

In a fresh chat, ask “Is `tanaab-skill-author` available in this chat’s skill catalog?”

## Install

1. Create a Codex Cloud environment named `tanaabot` from `tanaabased/tanaabot` on `main`. Ask the builder to follow [Cloud environment onboarding](./AGENTS.md#cloud-environment-onboarding).
2. Review and save **Enable all public internet access**. In the Cloud environment settings, open **Edit environment variables**, add `OP_SERVICE_ACCOUNT_TOKEN` with your 1Password service account token as its value, and save it before the first install.
3. The builder should automatically configure the **Install script** and **Start skill** from the repository’s onboarding instructions. The Install script prepares the environment, and the Start skill loads the checkout’s Tanaabot skills into each new chat.
4. When **Startup Check** passes, click **Publish**. After publication succeeds, copy the `Record Publication <setup-id>` command from the **📦 NEXT STEP · RECORD PUBLICATION** card into the same builder chat. It includes this install’s Setup ID.
5. Verify startup in a fresh chat in the published environment, then [seed Automation Sync](#first-time-setup) in the main Tanaabot Dot.

> [!NOTE]
> A manual install on your own Linux machine is unsupported. See [Tanaboot](./TANABOOT.md) for the installer and its options.

## First-time setup

Paste this prompt into the main Tanaabot Dot after recording the publication.

```text
Read and follow skills/automation-sync/SKILL.md and its required references
from the latest main revision of https://github.com/tanaabased/tanaabot.

First, synchronize only automation-sync in the published tanaabot Cloud
environment. Verify the saved schedule, dispatcher prompt and worker binding.
If any of those checks fails, stop and tell me what needs attention.

Once verified, invoke Automation Sync manually from this Dot with selection
all, once. Apply and verify the repository’s schedules and report the result.
```

## Worker chat

The Dot uses worker chats for some automations and other operations. To pick up a newly published
Cloud environment, archive the worker chat after its current run finishes and wait for the Dot to
recreate it.

## Contributing

The following commands prepare contributors to edit and validate the repository. Cloud runtime
setup follows the onboarding instructions above.

Use the runtimes declared in [`.bun-version`](./.bun-version) and [`.node-version`](./.node-version):

```sh
bun install --frozen-lockfile --ignore-scripts
bun run lint
bun run test
```

The [Leia examples](https://github.com/tanaabased/tanaabot/tree/main/examples) exercise the packaged installer and optional Codex plugin on disposable CI runners.

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
