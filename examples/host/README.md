# Host setup

Preview packaged host delegation and check an unprepared home without installing anything.
CI puts `tanaboot.sh` on `PATH`. Actual Cloud provisioning requires its own disposable setup.

## Testing

```sh
# should preview only host delegation
output=$(tanaboot.sh --host --dry-run)
printf '%s\n' "$output"
printf '%s\n' "$output" | grep -F -- '--brewfile'
! printf '%s\n' "$output" | grep -F -- '--dotpkg'

# should report missing host setup without downloading or creating data
profile_home=$(mktemp -d "$TMPDIR/tanaboot-host.XXXXXX")
status=0
output=$(HOME="$profile_home" CODEX_HOME="$profile_home/.codex" XDG_DATA_HOME="$profile_home/data" tanaboot.sh --host --check 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Pinned Bootbox is missing'
test ! -e "$profile_home/data"
```
