# Inventory

Tanaabot's Codex Cloud sources and their current status. See [Tanaboot](./TANABOOT.md) for setup options.

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

Packages use a home-relative layout. Only `ai` contains guidance; the other configuration files
are inactive stubs. The Cloud target home and shell-loading behavior remain unverified.

| Package | Source                                                        | Status                                                         |
| ------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| `ai`    | [Global guidance](./dotfiles/ai/.codex/AGENTS.md)             | Authored; not installed                                        |
| `shell` | [Login profile](./dotfiles/shell/.profile)                    | PATH initialization stub                                       |
| `git`   | [Git configuration](./dotfiles/git/.gitconfig)                | Identity and SSH signing stub                                  |
| `gh`    | [GitHub CLI preferences](./dotfiles/gh/.config/gh/config.yml) | No account or authentication configured                        |
| `ssh`   | [SSH configuration](./dotfiles/ssh/.ssh/config)               | Outbound authentication stub; inbound authorized keys deferred |

## Dependencies

| Source                                                              | Purpose                                       | Status                                          |
| ------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| [Brewfile](./Brewfile)                                              | Git, GitHub CLI, curl, jq, Node, Bun and Stow | Declared; no Cloud installation tested          |
| [Bootbox](https://github.com/tanaabased/bootbox)                    | Host provisioning and dotpackage application  | Planned delegation                              |
| [Codex Tools](https://github.com/tanaabased/codex-tools)            | Plugin installation and cache maintenance     | Development dependency; Cloud use unverified    |
| [Canon](https://github.com/tanaabased/canon)                        | Shared skill-authoring methods                | Source declared; not installed by this scaffold |
| [Agent System](https://github.com/tanaabased/openclaw-agent-system) | Shared manifest and setup metadata format     | Format adopted; runtime not required            |

## Plugins

| Surface  | Source                                                                 | Status                                                    |
| -------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| Codex    | [Plugin manifest](./.codex-plugin/plugin.json)                         | Voice and skill-author skills                             |
| OpenClaw | [Plugin manifest](./openclaw.plugin.json) and [entrypoint](./index.js) | Skills declared; runtime registration is a no-op scaffold |

Both surfaces ship in `@tanaab/tanaabot`. The native plugin targets OpenClaw `2026.10.6` or newer;
installed-host behavior remains unverified.

## Configuration files

| Source                                          | Owns                                                 |
| ----------------------------------------------- | ---------------------------------------------------- |
| [Agent manifest](./.agent-system/agent.yaml)    | Name, ID, avatar and setup-file references           |
| [Host setup](./.agent-system/setup-host.yaml)   | Host mode check/apply declaration                    |
| [Agent setup](./.agent-system/setup-agent.yaml) | Agent mode check/apply declaration                   |
| [Plugin manifest](./.codex-plugin/plugin.json)  | Plugin identity, skills and branding                 |
| [Package metadata](./package.json)              | Tool versions, scripts and explicit package contents |

## Automations

| Automation    | Status                                               |
| ------------- | ---------------------------------------------------- |
| None declared | No job prompts or schedules are bundled or activated |

## Artwork

`composer-icon.svg` is the small cyan outline; `icon-large.png` is the large skill and plugin image.
`icon-large-circle.png` is the profile avatar. ClawHub's `icon.png` is a regular copy of the large image.

The L3-38 spaceport circle is selected in the manifest. The compact raster images are 256×256 PNGs;
the circular variants have transparent corners. Alternatives remain available without changing the
live appearance.

| Set                  | Square                                                                                  | Circle                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Realistic            | <img src="./assets/tanaabot.png" width="128" alt="realistic tanaabot square" />         | <img src="./assets/tanaabot-circle.png" width="128" alt="realistic tanaabot circle" />         |
| L3-37 pixel          | <img src="./assets/tanaabot-pixel.png" width="128" alt="L3-37 pixel tanaabot square" /> | <img src="./assets/tanaabot-pixel-circle.png" width="128" alt="L3-37 pixel tanaabot circle" /> |
| Selected L3-38 pixel | <img src="./assets/icon-large.png" width="128" alt="L3-38 spaceport tanaabot square" /> | <img src="./assets/icon-large-circle.png" width="128" alt="L3-38 spaceport tanaabot circle" /> |

These assets do not install a pet. Source artwork stays in its separately managed archive.
