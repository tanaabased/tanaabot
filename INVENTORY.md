# Inventory

Tanaabot's Codex Cloud sources and their current status. See [Tanaboot](./TANABOOT.md) for setup options.

## Skills

| Skill                                                   | Use                                           | Dependencies                                        |
| ------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| [Tanaabot Voice](./skills/voice/SKILL.md)               | Replies and documentation in tanaabot's voice | None                                                |
| [Tanaabot Skill Author](./skills/skill-author/SKILL.md) | Create, maintain and validate tanaabot skills | Host-available `tanaab:tanaab-skill-author` and Bun |

Skill Author customizes Canon's methods. The standard agent setup installs Canon from `main`
through `--codex-plugin canon#main`. Missing required tools or references leave the dependent task incomplete.

## Dotpackages

Packages use a home-relative layout. `ai` contains guidance and `shell` initializes Homebrew and Node for Bash.
Git, GitHub and SSH configuration remain inactive stubs. Fresh-task Cloud discovery remains unverified.

| Package | Source                                                           | Status                                                         |
| ------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| `ai`    | [Global guidance](./dotfiles/ai/.codex/AGENTS.md)                | Applied by agent setup                                         |
| `shell` | [Shell initialization](./dotfiles/shell/.config/tanaabot/env.sh) | Homebrew and Node PATH; sourced by `.profile` and `.bashrc`    |
| `git`   | [Git configuration](./dotfiles/git/.gitconfig)                   | Identity and SSH signing stub                                  |
| `gh`    | [GitHub CLI preferences](./dotfiles/gh/.config/gh/config.yml)    | No account or authentication configured                        |
| `ssh`   | [SSH configuration](./dotfiles/ssh/.ssh/config)                  | Outbound authentication stub; inbound authorized keys deferred |

## Dependencies

| Source                                                   | Purpose                                      | Status                                         |
| -------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| [Brewfile](./Brewfile)                                   | Linux Cloud CLI tools and runtimes           | Installation covered on disposable CI runners  |
| [Bootbox](https://github.com/tanaabased/bootbox)         | Host provisioning and dotpackage application | Current hosted script downloaded at setup      |
| [Codex Tools](https://github.com/tanaabased/codex-tools) | Plugin installation and cache maintenance    | Runtime dependency; installation covered in CI |
| [Canon](https://github.com/tanaabased/canon)             | Shared skill-authoring methods               | Selected from main by agent setup              |

## Plugins

| Surface | Source                                         | Status                        |
| ------- | ---------------------------------------------- | ----------------------------- |
| Codex   | [Plugin manifest](./.codex-plugin/plugin.json) | Voice and skill-author skills |

The Codex plugin ships in `@tanaab/tanaabot`; installed-host behavior remains unverified.

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
`icon-large-circle.png` is the profile avatar.

The L3-38 spaceport circle is selected in the manifest. The compact raster images are 256×256 PNGs;
the circular variants have transparent corners. Alternatives remain available without changing the
live appearance.

| Set                  | Square                                                                                  | Circle                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Realistic            | <img src="./assets/tanaabot.png" width="128" alt="realistic tanaabot square" />         | <img src="./assets/tanaabot-circle.png" width="128" alt="realistic tanaabot circle" />         |
| L3-37 pixel          | <img src="./assets/tanaabot-pixel.png" width="128" alt="L3-37 pixel tanaabot square" /> | <img src="./assets/tanaabot-pixel-circle.png" width="128" alt="L3-37 pixel tanaabot circle" /> |
| Selected L3-38 pixel | <img src="./assets/icon-large.png" width="128" alt="L3-38 spaceport tanaabot square" /> | <img src="./assets/icon-large-circle.png" width="128" alt="L3-38 spaceport tanaabot circle" /> |

These assets do not install a pet. Source artwork stays in its separately managed archive.
