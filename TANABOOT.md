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
bash scripts/cloud-setup.sh stable
bash scripts/cloud-setup.sh v0.1.0 --host
bash scripts/cloud-setup.sh <full-commit-sha> --agent
```

The required first argument selects a channel, branch, tag or full commit SHA from
`tanaabased/tanaabot`.

- `dev` uses the repository's current default branch.
- `stable` uses the published regular release that GitHub marks Latest.
- `edge` uses the most recently published GitHub release, including prereleases.

When GitHub confirms that `stable` or `edge` has no eligible release, the wrapper reports why it uses
`dev`. Failed lookups and broken releases stop setup. The three lowercase channel names are reserved.
Use a full commit SHA for a branch or tag with one of those names.

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
standard foundation, including 1Password CLI, plus the [Brewfile](./Brewfile). Tanaboot downloads the current hosted
`https://bootbox.tanaab.sh/bootbox.sh` during setup only. Node and Bun must satisfy the selected revision's
runtime declarations; Tanaboot checks Node and Bun against their declared major versions.

The default mode installs host dependencies before agent dotfiles and the approved Tanaabot SSH signing key.
Supply `OP_SERVICE_ACCOUNT_TOKEN` through private Cloud configuration for environment refresh and initial key retrieval;
the service account needs read access to the manifest's Environment and configured key item. Bootbox installs the key as
`~/.ssh/id_tanaabot`. A matching existing key is reused without retrieval; a conflicting key is
preserved and rejected. Agent setup refreshes the selected Environment with 1Password CLI 2.42+ when
the token is supplied; otherwise it reuses a valid saved file. Values are stored outside the checkout
in `~/.local/state/tanaabot/environment.json` (mode 600, directory mode 700), replaced atomically and
exported by Bash initialization without evaluating them as shell code. A failed refresh preserves
the previous file. Shell startup never fetches from 1Password.

GitHub Git transport uses HTTPS with `gh auth git-credential` and the privately loaded `GH_TOKEN`.
GitHub SSH-style URLs are rewritten to HTTPS. The approved key remains available for local SSH
commit signing; outbound SSH is not required. Keep platform proxy and TLS settings intact.

To refresh an existing environment explicitly, run from the prepared checkout with its private token
available, then open a fresh shell:

```sh
bun --no-env-file scripts/environment-task.js --refresh
```

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
discovery and version output, verifies the identity dotfiles and private/public key match, checks the
saved environment against the actual exported values, then checks fresh
non-interactive, login and interactive Bash discovery for agent setup. Persistent PATH initialization
lives in the shell dotpackage; setup appends its loader to the first readable Bash login file
(`.bash_profile`, `.bash_login`, then `.profile`) and `.bashrc`, preserving their other contents.
The loader discovers Homebrew on PATH, in `~/.linuxbrew` or at the standard Linux prefix.
It does not configure other command launchers; verify the actual Cloud shell before adding wiring.

A successful check establishes machine readiness and readable installed guidance. Use
[Tanaabot Startup Check](./skills/startup-check/SKILL.md) for the same six-section card after
installation and at startup, including the read-only GitHub identity check. Tanaboot's offline check does not
establish local skill loading, account plugin delivery or automatically supplied instructions.
When passed through the Cloud wrapper, `--check` and `--dry-run` apply after workspace checkout;
run Tanaboot directly for an offline check or preview without changing the workspace.

## Skills

