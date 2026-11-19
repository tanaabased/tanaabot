# Tanaabot Cloud setup

Select the actual workspace revision with the packaged Cloud wrapper, then run that revision's
Tanaboot on a disposable Linux runner. A local Git repository supplies the candidate revisions and tags.
Version and preview commands prove selection and forwarding without repeating host installation.
The local HTTPS fixture supplies GitHub release responses to curl without contacting GitHub.

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
git -C "$TMPDIR/remote" -c user.name=Test -c user.email=test@example.invalid commit --allow-empty -qm release
git -C "$TMPDIR/remote" rev-parse HEAD > "$TMPDIR/release"
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

# should prepare a checkout and https endpoint for channel selection
mkdir "$TMPDIR/release-api"
cp release-catalog.json "$TMPDIR/release-api/catalog.json"
git -C "$TMPDIR/remote" branch trunk "$(cat "$TMPDIR/first")"
git clone -q "$TMPDIR/remote" "$TMPDIR/channel-workspace"
git -C "$TMPDIR/channel-workspace" remote set-url origin https://github.com/tanaabased/tanaabot.git
git -C "$TMPDIR/channel-workspace" config "url.file://$TMPDIR/remote.insteadOf" https://github.com/tanaabased/tanaabot.git
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj /CN=api.github.com \
  -addext subjectAltName=DNS:api.github.com \
  -keyout "$TMPDIR/release-api/key.pem" -out "$TMPDIR/release-api/cert.pem" >/dev/null 2>&1
python3 release-api.py "$TMPDIR/release-api" > "$TMPDIR/release-api/log" 2>&1 &
server_pid=$!
printf '%s\n' "$server_pid" > "$TMPDIR/release-api/pid"
for attempt in {1..50}; do
  if test -s "$TMPDIR/release-api/port"; then break; fi
  kill -0 "$server_pid"
  sleep 0.1
done
test -s "$TMPDIR/release-api/port" || { cat "$TMPDIR/release-api/log"; exit 1; }
printf 'connect-to = "api.github.com:443:127.0.0.1:%s"\ncacert = "%s"\nnoproxy = "api.github.com"\n' \
  "$(cat "$TMPDIR/release-api/port")" "$TMPDIR/release-api/cert.pem" > "$TMPDIR/release-api/.curlrc"
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
  printf '%s\n' "$output" | grep -F 'Provide a channel, branch, tag or full commit SHA'
done

# should select main and recover a reachable tag in a shallow workspace
set -o pipefail
git clone -q --depth=1 --no-tags "file://$TMPDIR/remote" "$TMPDIR/branch-workspace"
cd "$TMPDIR/branch-workspace"
git remote set-url origin https://github.com/tanaabased/tanaabot.git
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
test "$(git rev-parse --is-shallow-repository)" = true
bash scripts/cloud-setup.sh main --version 2>&1 | tee "$TMPDIR/branch.log"
sha=$(cat "$TMPDIR/second")
grep -F "Workspace revision: main ($sha)" "$TMPDIR/branch.log"
grep -Fx 'fixture-second' "$TMPDIR/branch.log"
test "$(git rev-parse HEAD)" = "$sha"
test "$(git rev-parse --is-shallow-repository)" = false
test "$(git describe --tags --always --dirty)" = "pilot-1-g$(git rev-parse --short HEAD)"
test -z "$(git status --porcelain)"
test ! -e "${XDG_DATA_HOME:-$HOME/.local/share}/tanaabot/sources/tanaabot"

# should pick up a newly added lightweight tag when refreshing the same revision
cd "$TMPDIR/branch-workspace"
git -C "$TMPDIR/remote" tag refresh "$(cat "$TMPDIR/second")"
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
bash scripts/cloud-setup.sh main --version
test "$(git describe --tags --always --dirty)" = refresh
test "$(git rev-parse --is-shallow-repository)" = false

