# Inventory

What ships with tanaabot and where to find it.

## Dependencies

Tanaboot installs the command-line tools and runtimes listed in the [Brewfile](./Brewfile).

## Dotpackages

Packages use a home-relative layout. `ai` contains guidance and `shell` initializes Homebrew and Node for Bash.
Agent setup also applies Git, GitHub and SSH configuration, retrieves the approved SSH key and
refreshes the private 1Password Environment file.

| Package | Source                                                           | Status                                                                                       |
| ------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ai`    | [Global guidance](./dotfiles/ai/.codex/AGENTS.md)                | Applied by agent setup                                                                       |
| `gh`    | [GitHub CLI preferences](./dotfiles/gh/.config/gh/config.yml)    | HTTPS protocol; authentication uses the separate `GH_TOKEN` environment value                |
| `git`   | [Git configuration](./dotfiles/git/.gitconfig)                   | Tanaabot identity, SSH signing and approved signer trust                                     |
| `shell` | [Shell initialization](./dotfiles/shell/.config/tanaabot/env.sh) | Homebrew, Node PATH and saved environment exports; sourced by Bash login files and `.bashrc` |
| `ssh`   | [SSH configuration](./dotfiles/ssh/.ssh/config)                  | Approved key for outbound SSH; no inbound authorized keys                                    |

## Automations

| Automation                                          | Purpose                                                                                                                                | Worker group |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| [`automation-sync`](./prompts/automation-sync.md)   | Creates or updates the Dot’s schedules and verifies their worker bindings against the repository definitions.                          | `TANAABOT`   |
| [`cloud-update`](./prompts/cloud-update.md)         | Checks the account’s Canon plugin for updates, applies an available stable release and reports the Cloud environment’s startup status. | `REPORTS`    |
| [`instruction-sync`](./prompts/instruction-sync.md) | Compares the Dot’s saved instructions with the repository and proposes changes for operator approval.                                  | `TANAABOT`   |

## Artwork

`composer-icon.svg` is the small cyan outline; `icon-large.png` is the large skill and plugin image.
`icon-large-circle.png` is the profile avatar.

The L3-38 spaceport circle is selected in the manifest. The compact raster images are 256×256 PNGs;
the circular variants have transparent corners. Alternatives remain available without changing the
live appearance.

| Set                  | Square                                                                                  | Circle                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| L3-37 pixel          | <img src="./assets/tanaabot-pixel.png" width="128" alt="L3-37 pixel tanaabot square" /> | <img src="./assets/tanaabot-pixel-circle.png" width="128" alt="L3-37 pixel tanaabot circle" /> |
| Realistic            | <img src="./assets/tanaabot.png" width="128" alt="realistic tanaabot square" />         | <img src="./assets/tanaabot-circle.png" width="128" alt="realistic tanaabot circle" />         |
| Selected L3-38 pixel | <img src="./assets/icon-large.png" width="128" alt="L3-38 spaceport tanaabot square" /> | <img src="./assets/icon-large-circle.png" width="128" alt="L3-38 spaceport tanaabot circle" /> |

## Skills

| Skill                                                           | Use                                                                  | Dependencies                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [Automation Sync](./skills/automation-sync/SKILL.md)            | Prepare and synchronize hosted schedules from repository definitions | Prepared checkout, Bun and native scheduling controls            |
| [Instruction Report](./skills/instruction-report/SKILL.md)      | Inspect accessible instructions and their evidence without changes   | Available read-only instruction sources                          |
| [Instruction Sync](./skills/instruction-sync/SKILL.md)          | Propose main-Dot instruction changes and verify approved saves       | Main Dot's native instruction controls and repository access     |
| [Record Publication](./skills/record-publication/SKILL.md)      | Record the source policy after the operator publishes a setup        | Publisher chat, local setup receipt and ambient GitHub CLI token |
| [Skill Author](./skills/skill-author/SKILL.md)                  | Create, maintain and validate tanaabot skills                        | Discoverable `tanaab-skill-author` and Bun                       |
| [Spaceport Fortune Cookie](./skills/spaceport-fortune/SKILL.md) | Exercise local skill selection and required-reference loading        | Bundled fortune reference                                        |
| [Startup Check](./skills/startup-check/SKILL.md)                | Verify a prepared Cloud environment without repairs                  | Prepared Tanaabot source and task catalog                        |
| [Voice](./skills/voice/SKILL.md)                                | Replies and documentation in tanaabot's voice                        | None                                                             |

## Configuration files

| Source                                                     | Owns                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| [Agent manifest](./.agent-system/agent.yaml)               | Name, ID, avatar and setup/automation references     |
| [Agent setup](./.agent-system/setup-agent.yaml)            | Agent mode check/apply declaration                   |
| [Automation definitions](./.agent-system/automations.yaml) | Automation schedules and prompt references           |
| [Host setup](./.agent-system/setup-host.yaml)              | Host mode check/apply declaration                    |
| [Package metadata](./package.json)                         | Tool versions, scripts and explicit package contents |
| [Plugin manifest](./.codex-plugin/plugin.json)             | Plugin identity, skills and branding                 |
| [PostgreSQL guidance](./instructions/postgresql.md)        | Database command and execution instructions          |
