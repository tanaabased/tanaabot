# Migration from Me

This is the replacement-path and consumer handoff for [Me #170](https://github.com/pirog/me/issues/170).
See the [README](./README.md) for using this profile. Cleanup remains blocked until the committed
replacement sources and their affected consumers are verified; this document does not authorize
source deletion.

## Source and attribution

Seeded from committed objects in [`pirog/me`](https://github.com/pirog/me) at
`c3f04253e69c6aa2e2c1b5c1c2bb4dc2bce2c5f2`. No working-tree or ignored files were copied; Me's unrelated
`TASKS.md` edit is excluded. The existing tanaabot README and canonical issue forms started at
`57e51af10c3356af6cdb73d9898492f7268b0807`. Issue forms are retained unchanged.

[LICENSE](./LICENSE) preserves Me's MIT text and original `Copyright (c) 2025 Lando Alliance` notice.
The bot source, compact images and repository configuration derive from that snapshot. No Me Git
history, generated distribution archive or separately managed source-artwork archive is imported.

This seed is delivered as a local commit for operator review, without a push or PR. Identify the
commit containing this mapping in the task's delivery report, or inspect it locally:

```sh
git log -1 --format='%H %s' -- MIGRATION.md
```

## Bot source mapping

All thirteen tracked files under Me's `tanaabot/` are accounted for:

| Me source                                        | Replacement                                                              | Treatment                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------- |
| `tanaabot/AGENTS.md`                             | [`dotfiles/ai/.codex/AGENTS.md`](./dotfiles/ai/.codex/AGENTS.md)         | Adapted paths and source boundaries       |
| `tanaabot/README.md`                             | [`README.md`](./README.md)                                               | Merged and adapted                        |
| `tanaabot/assets/tanaabot-circle.png`            | [`assets/tanaabot-circle.png`](./assets/tanaabot-circle.png)             | Unchanged bytes                           |
| `tanaabot/assets/tanaabot-l338-circle.png`       | [`assets/tanaabot-l338-circle.png`](./assets/tanaabot-l338-circle.png)   | Unchanged bytes                           |
| `tanaabot/assets/tanaabot-l338.png`              | [`assets/tanaabot-l338.png`](./assets/tanaabot-l338.png)                 | Unchanged bytes                           |
| `tanaabot/assets/tanaabot-pixel-circle.png`      | [`assets/tanaabot-pixel-circle.png`](./assets/tanaabot-pixel-circle.png) | Unchanged bytes                           |
| `tanaabot/assets/tanaabot-pixel.png`             | [`assets/tanaabot-pixel.png`](./assets/tanaabot-pixel.png)               | Unchanged bytes                           |
| `tanaabot/assets/tanaabot.png`                   | [`assets/tanaabot.png`](./assets/tanaabot.png)                           | Unchanged bytes                           |
| `tanaabot/automations/appearance-sync/prompt.md` | Removed during pass 3                                                    | Appearance sync deferred to its own issue |
| `tanaabot/manifest.yaml`                         | [`.agent-system/agent.yaml`](./.agent-system/agent.yaml)                 | Converted to Agent System format          |
| `tanaabot/prompts/bootstrap.md`                  | [`prompts/bootstrap.md`](./prompts/bootstrap.md)                         | Adapted paths and source boundaries       |
| `tanaabot/prompts/refresh.md`                    | [`prompts/refresh.md`](./prompts/refresh.md)                             | Adapted paths and source boundaries       |
| `tanaabot/voice.md`                              | [`skills/voice/SKILL.md`](./skills/voice/SKILL.md)                       | Adapted into tanaabot's voice skill       |

`dotfiles/ai/.codex/AGENTS.md` is the global guidance source in the `ai` dotpackage; root `AGENTS.md` is adapted from Me's contributor,
source-ownership and validation guidance. The profile is not automatically selected for contributors.
The initial seed used a custom version 2 manifest. The scaffold review replaces it with
`.agent-system/agent.yaml` using Agent System's `schema-version: 1`, `agent.id`, `agent.name` and
`agent.avatar`, plus references to host/agent setup files, initially empty and now declaring explicit failing stubs. Guidance remains explicit in the
loading prompt; the custom appearance key and `skills_dir` are not carried into the shared schema.
Bootstrap and refresh consume the updated paths and fields together. The appearance-sync prompt
was removed during pass 3; the selected avatar remains unchanged.

The scaffold review also moves `profile/voice.md` into `skills/voice/`. Root and global guidance now
select tanaabot's own voice for replies and repository prose. The skill includes Codex display metadata,
illustrative samples and a regular-file copy of the selected avatar; shared authoring methods remain
with Canon. `skills/skill-author/` adds tanaabot's own customization of Canon Skill Author, following
Me's pattern without copying its implementation. The Codex plugin bundles both skills and the
global guidance source; native discovery, global installation and Cloud loading still need separate
verification. The global file uses host skill discovery so installation does not break resource links.

## Retained and excluded scaffold

| Source group in Me                                                                                | Disposition here                                                                                                                  |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `LICENSE`, `.editorconfig`, `.bun-version`                                                        | Copied unchanged                                                                                                                  |
| `.gitattributes`, `.gitignore`, `prettier.config.js`, `.prettierignore`                           | Adapted for this source repository; retain credential/runtime exclusions                                                          |
| `package.json`, Bun lockfile, `.github/workflows/pr-linter.yml`                                   | Initially formatting-only; now an explicit npm plugin payload with development tooling and read-only PR checks                    |
| Root `AGENTS.md`                                                                                  | Adapted for contributor identity, source owners, boundaries and validation                                                        |
| `boot.sh`, `PIROBOOT.md`, `Brewfile*`, `lib/`, `scripts/setup.js` and other machine setup helpers | Excluded: personal-machine bootstrap/self-install is not a Cloud profile source dependency                                        |
| `dotfiles/ai/.codex/AGENTS.md`                                                                    | Moved from `profile/AGENTS.md` during pass 3; home-relative source only, no installation performed                                |
| `.agent-system/`                                                                                  | Tanaabot manifest and check/apply stubs added during scaffold review; Me identity, routing and schedules not copied               |
| `.codex-plugin/`, `.node-version`, cache-sync and package publication settings                    | Added during plugin scaffolding with tanaabot's own identity and artwork; no install or publication performed                     |
| `.mcp.json`                                                                                       | Omitted; the voice skill does not require an MCP server                                                                           |
| `skills/`, root personal `assets/`, `references/`                                                 | Shared implementations and personal artwork remain with their owners; tanaabot voice and authoring customizations are local       |
| `GOALS.md`, `TASKS.md`, `CHANGELOG.md`, `INVENTORY.md`, `site/`, `netlify.toml`, `dist/`          | Excluded: personal planning, historical release/distribution and machine inventory do not describe this project                   |
| Remaining workflows, examples and tests                                                           | Me-specific behavior excluded; a package-validation workflow now checks tanaabot's extracted npm artifact and publication dry run |

The remaining scaffold adds a CLI-only `Brewfile` and inactive `shell`, `git`, `gh` and `ssh`
dotpackages. These adapt the folder convention without importing personal configuration, keys or
accounts. Setup execution and Codex automation ownership remain undecided.

Piroboot is not copied wholesale. `tanaboot.sh` and `scripts/setup-cloud.sh` scaffold Bootbox
provisioning and Codex Tools installation, with plugin sources declared in agent setup. They preview
intent but fail check/apply requests until implemented; nothing here installs, repairs live Codex,
reconciles automations or changes an account. Shared skill dependencies
use their existing owners and validators, not copied implementations. Me/Piroplugin skill sources
were inspected at the source revision above; selected skills and upstream dependencies must still
be explicitly available or independently pinned for each manual run, as described by
[bootstrap](./prompts/bootstrap.md#selected-shared-skills).

## Compact asset checksums

These SHA-256 hashes match the committed Me originals exactly:

```text
fc88de0c96f6255e3f55a73ec8201a9bea0fa1ee8330dc2080baff4d6a13f5ac  assets/tanaabot-circle.png
08c3ef54996425fb0fa7149bb051a3c47b3bff54643ad34f33ce235b2467ad14  assets/tanaabot-l338-circle.png
e07ba925f200047990715d14d4525d3955f0daea187548ab5b6933bfc61fd1bf  assets/tanaabot-l338.png
1f0f2c6cbf3deee194ee23da176adafc10ab602889a6fb98c9fd3d0ec6e88e65  assets/tanaabot-pixel-circle.png
55ec461300cc4374caf608c4b576c0c1f0ad89a991814269f65908d470e138ae  assets/tanaabot-pixel.png
4bb7cb4aee477d6f5836970294636cc26920be5113b05a2edf601ea10b9e4422  assets/tanaabot.png
```

All six PNGs must decode at 256×256. The manifest selects `assets/tanaabot-l338-circle.png`; circular
variants retain their original alpha channel and transparent corners. The selected image is desired
source artwork, not proof of an uploaded avatar or registered pet.

## Consumers and cleanup gate

| Consumer                                                                                                                  | Migration evidence and remaining action                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| This README, manifest, global guidance, bootstrap and refresh                                                             | Updated together; local links/anchors, manifest targets and PNG decode/hash checks passed in the seed checkout                                                                                                                                                                |
| Designated tanaabot Cloud context                                                                                         | Unverified here; after the revision is available, the operator or separately authorized Cloud pilot must explicitly load it and retain the repository/full SHA, exact files read, asset decode and dependency results; verify refresh in a fresh context before recurring use |
| Shared Canon/Agent System skills and dependencies                                                                         | Remain externally owned; verify actual selected skill/reference/helper availability in the consuming host; no automatic installation or fresh-context discovery is claimed                                                                                                    |
| Me root `AGENTS.md` pointer to `tanaabot/AGENTS.md`                                                                       | Unchanged in Me; #170 must redirect it to the new guidance after the replacement revision and its consumers are verified                                                                                                                                                      |
| Me `dotfiles/ai/.codex/pets/l337/`, `pets/l338/` and `config.shared.toml`'s `custom:l338` selection                       | Separate local pet consumers; untouched and retained, not replaced by these compact images                                                                                                                                                                                    |
| Me assignment policy mentioning `@tanaabot`, historical changelog, example/test identities, Piroplugin/global integration | Not obsolete bot source files; retain unless their separate owner establishes a change is needed                                                                                                                                                                              |
| Source-artwork archive, Cloud IDs, private account bindings and applied state                                             | Outside this migration; not copied, changed or verified                                                                                                                                                                                                                       |

Local source checks can establish file integrity and the correctness of references; they do not prove
Cloud loading, live account selection, appearance application, durable state or schedule activation.
Me #170 must retain its readiness block while those required consumer checks are unresolved. The
retired Me #131 pilot is historical context, not a substitute for current proof. No cleanup or
publication is performed by this local seed.

The local seed passed `bun install --frozen-lockfile --ignore-scripts`, `bun run lint` and
`git diff --check`. Focused source inspection also checked manifest/workflow YAML, read-only workflow
permissions, local links and anchors, all thirteen mappings, six decoded 256×256 PNGs with unchanged
SHA-256 hashes, the original license and unchanged issue forms. The shared source entrypoints in Me,
Canon and Agent System were readable; that does not establish their installation in a Cloud host.
There is no application/runtime test suite in this source-only seed. Hosted CI and Cloud loading
have not run; installation, live appearance, account changes and schedules were intentionally not
exercised.
