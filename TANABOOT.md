# Tanaboot

Use [`tanaboot.sh`](./tanaboot.sh) to provision its source checkout in a Linux Codex Cloud setup.

## Usage

From a source checkout:

```sh
./tanaboot.sh
```

For Cloud workspace revision selection, use the separate [Cloud wrapper](./scripts/cloud-setup.sh)
from the existing workspace:

```sh
bash scripts/cloud-setup.sh main
bash scripts/cloud-setup.sh v0.1.0 --host
bash scripts/cloud-setup.sh <full-commit-sha> --agent
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
bash "$wrapper" main
```

Setup requires 64-bit Linux, a non-root user, a writable home, and Bash, Git, curl and jq.
Guidance currently targets `~/.codex`; a different `CODEX_HOME` is rejected. Host setup reuses Homebrew
from PATH, `~/.linuxbrew` or `/home/linuxbrew/.linuxbrew`. If absent, it runs the official installer
without sudo into `~/.linuxbrew`; the absolute prefix must be no longer than 26 bytes. Homebrew's
[Linux build prerequisites](https://docs.brew.sh/Homebrew-on-Linux#requirements) must already exist.
Bootbox then runs with `--no-sudo` and provisions its
standard foundation, including 1Password CLI, plus the [Brewfile](./Brewfile). Authentication, secret
retrieval, SSH and identity setup are deferred. Tanaboot downloads the current hosted
`https://bootbox.tanaab.sh/bootbox.sh` during setup only. Node and Bun must satisfy the selected revision's
runtime declarations; Tanaboot checks Node and Bun against their declared major versions.

The default mode installs host dependencies before agent guidance and shell initialization.
Agent mode requires the host tools first. Keep the prepared checkout while using its linked
configuration. Existing configuration conflicts fail without forced replacement. Preserve conflicting
files or local edits, resolve the reported conflict, then retry. Do not remove a setup lock until
its process has stopped.

```sh
# Preview the current checkout without downloads or changes
./tanaboot.sh --dry-run

# Install or check the current source checkout
./tanaboot.sh --host
./tanaboot.sh --agent
./tanaboot.sh --check
```

`--check` runs offline without installing or requiring a writable home or Homebrew prefix. It checks
Homebrew, Node, Bun and the Brewfile dependencies on the caller's effective PATH by executable
discovery and version output, then checks fresh
non-interactive, login and interactive Bash discovery for agent setup. Persistent PATH initialization
lives in the shell dotpackage; setup appends its loader to the first readable Bash login file
(`.bash_profile`, `.bash_login`, then `.profile`) and `.bashrc`, preserving their other contents.
The loader discovers Homebrew on PATH, in `~/.linuxbrew` or at the standard Linux prefix.
It does not configure other command launchers; verify the actual Cloud shell before adding wiring.

A successful check establishes machine readiness and readable installed guidance. It does not
establish workspace plugin delivery, task skill discovery or automatically supplied instructions.
When passed through the Cloud wrapper, `--check` and `--dry-run` apply after workspace checkout;
run Tanaboot directly for an offline check or preview without changing the workspace.

## Workspace plugins

Import this GitHub repository at `main` through the workspace Plugins UI, using
[`.agents/plugins/marketplace.json`](./.agents/plugins/marketplace.json). Install its `tanaabot`
plugin and Canon's `tanaab` plugin for the intended account, and inspect each plugin's Cloud/web
compatibility. Tanaboot does not install, enable or remove container-local plugin copies.

The pilot tracks `main` for both repositories. Marketplace updates and workspace plugin installation
are separate from environment publication, which preserves machine files. Record the delivered plugin
revisions during the fresh-task trial; startup verification never resolves newer upstream revisions.
A successful import or enabled plugin is not proof that a particular task discovers its skills.

Persistent operating-guidance delivery is tracked in
[#16](https://github.com/tanaabased/tanaabot/issues/16). The installed global file is the source for
that work; importing a plugin does not establish that the task received it automatically.

## Options

| Option         | Purpose                                          |
| -------------- | ------------------------------------------------ |
| `--host`       | Select host dependencies only.                   |
| `--agent`      | Select guidance and shell initialization only.   |
| `--check`      | Check installed tools and configuration offline. |
| `--dry-run`    | Preview without network access or changes.       |
| `--debug`      | Enable wrapper diagnostics on stderr.            |
| `--version`    | Print the running script version.                |
| `-h`, `--help` | Print usage and options.                         |

Choose at most one mode and one action. `TANABOOT_DEBUG` supplies the debug default, falling back
to `DEBUG`, then `RUNNER_DEBUG`. Explicit CLI selection takes precedence.

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