# should peel an annotated tag even when checkout removes the running wrapper
set -o pipefail
git clone -q "$TMPDIR/remote" "$TMPDIR/tag-workspace"
cd "$TMPDIR/tag-workspace"
git remote set-url origin https://github.com/tanaabased/tanaabot.git
mkdir "$TMPDIR/snapshots"
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
TMPDIR="$TMPDIR/snapshots" bash scripts/cloud-setup.sh pilot --version 2>&1 | tee "$TMPDIR/tag.log"
sha=$(cat "$TMPDIR/release")
grep -F "Workspace revision: pilot ($sha)" "$TMPDIR/tag.log"
grep -Fx 'fixture-first' "$TMPDIR/tag.log"
test "$(git rev-parse HEAD)" = "$sha"
test ! -e scripts/cloud-setup.sh
test -z "$(find "$TMPDIR/snapshots" -mindepth 1 -print -quit)"

# should accept a full commit and fall back to its hash when no tag is reachable
set -o pipefail
cd "$TMPDIR/branch-workspace"
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
sha=$(cat "$TMPDIR/first")
bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$sha" --version | grep -Fx 'fixture-first'
test "$(git rev-parse HEAD)" = "$sha"
test "$(git describe --tags --always --dirty)" = "$(git rev-parse --short HEAD)"

# should forward mode and action options to the selected revision
cd "$TMPDIR/branch-workspace"
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" main -- --agent --dry-run --debug=false)
printf '%s\n' "$output"
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"
printf '%s\n' "$output" | grep -F 'Home-relative dotpackages through Bootbox'
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
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/release")"

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

# should preserve the current revision and local tag when a required tag fetch conflicts
cd "$TMPDIR/branch-workspace"
first=$(cat "$TMPDIR/first")
git tag conflict "$first"
git -C "$TMPDIR/remote" tag conflict "$(cat "$TMPDIR/second")"
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/remote.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaabot.git
status=0
output=$(bash scripts/cloud-setup.sh "$first" --version 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Could not fetch the resolved commit and tags'
test "$(git rev-parse conflict)" = "$first"
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"

# should select the canonical default branch for dev regardless of local refs
git -C "$TMPDIR/remote" symbolic-ref HEAD refs/heads/trunk
git -C "$TMPDIR/remote" branch dev "$(cat "$TMPDIR/second")"
git -C "$TMPDIR/remote" tag stable "$(cat "$TMPDIR/second")"
git -C "$TMPDIR/remote" tag edge "$(cat "$TMPDIR/second")"
git -C "$TMPDIR/remote" tag preview "$(cat "$TMPDIR/first")"
git -C "$TMPDIR/remote" tag unpromoted "$(cat "$TMPDIR/second")"
git -C "$TMPDIR/remote" tag unpublished "$(cat "$TMPDIR/second")"
cd "$TMPDIR/channel-workspace"
test "$(git symbolic-ref refs/remotes/origin/HEAD)" = refs/remotes/origin/main
first=$(cat "$TMPDIR/first")
output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" dev --version)
printf '%s\n' "$output" | grep -F "Workspace revision: dev ($first)"
test "$(git rev-parse HEAD)" = "$first"

# should still select the commit behind a reserved name by full sha
cd "$TMPDIR/channel-workspace"
sha=$(git rev-parse refs/tags/stable)
bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$sha" --version
test "$(git rev-parse HEAD)" = "$sha"

# should report a fallback for both aliases when no published release qualifies
export CURL_HOME="$TMPDIR/release-api"
cd "$TMPDIR/channel-workspace"
first=$(cat "$TMPDIR/first")
for query in '{pages:[[]]}' '{pages:[[.draft]]}'; do
  jq "$query" "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
  for alias in stable edge; do
    output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$alias" --version 2>&1)
    printf '%s\n' "$output" | grep -F "$alias has no eligible GitHub release. Falling back to dev."
    printf '%s\n' "$output" | grep -F "Workspace revision: $alias ($first)"
    test "$(git rev-parse HEAD)" = "$first"
  done
done

# should use the latest release tag for stable even when a branch has the same name
export CURL_HOME="$TMPDIR/release-api"
cd "$TMPDIR/channel-workspace"
jq '{latest:.latest,pages:[[.latest]]}' "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
release=$(cat "$TMPDIR/release")
for alias in stable edge; do
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$alias" --version)
  printf '%s\n' "$output" | grep -F "Workspace revision: $alias ($release)"
  test "$(git rev-parse HEAD)" = "$release"
done

# should limit prereleases and regular releases without latest status to edge
export CURL_HOME="$TMPDIR/release-api"
cd "$TMPDIR/channel-workspace"
for release_type in preview regular; do
  jq --arg release "$release_type" '{pages:[[.[$release]]]}' "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" stable --version 2>&1)
  printf '%s\n' "$output" | grep -F 'stable has no eligible GitHub release. Falling back to dev.'
  test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/first")"
  case "$release_type" in
    preview) expected=$(cat "$TMPDIR/first") ;;
    regular) expected=$(cat "$TMPDIR/second") ;;
  esac
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" edge --version 2>&1)
  printf '%s\n' "$output" | grep -F "Workspace revision: edge ($expected)"
  [[ "$output" != *'Falling back'* ]]
  test "$(git rev-parse HEAD)" = "$expected"
