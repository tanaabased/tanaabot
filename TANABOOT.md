# Tanaboot

[Tanaboot](./tanaboot.sh) installs the Linux tools, Git signing identity, shell configuration and
global Codex guidance that tanaabot uses to run tasks.

> [!NOTE]
> Run Tanaboot from a Tanaabot checkout. Keep the checkout in place because the installed dotfiles
> link back to it. For a Codex Cloud **Install script**, use [Cloud setup](./CLOUD-SETUP.md).

- [Usage](#usage)
- [CLI options](#cli-options)
  - [`--host`](#--host)
  - [`--agent`](#--agent)
  - [`--check`](#--check)
  - [`--dry-run`](#--dry-run)
  - [`--op-token`](#--op-token)
  - [`--debug`](#--debug)
  - [`--version`](#--version)
  - [`-h`, `--help`](#-h---help)

## Usage

Run setup as a non-root user on 64-bit Linux with a writable home, Bash, Git, curl, jq and the
[Homebrew build prerequisites](https://docs.brew.sh/Homebrew-on-Linux#requirements).

```sh
# preview the default setup
./tanaboot.sh --dry-run

# install host tools and agent configuration
./tanaboot.sh

# verify the installation offline from a fresh shell
./tanaboot.sh --check
```

Exit status is `0` on success, `1` for setup or readiness failures, and `2` for invalid arguments.
If a previous run left a setup lock, confirm its process has stopped before removing it.

## CLI options

By default, Tanaboot installs the host tools, then configures the agent. Choose at most one mode
(`--host` or `--agent`) and one action (`--check` or `--dry-run`). An explicit option overrides
environment defaults in its group. With no explicit choice, enable at most one setting per group.
Use `1` to enable a flag or `0` to leave it off.

### `--host`

| Field       | Value                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------- |
| Environment | `TANABOOT_HOST`                                                                                 |
| Default     | Included in a full install                                                                      |
| Values      | Flag                                                                                            |
| Description | Install only the host tools. Bootbox provisions the dependencies in the [Brewfile](./Brewfile). |

Tanaboot reuses an existing Homebrew installation. Otherwise it installs Homebrew without sudo
in `~/.linuxbrew` (maximum prefix length: 26 bytes).

### `--agent`

| Field       | Value                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Environment | `TANABOOT_AGENT`                                                                                                                           |
| Default     | Included in a full install                                                                                                                 |
| Values      | Flag                                                                                                                                       |
| Description | Link the [dotpackages](./INVENTORY.md#dotpackages), install the approved SSH signing key and load the saved 1Password environment in Bash. |

Install the host tools first. GitHub uses HTTPS for transport. Resolve any reported key or dotfile
conflict before retrying.

### `--check`

| Field       | Value                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Environment | `TANABOOT_CHECK`                                                                                                                                                  |
| Default     | Off                                                                                                                                                               |
| Values      | Flag                                                                                                                                                              |
| Description | Check the selected mode offline. Host checks use the current `PATH`. Agent checks also verify linked configuration, the key, exported variables and Bash startup. |

### `--dry-run`

| Field       | Value                                                          |
| ----------- | -------------------------------------------------------------- |
| Environment | `TANABOOT_DRY_RUN`                                             |
| Default     | Off                                                            |
| Values      | Flag                                                           |
| Description | Print the setup plan without downloading or changing anything. |

### `--op-token`

| Field       | Value                                                                                  |
| ----------- | -------------------------------------------------------------------------------------- |
| Environment | `TANABOOT_OP_TOKEN`, then `OP_SERVICE_ACCOUNT_TOKEN`                                   |
| Default     | Unset                                                                                  |
| Values      | 1Password service account token                                                        |
| Description | Read the approved SSH key and the configured 1Password Environment during agent setup. |

Supply the token privately for the first install. Help shows which source supplied it. A rerun
without a token can reuse a matching key and valid saved environment.

### `--debug`

| Field       | Value                                                                        |
| ----------- | ---------------------------------------------------------------------------- |
| Environment | `TANABOOT_DEBUG`, then `DEBUG`, then `RUNNER_DEBUG`                          |
| Default     | Off                                                                          |
| Values      | Flag or truthy environment value                                             |
| Description | Write diagnostics to stderr. The flag takes precedence over the environment. |

### `--version`

Print the running script version and exit. Environment equivalent: `TANABOOT_VERSION=1`.

### `-h`, `--help`

Print usage, public options and environment variables, then exit. Environment equivalent: `TANABOOT_HELP=1`.
