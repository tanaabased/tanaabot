# Default setup

Preview the packaged default mode, which selects host then agent. The provisioning case remains
pending until #5. CI puts the candidate on `PATH` as `tanaboot.sh`.

## Testing

```sh
# should preview both setup groups
set -o pipefail
tanaboot.sh --dry-run | grep -F -- '--brewfile'
tanaboot.sh --dry-run | grep -F -- '--dotpkg'

# should refuse unimplemented installation
status=0
output=$(tanaboot.sh 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'nothing was changed'

# should provision a fresh Cloud environment once #5 is implemented
skip
```
