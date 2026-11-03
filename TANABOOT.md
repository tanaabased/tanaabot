# Tanaboot

The option reference for [`tanaboot.sh`](./tanaboot.sh), tanaabot's Codex Cloud setup entrypoint.
Start with the [README](./README.md#preview-setup) for the current preview.

## Usage

```sh
# Preview host setup followed by agent setup
./tanaboot.sh --dry-run

# Preview one group with diagnostics
./tanaboot.sh --host --dry-run --debug
./tanaboot.sh --agent --dry-run

# Show all options and environment variables
./tanaboot.sh --help
```

## Bootstrap behavior

Host mode will delegate the [Brewfile](./Brewfile) to Bootbox and prepare Homebrew PATH. Agent mode
will apply [dotpackages](./INVENTORY.md#dotpackages) through Bootbox and install this checkout's
plugin and Canon through Codex Tools. With no mode flag, host setup precedes agent setup.

Only previews are implemented. They print planned delegation without downloading or executing it.
Installation and readiness checks return failure until [#5](https://github.com/tanaabased/tanaabot/issues/5)
is implemented. Tanaboot currently requires a local checkout; source acquisition and plugin selection
also belong to #5.

## CLI options

CLI options override environment variables, which override defaults.

### `--host`

| Field       | Value                                                  |
| ----------- | ------------------------------------------------------ |
| Environment | None                                                   |
| Default     | Host then agent                                        |
| Values      | Flag; mutually exclusive with `--agent`                |
| Description | Select host dependencies and Homebrew PATH setup only. |

### `--agent`

| Field       | Value                                                |
| ----------- | ---------------------------------------------------- |
| Environment | None                                                 |
| Default     | Host then agent                                      |
| Values      | Flag; mutually exclusive with `--host`               |
| Description | Select guidance, dotpackages and Codex plugins only. |

### `--check`

| Field       | Value                                                                              |
| ----------- | ---------------------------------------------------------------------------------- |
| Environment | None                                                                               |
| Default     | Installation                                                                       |
| Values      | Flag; mutually exclusive with `--dry-run`                                          |
| Description | Request a readiness check. Currently returns `1` because checks are unimplemented. |

### `--dry-run`

| Field       | Value                                                         |
| ----------- | ------------------------------------------------------------- |
| Environment | None                                                          |
| Default     | Installation                                                  |
| Values      | Flag; mutually exclusive with `--check`                       |
| Description | Preview the selected setup without network access or changes. |

### `--debug`

| Field       | Value                                                                |
| ----------- | -------------------------------------------------------------------- |
| Environment | `TANABOOT_DEBUG`; falls back to `DEBUG`, then `RUNNER_DEBUG`         |
| Default     | Off                                                                  |
| Values      | `--debug` or `--debug=BOOL`; `0`, `false`, `no` and `off` disable it |
| Description | Write wrapper diagnostics to stderr.                                 |

### `--version`

Print the running wrapper version and exit.

### `-h`, `--help`

Print the CLI and environment-variable reference and exit.

## Output and exit status

Normal output goes to stdout; diagnostics go to stderr. Output supports `NO_COLOR` and `FORCE_COLOR`
and remains plain when redirected unless color is forced.

| Status | Meaning                                         |
| ------ | ----------------------------------------------- |
| `0`    | Help, version or preview completed              |
| `1`    | Setup is unimplemented or a prerequisite failed |
| `2`    | Invalid arguments                               |
