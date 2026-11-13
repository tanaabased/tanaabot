# Tanaboot

Use [`tanaboot.sh`](./tanaboot.sh) to provision its source checkout in a Linux Codex Cloud setup.

## Usage

From a source checkout:

```sh
./tanaboot.sh --codex-plugin canon#main
```

For Cloud workspace revision selection, use the separate [Cloud wrapper](./scripts/cloud-setup.sh)
from the existing workspace:

```sh
bash scripts/cloud-setup.sh main --codex-plugin canon#main
bash scripts/cloud-setup.sh v0.1.0 --host
bash scripts/cloud-setup.sh <full-commit-sha> --agent --codex-plugin canon#main
```

The required first argument selects a canonical `tanaabased/tanaabot` branch, tag or full commit SHA.
The wrapper fetches that commit, checks it out directly in the workspace, and runs its `tanaboot.sh`
with the remaining arguments unchanged.
A modified workspace, unexpected origin, missing reference or branch/tag collision fails without
selecting another revision. Use a full SHA to resolve a name collision. Tanaboot itself has no
revision flag and creates no second Tanaabot checkout.

The wrapper is only for Cloud startup; the host and agent setup declarations invoke Tanaboot directly.
In the Cloud setup script area, use the first command above when the workspace contains the wrapper.
For a revision without it, download the wrapper before selecting that revision:

```sh
set -e
wrapper="$(mktemp)"
trap 'rm -f "$wrapper"' EXIT
curl -fsSL https://raw.githubusercontent.com/tanaabased/tanaabot/main/scripts/cloud-setup.sh -o "$wrapper"
bash "$wrapper" main --codex-plugin canon#main
```

Setup requires 64-bit Linux, a non-root user, a writable home, and Bash, Git, curl and jq.
Guidance currently targets `~/.codex`; a different `CODEX_HOME` is rejected. Bootbox provisions its
standard foundation, including 1Password CLI, plus the [Brewfile](./Brewfile). Authentication, secret
retrieval, SSH and identity setup are deferred. Tanaboot downloads the current hosted
`https://bootbox.tanaab.sh/bootbox.sh` on each setup or check. Node and Bun must satisfy the selected revision's
runtime declarations; Tanaboot checks Node and Bun against their declared major versions.

The default mode installs host dependencies before agent guidance and the Tanaabot plugin.
The standard command and declared agent setup also select Canon from `main` through
`--codex-plugin canon#main`. Direct callers select additional plugins explicitly. Agent mode requires the
host tools first. Keep the workspace while using its installed guidance and plugin. Additional Git
plugins use one directory per repository under `${XDG_DATA_HOME:-$HOME/.local/share}/tanaabot/sources`;
an existing checkout at a different commit is a conflict, not an automatic update. Existing configuration conflicts fail without forced
replacement. Preserve conflicting files or local edits, resolve the reported conflict, then retry.
Do not remove a lock until you have confirmed that its setup or acquisition process has stopped.

```sh
# Preview the current checkout without downloads or changes
./tanaboot.sh --dry-run

# Install or check the current source checkout
./tanaboot.sh --host
./tanaboot.sh --agent
./tanaboot.sh --check
```

`--check` downloads the latest hosted Bootbox for its core check but does not install. It checks
Homebrew, Node and Bun on the caller's effective PATH before any activation, then checks fresh
non-interactive, login and interactive Bash discovery for agent setup. Persistent PATH initialization
lives in the shell dotpackage; setup appends its loader to the first readable Bash login file
(`.bash_profile`, `.bash_login`, then `.profile`) and `.bashrc`, preserving their other contents.
It does not configure other command launchers; verify the actual Cloud shell before adding wiring.

A successful check establishes installed guidance and enabled-plugin state, not native skill discovery
or automatically loaded guidance. Include Git `--codex-plugin` selections to inspect their retained
sources and installed/enabled state. Symbolic refs such as `canon#main` check the installed commit
without resolving today's upstream ref; explicit full SHAs must match. npm selectors are install inputs;
inspect those installations through Codex Tools or the native Codex CLI.
When passed through the Cloud wrapper, `--check` and `--dry-run` apply to Tanaboot after workspace
checkout; use Tanaboot directly for an offline preview without changing the workspace.

## Additional Codex plugins

Repeat `--codex-plugin` to select additional plugins:

```sh
./tanaboot.sh --codex-plugin npm:@tanaab/codex-tools@1.0.3 --codex-plugin canon#main
./tanaboot.sh --agent --codex-plugin canon#<full-commit-sha>
```

`npm:` sources pass unchanged to Codex Tools, which selects the package version, tag or range.
For source installs, use a `tanaabased` repository name with an optional `#branch`, `#tag` or
`#commit`; omitted refs use `main`. Tanaboot reports and retains the resolved checkout, then passes
it to Codex Tools. The checkout must already contain its installable plugin resources.

## Options

| Option               | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `--codex-plugin SRC` | Install an additional Codex plugin; repeat for multiple sources. |
| `--host`             | Select host dependencies only.                                   |
| `--agent`            | Select guidance, shell initialization and Codex plugins only.    |
| `--check`            | Check setup and selected Git plugins without installing.         |
| `--dry-run`          | Preview without network access or changes.                       |
| `--debug`            | Enable wrapper diagnostics on stderr.                            |
| `--version`          | Print the running script version.                                |
| `-h`, `--help`       | Print usage and options.                                         |

Choose at most one mode and one action. `TANABOOT_DEBUG` supplies the debug default, falling back
to `DEBUG`, then `RUNNER_DEBUG`. `TANABOOT_CODEX_PLUGIN` supplies comma-separated plugin defaults;
one or more `--codex-plugin` options replace that list. Explicit CLI selection takes precedence.

Normal output goes to stdout; diagnostics go to stderr. Output respects `NO_COLOR` and `FORCE_COLOR`.
Exit `0` means the selected command succeeded, `1` means a setup or readiness failure, and `2` means
invalid arguments. A selected revision's entrypoint retains its failure status.

## Cloud verification

Allow GitHub source/raw/release downloads and the package hosts needed by Bootbox, Homebrew and Bun
in the environment's network policy. Access failures must be resolved in the selected environment;
Tanaboot does not select credentials or bypass its proxy.

Setup agents follow [Cloud environment onboarding](./AGENTS.md#cloud-environment-onboarding) for
installation, startup verification and the evidence to report. After reviewing and publishing the
environment, start a fresh task to verify the saved setup. This remains acceptance work for
[#5](https://github.com/tanaabased/tanaabot/issues/5).