Tanaabot's canonical skills live in [`skills/`](./skills/) in the selected repository revision.
Configure the environment's Start skill with the direct-path text in
[Cloud environment onboarding](./AGENTS.md#cloud-environment-onboarding), using the verified prepared
checkout path. Startup reads the local skill metadata into the chat context; subsequent requests
select relevant skills and read their full instructions and required references before use.
This explicit loading does not register skills in the native catalog or require a Tanaabot plugin.

Install Canon separately in your personal ChatGPT account through Plugin Creator using a published
`@tanaab/canon` release. Its installation and updates are independent of Tanaboot and environment
publication. Startup checks look for discoverable `tanaab-` skills in the task's catalog; this is an
availability check, not a complete release inventory. Tanaboot does not install, update or remove
account plugins or container-local plugin copies. Account import and fresh-task discovery still
require live verification.

Main-Dot saved-instruction sync is tracked in
[#16](https://github.com/tanaabased/tanaabot/issues/16), using the global guidance source.
That sync and plugin import do not establish automatic instruction delivery to Cloud tasks.

## Options

| Option         | Purpose                                                |
| -------------- | ------------------------------------------------------ |
| `--host`       | Select host dependencies only.                         |
| `--agent`      | Select dotfiles, environment and the approved SSH key. |
| `--check`      | Check installed tools and configuration offline.       |
| `--dry-run`    | Preview without network access or changes.             |
| `--debug`      | Enable wrapper diagnostics on stderr.                  |
| `--version`    | Print the running script version.                      |
| `-h`, `--help` | Print usage and options.                               |

Choose at most one mode and one action. `TANABOOT_DEBUG` supplies the debug default, falling back
to `DEBUG`, then `RUNNER_DEBUG`. Explicit CLI selection takes precedence.

Normal output goes to stdout; diagnostics go to stderr. Output respects `NO_COLOR` and `FORCE_COLOR`.
Exit `0` means the selected command succeeded, `1` means a setup or readiness failure, and `2` means
invalid arguments. A selected revision's entrypoint retains its failure status.

## Cloud verification

Use a revision that includes Record Publication. After a successful full Cloud setup, keep
the displayed **Setup ID**. Publish or republish the
environment and start a fresh task in it. Check that Startup Check shows the same ID, then ask
the fresh task to [Record Publication](./skills/record-publication/SKILL.md) with that ID.
The local receipt is kept outside the checkout. Record Publication commits it as
`tanaabot-publication.json` through your authorized GitHub workflow. Before the first receipt
is recorded, sync can use the default branch if GitHub confirms the file is absent.

Replace existing Automation Sync and Instruction Sync workers whose prepared checkout lacks the
updated `scripts/publication-task.js` reader. Archive those workers, start replacements in the republished
environment, and rebind and verify their existing schedules through the owning Dot. The fallback
requires the reader in the new checkout. If republishing changes the native configuration ID,
use an explicit operator-approved binding change through native controls. Ordinary archived-worker
recovery requires the saved configuration ID.

Allow GitHub source/raw/release downloads and the package hosts needed by Bootbox, Homebrew and Bun
in the environment's network policy. Access failures must be resolved in the selected environment;
Tanaboot does not select credentials or bypass its proxy.

After the repository change is available at the selected revision:

1. Prepare a fresh environment without the previous diagnostic copies, following
   [Cloud environment onboarding](./AGENTS.md#cloud-environment-onboarding).
2. Save and verify the direct-path Start skill in the environment, then publish and start a fresh chat.
3. Verify that startup runs without a manual bootstrap prompt. Report local Tanaabot loading
   separately from Canon catalog availability.
4. Make a relevant subsequent request without naming a Tanaabot skill; verify the agent selects
   and reads the appropriate local skill and its required references.
5. For an authorized identity pilot, run
   `git ls-remote https://github.com/tanaabased/tanaabot.git HEAD` through the normal task launcher.
   Verify both GitHub SSH URL forms resolve to HTTPS with `git ls-remote --get-url`, without connecting
   over SSH. Keep proxy settings and TLS verification enabled. Report live HTTPS access separately
   from API identity and repository permissions; a public read does not prove token write access.
6. In a disposable local repository, create and verify a signed commit using the installed Git
   configuration and approved key. Do not push it. Report this separately from signing configuration
   and GitHub signing-key registration; startup itself does not create commits.

Package checks and readable files alone do not establish startup or later skill selection.
This fresh-pilot verification remains acceptance work for [#5](https://github.com/tanaabased/tanaabot/issues/5).
