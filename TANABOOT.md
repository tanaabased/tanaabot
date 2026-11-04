# Tanaboot

Use [`tanaboot.sh`](./tanaboot.sh) in a Linux Codex Cloud setup to install a selected tanaabot revision.

## Usage

From a source checkout:

```sh
./tanaboot.sh --ref main
./tanaboot.sh --ref v0.1.0
./tanaboot.sh --ref <full-commit-sha>
```

Choose a branch, tag or full commit SHA from canonical `tanaabased/tanaabot`. Tanaboot reports the
requested reference and resolved commit, then runs that commit's entrypoint. A missing reference,
branch/tag collision, unavailable commit or modified managed checkout fails without selecting another
revision. Use a full commit SHA to resolve a name collision.
Both `--ref main` and `--ref=main` are accepted.

Setup requires 64-bit Linux, a non-root user, a writable home, and Bash, Git, curl and jq.
Guidance currently targets `~/.codex`; a different `CODEX_HOME` is rejected. Bootbox provisions its
standard foundation, including 1Password CLI, plus the [Brewfile](./Brewfile). Authentication, secret
retrieval, SSH and identity setup are deferred. Tanaboot downloads the current hosted
`https://bootbox.tanaab.sh/bootbox.sh` on each setup or check. Node and Bun must satisfy the selected revision's
runtime declarations; Tanaboot checks Bun against `.bun-version`.

The default installs host dependencies before agent guidance and the Tanaabot plugin. No additional
plugins are selected by default. Agent mode requires the
host tools first. Sources remain under `${XDG_DATA_HOME:-$HOME/.local/share}/tanaabot`; keep them while
using the installed guidance and plugins. Existing configuration conflicts fail without forced
replacement. Preserve conflicting files or local edits, resolve the reported conflict, then retry.
Do not remove a lock until you have confirmed that its setup or acquisition process has stopped.

```sh
# Preview without downloads or changes; a reference remains unresolved offline
./tanaboot.sh --ref main --dry-run

# Install or check the current source checkout
./tanaboot.sh --host
./tanaboot.sh --agent
./tanaboot.sh --check
```

`--check` downloads Bootbox for its checks but does not install. With `--ref`, it resolves names but requires the exact revision
already present locally. It checks tool, guidance and enabled-plugin state. A successful check does
not establish that a fresh Cloud task will discover the setup. It checks the base setup; omit
`--codex-plugin` when checking.

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

| Option               | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `--ref REF`          | Resolve and execute one canonical revision; omitted uses this checkout. |
| `--codex-plugin SRC` | Install an additional Codex plugin; repeat for multiple sources.        |
| `--host`             | Select host dependencies only.                                          |
| `--agent`            | Select guidance, shell initialization and Codex plugins only.           |
| `--check`            | Check base readiness without installing.                                |
| `--dry-run`          | Preview without network access or changes.                              |
| `--debug`            | Enable wrapper diagnostics on stderr.                                   |
| `--version`          | Print the running script version.                                       |
| `-h`, `--help`       | Print usage and options.                                                |

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

After preparing and publishing the environment, start a fresh task from that saved configuration.
Record the actual tanaabot commit and verify tool paths, loaded guidance, discoverable skills and a
safe setup rerun there. Source tests and checks in an existing task do not establish this result.
Saved Cloud configuration, publication and this fresh-task check remain operator-owned acceptance
work for [#5](https://github.com/tanaabased/tanaabot/issues/5).
