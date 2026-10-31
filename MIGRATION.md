# migration from Me

this is the replacement-path and consumer handoff for [Me #170](https://github.com/pirog/me/issues/170).
see the [README](./README.md) for using this profile. cleanup remains blocked until the committed
replacement sources and their affected consumers are verified; this document does not authorize
source deletion.

## source and attribution

seeded from committed objects in [`pirog/me`](https://github.com/pirog/me) at
`c3f04253e69c6aa2e2c1b5c1c2bb4dc2bce2c5f2`. no working-tree or ignored files were copied; Me's unrelated
`TASKS.md` edit is excluded. the existing tanaabot README and canonical issue forms started at
`57e51af10c3356af6cdb73d9898492f7268b0807`. issue forms are retained unchanged.

[LICENSE](./LICENSE) preserves Me's MIT text and original `Copyright (c) 2025 Lando Alliance` notice.
the bot source, compact images and repository configuration derive from that snapshot. no Me Git
history, generated distribution archive or separately managed source-artwork archive is imported.

this seed is delivered as a local commit for operator review, without a push or PR. identify the
commit containing this mapping in the task's delivery report, or inspect it locally:

```sh
git log -1 --format='%H %s' -- MIGRATION.md
```

## bot source mapping

all thirteen tracked files under Me's `tanaabot/` are accounted for:

| Me source                                        | replacement                                                                        | treatment                           |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------- |
| `tanaabot/AGENTS.md`                             | [`profile/AGENTS.md`](./profile/AGENTS.md)                                         | adapted paths and source boundaries |
| `tanaabot/README.md`                             | [`README.md`](./README.md)                                                         | merged and adapted                  |
| `tanaabot/assets/tanaabot-circle.png`            | [`assets/tanaabot-circle.png`](./assets/tanaabot-circle.png)                       | unchanged bytes                     |
| `tanaabot/assets/tanaabot-l338-circle.png`       | [`assets/tanaabot-l338-circle.png`](./assets/tanaabot-l338-circle.png)             | unchanged bytes                     |
| `tanaabot/assets/tanaabot-l338.png`              | [`assets/tanaabot-l338.png`](./assets/tanaabot-l338.png)                           | unchanged bytes                     |
| `tanaabot/assets/tanaabot-pixel-circle.png`      | [`assets/tanaabot-pixel-circle.png`](./assets/tanaabot-pixel-circle.png)           | unchanged bytes                     |
| `tanaabot/assets/tanaabot-pixel.png`             | [`assets/tanaabot-pixel.png`](./assets/tanaabot-pixel.png)                         | unchanged bytes                     |
| `tanaabot/assets/tanaabot.png`                   | [`assets/tanaabot.png`](./assets/tanaabot.png)                                     | unchanged bytes                     |
| `tanaabot/automations/appearance-sync/prompt.md` | [`automations/appearance-sync/prompt.md`](./automations/appearance-sync/prompt.md) | adapted paths and source boundaries |
| `tanaabot/manifest.yaml`                         | [`manifest.yaml`](./manifest.yaml)                                                 | adapted paths and source boundaries |
| `tanaabot/prompts/bootstrap.md`                  | [`prompts/bootstrap.md`](./prompts/bootstrap.md)                                   | adapted paths and source boundaries |
| `tanaabot/prompts/refresh.md`                    | [`prompts/refresh.md`](./prompts/refresh.md)                                       | adapted paths and source boundaries |
| `tanaabot/voice.md`                              | [`profile/voice.md`](./profile/voice.md)                                           | adapted paths and source boundaries |

`profile/AGENTS.md` is scoped opt-in cloud guidance; root `AGENTS.md` is adapted from Me's contributor,
source-ownership and validation guidance. the profile is not automatically selected for contributors.
manifest version 2 moves its guidance and asset references and removes version 1's parent `skills_dir`.
bootstrap, refresh and appearance-sync now consume the new repository and paths together.

## retained and excluded scaffold

| source group in Me                                                                                             | disposition here                                                                                                                |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `LICENSE`, `.editorconfig`, `.bun-version`                                                                     | copied unchanged                                                                                                                |
| `.gitattributes`, `.gitignore`, `prettier.config.js`, `.prettierignore`                                        | adapted for this source repository; retain credential/runtime exclusions                                                        |
| `package.json`, Bun lockfile, `.github/workflows/pr-linter.yml`                                                | reduced to a private development package with formatting checks and read-only PR lint; lockfile regenerated                     |
| root `AGENTS.md`                                                                                               | adapted for contributor identity, source owners, boundaries and validation                                                      |
| `boot.sh`, `PIROBOOT.md`, `Brewfile*`, `dotfiles/`, `lib/`, `scripts/setup.js` and other machine setup helpers | excluded: personal-machine bootstrap/self-install is not a cloud profile source dependency                                      |
| `.agent-system/`, `.codex-plugin/`, `.mcp.json`, `.node-version`, cache-sync and package publication settings  | excluded: personal identity, desired automation, plugin and host integration stay with their owners                             |
| `skills/`, root personal `assets/`, `references/`                                                              | remain in Me/Piroplugin; no renamed skill fork or copied personal artwork                                                       |
| `GOALS.md`, `TASKS.md`, `CHANGELOG.md`, `INVENTORY.md`, `site/`, `netlify.toml`, `dist/`                       | excluded: personal planning, historical release/distribution and machine inventory do not describe this project                 |
| remaining workflows, examples and tests                                                                        | excluded: they verify or publish Me bootstrap/setup/plugin behavior absent here; no inert test or release scaffolding is copied |

Piroboot is deliberately omitted rather than renamed. nothing here calls machine bootstrap, repairs
the live Codex installation, reconciles automations or changes an account. shared skill dependencies
use their existing owners and validators, not copied implementations. Me/Piroplugin skill sources
were inspected at the source revision above; selected skills and upstream dependencies must still
be explicitly available or independently pinned for each manual run, as described by
[bootstrap](./prompts/bootstrap.md#selected-shared-skills).

## compact asset checksums

these SHA-256 hashes match the committed Me originals exactly:

```text
fc88de0c96f6255e3f55a73ec8201a9bea0fa1ee8330dc2080baff4d6a13f5ac  assets/tanaabot-circle.png
08c3ef54996425fb0fa7149bb051a3c47b3bff54643ad34f33ce235b2467ad14  assets/tanaabot-l338-circle.png
e07ba925f200047990715d14d4525d3955f0daea187548ab5b6933bfc61fd1bf  assets/tanaabot-l338.png
1f0f2c6cbf3deee194ee23da176adafc10ab602889a6fb98c9fd3d0ec6e88e65  assets/tanaabot-pixel-circle.png
55ec461300cc4374caf608c4b576c0c1f0ad89a991814269f65908d470e138ae  assets/tanaabot-pixel.png
4bb7cb4aee477d6f5836970294636cc26920be5113b05a2edf601ea10b9e4422  assets/tanaabot.png
```

all six PNGs must decode at 256×256. the manifest selects `assets/tanaabot-l338-circle.png`; circular
variants retain their original alpha channel and transparent corners. the selected image is desired
source artwork, not proof of an uploaded avatar or registered pet.

## consumers and cleanup gate

| consumer                                                                                                                  | migration evidence and remaining action                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| this README, manifest, profile guidance, bootstrap, refresh and appearance-sync prompt                                    | updated together; local links/anchors, manifest targets and PNG decode/hash checks passed in the seed checkout                                                                                                                                                                |
| designated tanaabot cloud context                                                                                         | unverified here; after the revision is available, the operator or separately authorized cloud pilot must explicitly load it and retain the repository/full SHA, exact files read, asset decode and dependency results; verify refresh in a fresh context before recurring use |
| shared `piro-*` skills and their Canon/Agent System dependencies                                                          | remain externally owned; verify actual selected skill/reference/helper availability in the consuming host; no automatic installation or fresh-context discovery is claimed                                                                                                    |
| Me root `AGENTS.md` pointer to `tanaabot/AGENTS.md`                                                                       | unchanged in Me; #170 must redirect it to the new guidance after the replacement revision and its consumers are verified                                                                                                                                                      |
| Me `dotfiles/ai/.codex/pets/l337/`, `pets/l338/` and `config.shared.toml`'s `custom:l338` selection                       | separate local pet consumers; untouched and retained, not replaced by these compact images                                                                                                                                                                                    |
| Me assignment policy mentioning `@tanaabot`, historical changelog, example/test identities, Piroplugin/global integration | not obsolete bot source files; retain unless their separate owner establishes a change is needed                                                                                                                                                                              |
| source-artwork archive, cloud IDs, private account bindings and applied state                                             | outside this migration; not copied, changed or verified                                                                                                                                                                                                                       |

local source checks can establish file integrity and the correctness of references; they do not prove
cloud loading, live account selection, appearance application, durable state or schedule activation.
Me #170 must retain its readiness block while those required consumer checks are unresolved. the
retired Me #131 pilot is historical context, not a substitute for current proof. no cleanup or
publication is performed by this local seed.

the local seed passed `bun install --frozen-lockfile --ignore-scripts`, `bun run lint` and
`git diff --check`. focused source inspection also checked manifest/workflow YAML, read-only workflow
permissions, local links and anchors, all thirteen mappings, six decoded 256×256 PNGs with unchanged
SHA-256 hashes, the original license and unchanged issue forms. the shared source entrypoints in Me,
Canon and Agent System were readable; that does not establish their installation in a cloud host.
there is no application/runtime test suite in this source-only seed. hosted CI and cloud loading
have not run; installation, live appearance, account changes and schedules were intentionally not
exercised.
