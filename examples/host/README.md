# Host setup

Preview the packaged `host` mode and verify that an unfinished readiness check fails. Actual
provisioning remains pending until #5. CI puts `tanaboot.sh` on `PATH`.

## Testing

```sh
# should preview only host delegation
output=$(tanaboot.sh --host --dry-run)
printf '%s\n' "$output"
printf '%s\n' "$output" | grep -F -- '--brewfile'
! printf '%s\n' "$output" | grep -F -- '--dotpkg'

# should report an unimplemented host readiness check
status=0
output=$(tanaboot.sh --host --check 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'not implemented'

# should provision the host once #5 is implemented
skip
```
