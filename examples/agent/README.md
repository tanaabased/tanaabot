# Agent setup

Preview the packaged `agent` mode and verify that an unfinished readiness check fails. Actual
provisioning remains pending until #5. CI puts `tanaboot.sh` on `PATH`.

## Testing

```sh
# should preview only agent delegation
output=$(tanaboot.sh --agent --dry-run)
printf '%s\n' "$output"
printf '%s\n' "$output" | grep -F -- '--dotpkg'
! printf '%s\n' "$output" | grep -F -- '--brewfile'

# should report an unimplemented agent readiness check
status=0
output=$(tanaboot.sh --agent --check 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'not implemented'

# should provision the agent once #5 is implemented
skip
```
