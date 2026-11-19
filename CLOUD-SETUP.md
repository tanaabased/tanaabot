# Cloud setup

[Cloud setup](./scripts/cloud-setup.sh) selects which revision of tanaabot to install in Codex Cloud.
Use it when the **Install script** should follow a branch or release, or reproduce an exact commit.
To install the revision already checked out, run [Tanaboot](./TANABOOT.md) directly.

- [Usage](#usage)
- [Arguments](#arguments)
  - [`REF`](#ref)
  - [`TANABOOT_OPTIONS`](#tanaboot_options)
- [CLI options](#cli-options)
  - [`--debug`](#--debug)
  - [`-h`, `--help`](#-h---help)

## Usage

`bash scripts/cloud-setup.sh [--debug] REF [TANABOOT_OPTIONS...]`

Run from a clean checkout of `tanaabased/tanaabot`. The script fetches the selected commit,
its history and tags, then runs that commit’s Tanaboot with a detached HEAD.

```sh
# install the main branch
bash scripts/cloud-setup.sh main

# follow the repository’s default branch
bash scripts/cloud-setup.sh dev

# install the latest stable release
bash scripts/cloud-setup.sh stable

# pin an exact commit
bash scripts/cloud-setup.sh aa071acd28147cac88a2b04f0ccd867df5ffa1d2

# preview host setup for a release tag (replace v1.0.0 with an existing tag)
bash scripts/cloud-setup.sh v1.0.0 --host --dry-run

# trace revision selection and show the selected installer’s help
bash scripts/cloud-setup.sh --debug edge --help

# show help for the wrapper itself
bash scripts/cloud-setup.sh --help
```

## Arguments

### `REF`

Required. Select the source revision by channel, name or commit.

| Value        | Revision                                                       |
| ------------ | -------------------------------------------------------------- |
| `dev`        | Tip of the repository’s default branch.                        |
| `stable`     | Regular GitHub release marked **Latest**.                      |
| `edge`       | Most recently published GitHub release, including prereleases. |
| `BRANCH`     | Tip of the named branch.                                       |
| `TAG`        | Commit identified by the named tag.                            |
| `COMMIT_SHA` | Exact commit identified by its full 40-character SHA.          |

Use the full commit SHA if a branch and tag share a name or the name is reserved by a channel.
If GitHub confirms a release channel is empty, setup falls back to `dev`. A failed lookup stops setup.

### `TANABOOT_OPTIONS`

Optional. Arguments after `REF` go to the selected revision’s Tanaboot. You can put `--` immediately
after `REF` to mark the start of its options.

```sh
# preview host setup
bash scripts/cloud-setup.sh main --host --dry-run

# check the agent configuration
bash scripts/cloud-setup.sh main -- --agent --check
```

See [Tanaboot CLI options](./TANABOOT.md#cli-options) for all supported flags and environment defaults.

## CLI options

Cloud setup options go **before** `REF`.

### `--debug`

| Field       | Value                                                            |
| ----------- | ---------------------------------------------------------------- |
| Environment | `CLOUD_SETUP_DEBUG`, then `DEBUG`, then `RUNNER_DEBUG`           |
| Default     | Off                                                              |
| Values      | Flag or truthy environment value                                 |
| Description | Trace revision selection, fetch and installer handoff on stderr. |

### `-h`, `--help`

Print Cloud setup usage and exit. No checkout is required. Set `CLOUD_SETUP_HELP=1` for the same result.
