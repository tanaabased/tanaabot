# Tanaboot revisions

Exercise reference selection and acquisition failures through the packaged entrypoint and local
Git remote data. The selected revisions contain the real candidate script and run host setup on
a disposable Linux runner.

## Setup

```bash
# should prepare two candidate revisions and an annotated tag
mkdir "$TMPDIR/remote"
cp "$TANABOOT_PACKAGE_ROOT/tanaboot.sh" "$TANABOOT_PACKAGE_ROOT/Brewfile" \
  "$TANABOOT_PACKAGE_ROOT/.bun-version" "$TANABOOT_PACKAGE_ROOT/.node-version" "$TMPDIR/remote/"
git -C "$TMPDIR/remote" init -q -b main
git -C "$TMPDIR/remote" add .
git -C "$TMPDIR/remote" -c user.name=Test -c user.email=test@example.invalid commit -qm first
git -C "$TMPDIR/remote" rev-parse HEAD > "$TMPDIR/first"
git -C "$TMPDIR/remote" -c user.name=Test -c user.email=test@example.invalid tag -a pilot -m pilot
printf second > "$TMPDIR/remote/marker"
git -C "$TMPDIR/remote" add marker
git -C "$TMPDIR/remote" -c user.name=Test -c user.email=test@example.invalid commit -qm second
git -C "$TMPDIR/remote" rev-parse HEAD > "$TMPDIR/second"
```

## Testing

```bash
# should execute the branch revision and reuse it for readiness
set -o pipefail
GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git \
  XDG_DATA_HOME="$TMPDIR/data" tanaboot.sh --ref main --host 2>&1 | tee "$TMPDIR/branch.log"
sha=$(cat "$TMPDIR/second")
grep -F "Resolved commit: $sha" "$TMPDIR/branch.log"
test "$(git -C "$TMPDIR/data/tanaabot/sources/tanaabot/$sha" rev-parse HEAD)" = "$sha"
GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git \
  XDG_DATA_HOME="$TMPDIR/data" tanaboot.sh --ref "$sha" --host --check

# should peel an annotated tag and execute its exact commit
set -o pipefail
GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git \
  XDG_DATA_HOME="$TMPDIR/data" tanaboot.sh --ref pilot --host 2>&1 | tee "$TMPDIR/tag.log"
sha=$(cat "$TMPDIR/first")
grep -F "Resolved commit: $sha" "$TMPDIR/tag.log"
test "$(git -C "$TMPDIR/data/tanaabot/sources/tanaabot/$sha" rev-parse HEAD)" = "$sha"

# should reject a branch and tag collision without substituting main
git -C "$TMPDIR/remote" branch pilot
status=0
output=$(GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git \
  XDG_DATA_HOME="$TMPDIR/data" tanaboot.sh --ref pilot --host 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Reference is ambiguous'

# should preserve local source changes and refuse reuse
sha=$(cat "$TMPDIR/first")
printf 'operator change' > "$TMPDIR/data/tanaabot/sources/tanaabot/$sha/operator-file"
status=0
output=$(XDG_DATA_HOME="$TMPDIR/data" tanaboot.sh --ref "$sha" --host 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'local changes'
test "$(cat "$TMPDIR/data/tanaabot/sources/tanaabot/$sha/operator-file")" = 'operator change'

# should clean failed acquisition staging without touching other sources
status=0
output=$(GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git \
  XDG_DATA_HOME="$TMPDIR/data" tanaboot.sh --ref ffffffffffffffffffffffffffffffffffffffff --host 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'could not be fetched'
test -z "$(find "$TMPDIR/data/tanaabot/sources/tanaabot" -name '.acquire.*' -o -name '*.lock')"
test -d "$TMPDIR/data/tanaabot/sources/tanaabot/$(cat "$TMPDIR/second")/.git"

# should leave another setup lock untouched
mkdir -p "$TMPDIR/data/tanaabot/setup.lock"
status=0
output=$(XDG_DATA_HOME="$TMPDIR/data" tanaboot.sh --host 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Setup is already running'
test -d "$TMPDIR/data/tanaabot/setup.lock"
```
