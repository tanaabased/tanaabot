# Leia example guidance

These README files are executable scenarios for the packaged Tanaboot candidate. Run them on
fresh CI runners or an authorized disposable Cloud environment. Local execution requires explicit
operator authorization.

## Test layers and placement

- Unit tests belong in `test/*.spec.js`: isolated decisions with injected boundaries.
- Component tests belong in `test/*.component.js`: subsystem wiring with fake external services.
- Leia examples own public CLI and installed-product flows. Use the `tanaaboot-` directory prefix.
  `tanaaboot-inputs` covers options and errors; `tanaaboot-defaults`, `tanaaboot-host` and
  `tanaaboot-agent` cover their corresponding setup modes.
- Keep constant fixtures beside their scenario. Add another folder only for a distinct flow or
  incompatible setup, and add its name to the `pr-tanaboot-tests.yml` matrix.

## Scenario style

- Use `## Setup`, `## Testing` and, only when needed, `## Cleanup`.
- Give each blank-line-separated block a focused lowercase `# should` label. Blocks do not share
  variables, functions or working-directory changes.
- Keep commands and assertions visible in the README. Prefer direct shell assertions; do not write
  output files merely to grep them later.
- Run the candidate unpacked outside the checkout, with no dependency on source files or developer
  configuration. CI places the candidate on `PATH` as `tanaboot.sh`.
- Use `TMPDIR` for runtime-derived state. Copy tracked fixtures before changing them.
- Keep setup linear in the workflow; scenario-specific behavior belongs in its README.
- Disable retries for provisioning flows. Do not add credentials or machine mutation to preview tests.
- Use `skip` for unfinished provisioning checks so scaffolding cannot imply installation succeeded.
