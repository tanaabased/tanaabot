# Harmless synchronization smoke test

Perform no external writes or schedule changes. Return a single success card with the marker
`TANAABOT-SYNC-SMOKE-1`, the automation ID, contentHash and updatedAt actually present in this task's
metadata, and the observed execution environment. This demonstrates receipt of the assembled
prompt and shared instructions, not successful scheduling of another task. If the expected
metadata or environment is missing, return a warning card describing the missing evidence.
