# Leia example guidance

These README files are executable scenarios for the packaged Tanaboot candidate. Run them on
fresh CI runners or an authorized disposable Cloud environment. Local execution requires explicit
operator authorization.

## Test layers and placement

- Leia examples own public CLI and installed-product flows. Tanaboot scenarios use the `tanaaboot-` directory prefix.
  `tanaaboot-inputs` covers options and errors; `tanaaboot-defaults`, `tanaaboot-host` and
  `tanaaboot-agent` cover their corresponding setup modes. `tanaaboot-cloud-setup` covers workspace
  revision selection and invocation of that revision's entrypoint.
- The `codex-plugin` scenario installs the same unpacked candidate in a disposable Codex home.
- The `openclaw` scenario validates the packaged agent manifest and checks that OpenClaw can install and discover the bundled skills.
- Keep constant fixtures beside their scenario. Add another folder only for a distinct flow or
  incompatible setup. Register new scenarios in the `pr-examples-tests.yml` matrix.
- Cover bootstrap, readiness, shell loading, key handling, permissions and reruns through the packaged
  public CLI. Do not source `tanaboot.sh`, replace its functions or commands, or move a standalone
  shell test runner into an example. Use real tools and observable results; fixtures may supply data
  or an isolated machine environment, not fake successful `brew`, `curl`, `op` or installer commands.

## Scenario style

- Use `## Setup`, `## Testing` and, only when needed, `## Cleanup`.
- Give each blank-line-separated block a focused lowercase `# should` label. Blocks do not share
  variables, functions or working-directory changes.
- Put shared environment values in the Example Tests workflow. Override a value in a scenario
  when the override is part of the test. Leia already runs Bash with `-e` and `pipefail`.
- Keep commands and assertions visible in the README. Prefer direct shell assertions; do not write
  output files merely to grep them later.
- Run the candidate unpacked outside the checkout, with no dependency on source files or developer
  configuration. CI places the candidate on `PATH` as `tanaboot.sh`.
- Use `TMPDIR` for runtime-derived state. Copy tracked fixtures before changing them.
- Keep setup linear in the workflow; scenario-specific behavior belongs in its README.
- Disable retries for provisioning flows. Do not add credentials or machine mutation to preview tests.
- Use `skip` for unfinished provisioning checks so scaffolding cannot imply installation succeeded.
