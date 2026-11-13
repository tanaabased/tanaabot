# Tanaabot Cloud setup

Select the actual workspace revision with the packaged Cloud wrapper, then run that revision's
Tanaboot on a disposable Linux runner. Local Git remote data supplies two candidate revisions;
provisioning uses the real packaged entrypoint.

## Setup

```bash
# should prepare a revision without the wrapper and a newer revision with it
mkdir "$TMPDIR/remote"
cp -R "$TANABOOT_PACKAGE_ROOT/." "$TMPDIR/remote/"
rm "$TMPDIR/remote/scripts/cloud-setup.sh"
sed -i 's/^SCRIPT_VERSION=.*/SCRIPT_VERSION=fixture-first/' "$TMPDIR/remote/tanaboot.sh"
git -C "$TMPDIR/remote" init -q -b main
git -C "$TMPDIR/remote" add .
git -C "$TMPDIR/remote" -c user.name=Test -c user.email=test@example.invalid commit -qm first
git -C "$TMPDIR/remote" rev-parse HEAD > "$TMPDIR/first"
git -C "$TMPDIR/remote" -c user.name=Test -c user.email=test@example.invalid tag -a pilot -m pilot
mkdir -p "$TMPDIR/remote/scripts"
cp "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$TMPDIR/remote/scripts/"
sed -i 's/^SCRIPT_VERSION=.*/SCRIPT_VERSION=fixture-second/' "$TMPDIR/remote/tanaboot.sh"
printf second > "$TMPDIR/remote/marker"
git -C "$TMPDIR/remote" add .
git -C "$TMPDIR/remote" -c user.name=Test -c user.email=test@example.invalid commit -qm second
git -C "$TMPDIR/remote" rev-parse HEAD > "$TMPDIR/second"
git -C "$TMPDIR/remote" checkout -qb no-installer
git -C "$TMPDIR/remote" rm -q tanaboot.sh
git -C "$TMPDIR/remote" -c user.name=Test -c user.email=test@example.invalid commit -qm missing-installer
git -C "$TMPDIR/remote" checkout -q main
```

## Testing

```bash
# should explain the cloud wrapper and require a revision before provisioning options
bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" --help | grep -F 'Usage: cloud-setup.sh REF'
for input in '' --agent --ref=main; do
  status=0
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$input" 2>&1) || status=$?
  printf '%s\n' "$output"
  test "$status" -eq 2
  printf '%s\n' "$output" | grep -F 'Provide a branch, tag or full commit SHA'
done

# should select main in the workspace and run host setup there
set -o pipefail
git clone -q "$TMPDIR/remote" "$TMPDIR/branch-workspace"
cd "$TMPDIR/branch-workspace"
git remote set-url origin https://github.com/tanaabased/tanaabot.git
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
bash scripts/cloud-setup.sh main --host 2>&1 | tee "$TMPDIR/branch.log"
sha=$(cat "$TMPDIR/second")
grep -F "Workspace revision: main ($sha)" "$TMPDIR/branch.log"
grep -F 'done: host apply complete.' "$TMPDIR/branch.log"
test "$(git rev-parse HEAD)" = "$sha"
test -z "$(git status --porcelain)"
bash tanaboot.sh --host --check
test ! -e "${XDG_DATA_HOME:-$HOME/.local/share}/tanaabot/sources/tanaabot"

# should peel an annotated tag even when checkout removes the running wrapper
set -o pipefail
git clone -q "$TMPDIR/remote" "$TMPDIR/tag-workspace"
cd "$TMPDIR/tag-workspace"
git remote set-url origin https://github.com/tanaabased/tanaabot.git
mkdir "$TMPDIR/snapshots"
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
TMPDIR="$TMPDIR/snapshots" bash scripts/cloud-setup.sh pilot --version 2>&1 | tee "$TMPDIR/tag.log"
sha=$(cat "$TMPDIR/first")
grep -F "Workspace revision: pilot ($sha)" "$TMPDIR/tag.log"
grep -Fx 'fixture-first' "$TMPDIR/tag.log"
test "$(git rev-parse HEAD)" = "$sha"
test ! -e scripts/cloud-setup.sh
test -z "$(find "$TMPDIR/snapshots" -mindepth 1 -print -quit)"

# should accept a full commit through an external wrapper and check the selected workspace
set -o pipefail
cd "$TMPDIR/branch-workspace"
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
sha=$(cat "$TMPDIR/first")
bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$sha" --host --check
test "$(git rev-parse HEAD)" = "$sha"

# should forward mode and repeated plugin options to the selected revision
cd "$TMPDIR/branch-workspace"
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" main -- --agent --dry-run --debug=false --codex-plugin 'npm:@tanaab/canon@0.13.0' --codex-plugin=canon#main)
printf '%s\n' "$output"
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"
printf '%s\n' "$output" | grep -F 'Codex plugin: npm:@tanaab/canon@0.13.0'
printf '%s\n' "$output" | grep -F 'Codex plugin: canon#main'
! printf '%s\n' "$output" | grep -F 'host'

# should preserve local workspace changes without changing its revision
cd "$TMPDIR/tag-workspace"
printf 'operator change' > operator-file
status=0
output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" main --host 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Workspace has local changes'
test "$(cat operator-file)" = 'operator change'
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/first")"

# should reject a noncanonical workspace without changing its origin or revision
git clone -q "$TMPDIR/remote" "$TMPDIR/other-workspace"
cd "$TMPDIR/other-workspace"
status=0
output=$(bash scripts/cloud-setup.sh main --host 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Workspace origin is not the canonical'
test "$(git remote get-url origin)" = "$TMPDIR/remote"
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"

# should reject a branch and tag collision without substituting main
git -C "$TMPDIR/remote" branch pilot
cd "$TMPDIR/branch-workspace"
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
status=0
output=$(bash scripts/cloud-setup.sh pilot --host 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Reference is ambiguous'
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"

# should fail missing references, commits and entrypoints without changing the workspace
cd "$TMPDIR/branch-workspace"
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
for ref in unavailable ffffffffffffffffffffffffffffffffffffffff no-installer; do
  status=0
  output=$(bash scripts/cloud-setup.sh "$ref" --host 2>&1) || status=$?
  printf '%s\n' "$output"
  test "$status" -eq 1
  test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"
  test -z "$(git status --porcelain)"
done

# should preserve the selected entrypoint's failure status
cd "$TMPDIR/branch-workspace"
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
status=0
output=$(bash scripts/cloud-setup.sh main --host --agent 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 2
printf '%s\n' "$output" | grep -F 'Choose only one setup mode'
test -z "$(git status --porcelain)"
```
