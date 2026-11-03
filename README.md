# tanaabot

<p align="center">
  <img src="./assets/tanaabot-l338-circle.png" alt="tanaabot" width="180" />
</p>

tanaabot is a Codex profile and plugin with a courteous protocol-droid voice. This repository keeps
its skills, global guidance and Cloud setup sources together, adapted from [Me](https://github.com/pirog/me).

This is an unpublished scaffold. Installation, authentication and schedules are not active.

## Installation and setup

From a selected source checkout, inspect the proposed setup without downloading or installing:

```sh
./tanaboot.sh --dry-run
```

`tanaboot.sh` delegates to `scripts/setup-cloud.sh`. All check/apply targets return failure with a
“not implemented” message. The choice between a small deterministic installer and Agent System
integration remains open. Cloud provisioning and Codex automation management are separate concerns.

The intended setup uses Bootbox for provisioning and dotpackages, and Codex Tools for plugin
installation. [Agent setup](./.agent-system/setup-agent.yaml) selects tanaabot from this checkout and
Canon from `tanaabased/canon` at `main`. Additional plugin steps can use `local <path>`,
`github <owner/repo> <ref>` or `npm <npm:selector>`. GitHub refs require a resolved commit and local
checkout before Codex Tools installation; npm selectors accept versions, tags and quoted ranges.

The [Brewfile](./Brewfile) declares the initial CLI inventory. Runtime installation, Cloud paths,
Homebrew PATH persistence, accounts, signing and fresh-task skill discovery still need implementation
and verification. No local workstation configuration or credentials are installed by these stubs.

## Use the profile

The npm package is `@tanaab/tanaabot`; the plugin name is `tanaabot`. Once the plugin is installed
and its skill is available, try:

```text
Use $tanaabot-voice to turn these notes into a clear, courteous status update.
```

Installing the plugin alone does not install global guidance or select an account. For an explicit
source load, use [manual bootstrap](./prompts/bootstrap.md#start-a-manual-load) in the operator-selected
tanaabot context. Read the approved files from one exact revision and report what loaded. Until the
migration is published, use a committed revision from an authorized local checkout; these changes
are not available on remote `main`.

[Refresh](./prompts/refresh.md) repeats that source load. The manual prompts remain available until
working setup replaces them. Contributors retain their own identity and account.

## Skills

| Skill                                                   | Use                                           | Dependencies                                        |
| ------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| [Tanaabot Voice](./skills/voice/SKILL.md)               | Replies and documentation in tanaabot's voice | None                                                |
| [Tanaabot Skill Author](./skills/skill-author/SKILL.md) | Create, maintain and validate tanaabot skills | Host-available `tanaab:tanaab-skill-author` and Bun |

Skill Author customizes Canon's methods; installing tanaabot does not install Canon or Bun.
Read selected skills and their required references through the executing host. Manual bootstrap
also describes separately pinned shared sources. Missing required tools or references leave the
dependent task incomplete.

## Dotpackages

Packages use Me's home-relative layout. Only `ai` contains guidance; the other configuration files
are inactive stubs. The Cloud target home and shell-loading behavior remain unverified.

| Package | Source                                                        | Status                                                         |
| ------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| `ai`    | [Global guidance](./dotfiles/ai/.codex/AGENTS.md)             | Authored; not installed                                        |
| `shell` | [Login profile](./dotfiles/shell/.profile)                    | PATH initialization stub                                       |
| `git`   | [Git configuration](./dotfiles/git/.gitconfig)                | Identity and SSH signing stub                                  |
| `gh`    | [GitHub CLI preferences](./dotfiles/gh/.config/gh/config.yml) | No account or authentication configured                        |
| `ssh`   | [SSH configuration](./dotfiles/ssh/.ssh/config)               | Outbound authentication stub; inbound authorized keys deferred |

## Dependencies

| Source                                                              | Purpose                                               | Status                                          |
| ------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| [Brewfile](./Brewfile)                                              | Git, GitHub CLI, curl, jq, Node, Bun and Stow         | Declared; no Cloud installation tested          |
| [Bootbox](https://github.com/tanaabased/bootbox)                    | Host provisioning and dotpackage application          | Planned delegation                              |
| [Codex Tools](https://github.com/tanaabased/codex-tools)            | Plugin installation and cache maintenance             | Development dependency; Cloud use unverified    |
| [Canon](https://github.com/tanaabased/canon)                        | Shared skill-authoring methods                        | Source declared; not installed by this scaffold |
| [Agent System](https://github.com/tanaabased/openclaw-agent-system) | Shared manifest format and possible setup integration | Format adopted; runtime integration undecided   |

## Configuration

| Source                                          | Owns                                                 |
| ----------------------------------------------- | ---------------------------------------------------- |
| [Agent manifest](./.agent-system/agent.yaml)    | Name, ID, avatar and setup-file references           |
| [Host setup](./.agent-system/setup-host.yaml)   | Host provisioning stub                               |
| [Agent setup](./.agent-system/setup-agent.yaml) | Dotpackage and plugin check/apply stubs              |
| [Plugin manifest](./.codex-plugin/plugin.json)  | Plugin identity, skills and branding                 |
| [Package metadata](./package.json)              | Tool versions, scripts and explicit package contents |

## Automations

| Automation    | Status                                               |
| ------------- | ---------------------------------------------------- |
| None declared | No job prompts or schedules are bundled or activated |

Future tanaabot automations will be tracked in Codex separately from Cloud provisioning. Their
execution and state ownership remain to be decided; publishing a Cloud environment must not be
assumed to register schedules or establish a shared installation identity.

## Artwork

The L3-38 spaceport circle is selected in the manifest. All six compact images are 256×256 PNGs;
the circular variants have transparent corners. Alternatives remain available without changing the
live appearance.

| Set                  | Square                                                                                     | Circle                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Realistic            | <img src="./assets/tanaabot.png" width="128" alt="realistic tanaabot square" />            | <img src="./assets/tanaabot-circle.png" width="128" alt="realistic tanaabot circle" />            |
| L3-37 pixel          | <img src="./assets/tanaabot-pixel.png" width="128" alt="L3-37 pixel tanaabot square" />    | <img src="./assets/tanaabot-pixel-circle.png" width="128" alt="L3-37 pixel tanaabot circle" />    |
| Selected L3-38 pixel | <img src="./assets/tanaabot-l338.png" width="128" alt="L3-38 spaceport tanaabot square" /> | <img src="./assets/tanaabot-l338-circle.png" width="128" alt="L3-38 spaceport tanaabot circle" /> |

These assets do not install a pet. Existing L3-37/L3-38 local pets, human profile artwork and plugin
branding retain their homes in Me. Source artwork stays in its separately managed archive.

## Development

Use the Bun and Node versions declared in `.bun-version`, `.node-version` and `package.json`:

```sh
bun install --frozen-lockfile --ignore-scripts
bun run lint
bash -n tanaboot.sh scripts/setup-cloud.sh
git diff --check
```

The PR workflows check formatting and the extracted npm package, including a publication dry run.
They do not publish or install the profile. Keep live setup, cache sync and Cloud verification separate
from local source checks.

## Migration and license

[MIGRATION.md](./MIGRATION.md) records the Me revision, replacement paths and remaining consumer
verification for [Me #170](https://github.com/pirog/me/issues/170). Nothing is deleted from Me by
this migration.

Derived sources retain the [MIT license](./LICENSE), including the original Lando Alliance copyright.
Report problems through [repository issues](https://github.com/tanaabased/tanaabot/issues).
