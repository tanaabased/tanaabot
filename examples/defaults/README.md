# Default setup

Preview the packaged default mode, which selects host then agent. CI puts the candidate on `PATH` as
`tanaboot.sh`. Fresh-task Cloud installation is a separate acceptance check in #5.

## Testing

```sh
# should preview both setup groups
set -o pipefail
tanaboot.sh --dry-run | grep -F -- '--brewfile'
tanaboot.sh --dry-run | grep -F -- '--dotpkg'

# should leave a requested revision unresolved in an offline preview
output=$(tanaboot.sh --ref main --dry-run)
printf '%s\n' "$output"
printf '%s\n' "$output" | grep -F 'main'
printf '%s\n' "$output" | grep -F 'not resolved offline'
```
