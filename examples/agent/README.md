# Agent setup

Preview packaged guidance and plugin delegation. Agent readiness requires prepared host tools;
an empty-home check fails without installing them. CI puts `tanaboot.sh` on `PATH`.

## Testing

```sh
# should preview only agent delegation
output=$(tanaboot.sh --agent --dry-run)
printf '%s\n' "$output"
printf '%s\n' "$output" | grep -F -- '--dotpkg'
! printf '%s\n' "$output" | grep -F -- '--brewfile'

# should require host setup without changing the agent home
profile_home=$(mktemp -d "$TMPDIR/tanaboot-agent.XXXXXX")
status=0
output=$(HOME="$profile_home" CODEX_HOME="$profile_home/.codex" XDG_DATA_HOME="$profile_home/data" tanaboot.sh --agent --check 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Pinned Bootbox is missing'
test ! -e "$profile_home/.codex"
test ! -e "$profile_home/data"
```
