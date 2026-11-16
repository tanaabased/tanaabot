# Inventory

Tanaabot's Codex Cloud sources and their current status. See [Tanaboot](./TANABOOT.md) for setup options.

## Skills

| Skill                                                           | Use                                                                  | Dependencies                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| [Tanaabot Voice](./skills/voice/SKILL.md)                       | Replies and documentation in tanaabot's voice                        | None                                                  |
| [Tanaabot Skill Author](./skills/skill-author/SKILL.md)         | Create, maintain and validate tanaabot skills                        | Discoverable `tanaab-skill-author` and Bun            |
| [Tanaabot Startup Check](./skills/startup-check/SKILL.md)       | Verify a prepared Cloud environment without repairs                  | Prepared Tanaabot source and task catalog             |
| [Spaceport Fortune Cookie](./skills/spaceport-fortune/SKILL.md) | Exercise local skill selection and required-reference loading        | Bundled fortune reference                             |
| [Automation Sync](./skills/automation-sync/SKILL.md)            | Prepare and synchronize hosted schedules from repository definitions | Prepared checkout, Bun and native scheduling controls |

Skill Author customizes Canon's methods. Install Canon separately in your ChatGPT account as described
under [Skills](./TANABOOT.md#skills). Missing required tools or references leave
the dependent task incomplete.

## Dotpackages

Packages use a home-relative layout. `ai` contains guidance and `shell` initializes Homebrew and Node for Bash.
Git, GitHub and SSH configuration remain inactive stubs. Fresh-task Cloud startup remains unverified.

| Package | Source                                                           | Status                                                                      |
| ------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `ai`    | [Global guidance](./dotfiles/ai/.codex/AGENTS.md)                | Applied by agent setup                                                      |
| `shell` | [Shell initialization](./dotfiles/shell/.config/tanaabot/env.sh) | Homebrew and Node PATH; sourced by the active Bash login file and `.bashrc` |
| `git`   | [Git configuration](./dotfiles/git/.gitconfig)                   | Identity and SSH signing stub                                               |
| `gh`    | [GitHub CLI preferences](./dotfiles/gh/.config/gh/config.yml)    | No account or authentication configured                                     |
| `ssh`   | [SSH configuration](./dotfiles/ssh/.ssh/config)                  | Outbound authentication stub; inbound authorized keys deferred              |

## Dependencies

| Source                                                   | Purpose                                      | Status                                                      |
| -------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| [Brewfile](./Brewfile)                                   | Linux Cloud CLI tools and runtimes           | Installation covered on disposable CI runners               |
| [Bootbox](https://github.com/tanaabased/bootbox)         | Host provisioning and dotpackage application | Current hosted script downloaded at setup                   |
| [Codex Tools](https://github.com/tanaabased/codex-tools) | Contributor plugin cache tooling             | Development dependency; not used by Cloud setup             |
| [Canon](https://github.com/tanaabased/canon)             | Shared skill-authoring methods               | Published npm release delivered through the ChatGPT account |

## Plugins

| Surface | Source                                         | Status                  |
| ------- | ---------------------------------------------- | ----------------------- |
| Codex   | [Plugin manifest](./.codex-plugin/plugin.json) | All skills listed above |

The optional Codex plugin ships the same `skills/` sources in `@tanaab/tanaabot`.
Cloud startup explicitly loads the local skills without requiring this plugin's installation.

## Configuration files

| Source                                                     | Owns                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| [Agent manifest](./.agent-system/agent.yaml)               | Name, ID, avatar and setup/automation references            |
| [Automation definitions](./.agent-system/automations.yaml) | Synchronizer and smoke-test schedules and prompt references |
| [Host setup](./.agent-system/setup-host.yaml)              | Host mode check/apply declaration                           |
| [Agent setup](./.agent-system/setup-agent.yaml)            | Agent mode check/apply declaration                          |
| [Plugin manifest](./.codex-plugin/plugin.json)             | Plugin identity, skills and branding                        |
| [Package metadata](./package.json)                         | Tool versions, scripts and explicit package contents        |

## Automations

| Automation          | Status                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| `sync`              | Bundled and disabled; native scheduling pilot pending                      |
| `smoke-test`        | Bundled and disabled; first-line canary update prepared                    |
| `smoke-test-canary` | Enabled ten-minute pilot definition; live activation and execution pending |

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