done

# should choose edge by publication time across pages even when latest status differs
export CURL_HOME="$TMPDIR/release-api"
cd "$TMPDIR/channel-workspace"
jq '{latest:.latest,pages:[[.latest],[.preview]]}' "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" stable --version
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/release")"
bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" edge --version
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/first")"
jq '.latest.published_at = "2026-10-10T12:00:00Z" | {latest:.latest,pages:[[.preview,.latest]]}' \
  "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" edge --version
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/release")"

# should use release id to break equal publication timestamps and exclude drafts
export CURL_HOME="$TMPDIR/release-api"
cd "$TMPDIR/channel-workspace"
jq '{pages:[[.regular],[.draft,.preview]]}' "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" edge --version
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"

# should preserve the checkout when github cannot confirm a release selection
export CURL_HOME="$TMPDIR/release-api"
cd "$TMPDIR/channel-workspace"
before=$(git rev-parse HEAD)
while IFS='|' read -r alias query expected; do
  jq "$query" "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
  status=0
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$alias" --version 2>&1) || status=$?
  test "$status" -eq 1
  printf '%s\n' "$output" | grep -F "$expected"
  [[ "$output" != *'Falling back'* ]]
  test "$(git rev-parse HEAD)" = "$before"
done <<'CASES'
stable|{latest:401}|HTTP 401
stable|{pages:[404]}|Could not confirm
stable|{pages:[[{}]]}|Invalid releases response
edge|{pages:[[.preview],429]}|page 2 (HTTP 429)
edge|{pages:[[.preview],{}]}|invalid data on page 2
edge|{pages:[[.preview],[]]}|invalid data on page 2
edge|{pages:[[],[.preview]]}|invalid data on page 1
CASES

# should fail release lookup on a tls error without using dev
cd "$TMPDIR/channel-workspace"
before=$(git rev-parse HEAD)
mkdir "$TMPDIR/untrusted-api"
sed '/^cacert =/d' "$TMPDIR/release-api/.curlrc" > "$TMPDIR/untrusted-api/.curlrc"
status=0
output=$(CURL_HOME="$TMPDIR/untrusted-api" bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" edge --version 2>&1) || status=$?
test "$status" -eq 1
printf '%s\n' "$output" | grep -F "GitHub 'edge' release lookup failed"
[[ "$output" != *'Falling back'* ]]
test "$(git rev-parse HEAD)" = "$before"

# should fail selected releases with a missing tag or installer without using another revision
export CURL_HOME="$TMPDIR/release-api"
cd "$TMPDIR/channel-workspace"
git -C "$TMPDIR/remote" tag without-installer no-installer
before=$(git rev-parse HEAD)
while IFS='|' read -r tag expected; do
  jq --arg tag "$tag" '{latest:(.latest | .tag_name = $tag)}' \
    "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
  status=0
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" stable --version 2>&1) || status=$?
  test "$status" -eq 1
  printf '%s\n' "$output" | grep -F "$expected"
  [[ "$output" != *'Falling back'* ]]
  test "$(git rev-parse HEAD)" = "$before"
done <<'CASES'
|release has a missing or invalid tag
missing-tag|Could not resolve the selected GitHub release tag
without-installer|Selected revision has no tanaboot.sh entrypoint
CASES
```

## Cleanup

```bash
# should stop the local release endpoint
if test -s "$TMPDIR/release-api/pid"; then
  kill "$(cat "$TMPDIR/release-api/pid")"
fi
```
