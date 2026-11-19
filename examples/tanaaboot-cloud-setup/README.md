# Tanaabot Cloud setup

Select the actual workspace revision with the packaged Cloud wrapper, then run that revision's
Tanaboot on a disposable Linux runner. A local Git repository supplies the candidate revisions and tags.
Version and preview commands prove selection and forwarding without repeating host installation.
The workflow supplies an unused `CURL_HOME` for the local HTTPS fixture that serves GitHub release responses.

## Setup

```bash
# should prepare a revision without the wrapper and a newer revision with it
mkdir "$TMPDIR/remote"
cp -R "$TANABOOT_PACKAGE_ROOT/." "$TMPDIR/remote/"
rm "$TMPDIR/remote/scripts/cloud-setup.sh"
sed -i 's/^SCRIPT_VERSION=.*/SCRIPT_VERSION=fixture-first/' "$TMPDIR/remote/tanaboot.sh"
git -C "$TMPDIR/remote" init -q -b main
git -C "$TMPDIR/remote" config user.name Test
git -C "$TMPDIR/remote" config user.email test@example.invalid
git -C "$TMPDIR/remote" add .
git -C "$TMPDIR/remote" commit -qm first
git -C "$TMPDIR/remote" rev-parse HEAD > "$TMPDIR/first"
git -C "$TMPDIR/remote" commit --allow-empty -qm release
git -C "$TMPDIR/remote" rev-parse HEAD > "$TMPDIR/release"
git -C "$TMPDIR/remote" tag -a pilot -m pilot
mkdir -p "$TMPDIR/remote/scripts"
cp "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$TMPDIR/remote/scripts/"
sed -i 's/^SCRIPT_VERSION=.*/SCRIPT_VERSION=fixture-second/' "$TMPDIR/remote/tanaboot.sh"
printf second > "$TMPDIR/remote/marker"
git -C "$TMPDIR/remote" add .
git -C "$TMPDIR/remote" commit -qm second
git -C "$TMPDIR/remote" rev-parse HEAD > "$TMPDIR/second"
git -C "$TMPDIR/remote" checkout -qb no-installer
git -C "$TMPDIR/remote" rm -q tanaboot.sh
git -C "$TMPDIR/remote" commit -qm missing-installer
git -C "$TMPDIR/remote" checkout -q main

# should prepare a checkout and https endpoint for channel selection
mkdir "$CURL_HOME"
cp release-catalog.json "$CURL_HOME/catalog.json"
channel_remote="$TMPDIR/channel-remote"
git clone -q --bare "$TMPDIR/remote" "$channel_remote"
git clone -q "$channel_remote" "$TMPDIR/channel-workspace"
git -C "$TMPDIR/channel-workspace" remote set-url origin https://github.com/tanaabased/tanaabot.git
git -C "$TMPDIR/channel-workspace" config "url.file://$channel_remote.insteadOf" https://github.com/tanaabased/tanaabot.git
first=$(cat "$TMPDIR/first")
second=$(cat "$TMPDIR/second")
git -C "$channel_remote" branch trunk "$first"
git -C "$channel_remote" symbolic-ref HEAD refs/heads/trunk
git -C "$channel_remote" branch dev "$second"
git -C "$channel_remote" branch pilot "$second"
git -C "$channel_remote" tag stable "$second"
git -C "$channel_remote" tag edge "$second"
git -C "$channel_remote" tag preview "$first"
git -C "$channel_remote" tag unpromoted "$second"
git -C "$channel_remote" tag without-installer no-installer

# should serve release metadata over a local HTTPS endpoint
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj /CN=api.github.com \
  -addext subjectAltName=DNS:api.github.com \
  -keyout "$CURL_HOME/key.pem" -out "$CURL_HOME/cert.pem" >/dev/null 2>&1
python3 release-api.py "$CURL_HOME" > "$CURL_HOME/log" 2>&1 &
server_pid=$!
printf '%s\n' "$server_pid" > "$CURL_HOME/pid"
for attempt in {1..50}; do
  if test -s "$CURL_HOME/port"; then break; fi
  kill -0 "$server_pid"
  sleep 0.1
done
test -s "$CURL_HOME/port" || { cat "$CURL_HOME/log"; exit 1; }
printf 'connect-to = "api.github.com:443:127.0.0.1:%s"\ncacert = "%s"\nnoproxy = "api.github.com"\n' \
  "$(cat "$CURL_HOME/port")" "$CURL_HOME/cert.pem" > "$CURL_HOME/.curlrc"
```

## Testing

```bash
# should explain the cloud wrapper and require a revision before provisioning options
bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" --help | grep -F 'Usage: bash scripts/cloud-setup.sh [--debug] REF [TANABOOT_OPTIONS...]'
for input in '' --debug --agent --ref=main; do
  status=0
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$input" 2>&1) || status=$?
  test "$status" -eq 2
  grep -F 'Provide a channel, branch, tag or full commit SHA' <<< "$output"
done

# should select main and recover a reachable tag in a shallow workspace
git clone -q --depth=1 --no-tags "file://$TMPDIR/remote" "$TMPDIR/branch-workspace"
cd "$TMPDIR/branch-workspace"
git remote set-url origin https://github.com/tanaabased/tanaabot.git
git config "url.file://$TMPDIR/remote.insteadOf" https://github.com/tanaabased/tanaabot.git
test "$(git rev-parse --is-shallow-repository)" = true
output=$(CLOUD_SETUP_DEBUG=0 bash scripts/cloud-setup.sh --debug main --version 2> "$TMPDIR/wrapper-debug")
sha=$(cat "$TMPDIR/second")
grep -F "Workspace revision: main ($sha)" <<< "$output"
grep -Fx 'fixture-second' <<< "$output"
grep -F "fetching branch commit $sha with tags (shallow checkout: true)" "$TMPDIR/wrapper-debug"
[[ "$output" != *'debug: cloud setup:'* ]]
test "$(git rev-parse HEAD)" = "$sha"
test "$(git rev-parse --is-shallow-repository)" = false
test "$(git describe --tags --always --dirty)" = "pilot-1-g$(git rev-parse --short HEAD)"
test -z "$(git status --porcelain)"
test ! -e "${XDG_DATA_HOME:-$HOME/.local/share}/tanaabot/sources/tanaabot"

# should pick up a newly added lightweight tag when refreshing the same revision
cd "$TMPDIR/branch-workspace"
git -C "$TMPDIR/remote" tag refresh "$(cat "$TMPDIR/second")"
bash scripts/cloud-setup.sh main --version
test "$(git describe --tags --always --dirty)" = refresh
test "$(git rev-parse --is-shallow-repository)" = false

# should peel an annotated tag even when checkout removes the running wrapper
git clone -q "$TMPDIR/remote" "$TMPDIR/tag-workspace"
cd "$TMPDIR/tag-workspace"
git remote set-url origin https://github.com/tanaabased/tanaabot.git
git config "url.file://$TMPDIR/remote.insteadOf" https://github.com/tanaabased/tanaabot.git
mkdir "$TMPDIR/snapshots"
output=$(TMPDIR="$TMPDIR/snapshots" bash scripts/cloud-setup.sh pilot --version 2>&1)
sha=$(cat "$TMPDIR/release")
grep -F "Workspace revision: pilot ($sha)" <<< "$output"
grep -Fx 'fixture-first' <<< "$output"
test "$(git rev-parse HEAD)" = "$sha"
test ! -e scripts/cloud-setup.sh
test -z "$(find "$TMPDIR/snapshots" -mindepth 1 -print -quit)"

# should accept a full commit and fall back to its hash when no tag is reachable
cd "$TMPDIR/branch-workspace"
sha=$(cat "$TMPDIR/first")
bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$sha" --version | grep -Fx 'fixture-first'
test "$(git rev-parse HEAD)" = "$sha"
test "$(git describe --tags --always --dirty)" = "$(git rev-parse --short HEAD)"

# should forward mode and action options to the selected revision
cd "$TMPDIR/branch-workspace"
output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" main -- --agent --dry-run --debug=false)
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"
grep -F 'Home-relative dotpackages through Bootbox' <<< "$output"
[[ "$output" != *'host'* ]]

# should keep wrapper and installer diagnostics independent
cd "$TMPDIR/branch-workspace"
output=$(CLOUD_SETUP_DEBUG=0 TANABOOT_DEBUG=0 bash scripts/cloud-setup.sh main --debug --dry-run 2>&1)
grep -F 'debug: target=bootstrap action=plan' <<< "$output"
[[ "$output" != *'debug: cloud setup:'* ]]
output=$(CLOUD_SETUP_DEBUG=1 TANABOOT_DEBUG=0 bash scripts/cloud-setup.sh main --dry-run --op-token=private-example 2>&1)
grep -F 'debug: cloud setup: starting Tanaboot' <<< "$output"
[[ "$output" != *'debug: target='* && "$output" != *private-example* ]]

# should preserve local workspace changes without changing its revision
cd "$TMPDIR/tag-workspace"
printf 'operator change' > operator-file
status=0
output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" main --host 2>&1) || status=$?
test "$status" -eq 1
grep -F 'Workspace has local changes' <<< "$output"
test "$(cat operator-file)" = 'operator change'
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/release")"

# should reject a noncanonical workspace without changing its origin or revision
git clone -q "$TMPDIR/remote" "$TMPDIR/other-workspace"
cd "$TMPDIR/other-workspace"
status=0
output=$(bash scripts/cloud-setup.sh main --host 2>&1) || status=$?
test "$status" -eq 1
grep -F 'Workspace origin is not the canonical' <<< "$output"
test "$(git remote get-url origin)" = "$TMPDIR/remote"
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"

# should reject a branch and tag collision without substituting main
git -C "$TMPDIR/remote" branch pilot
cd "$TMPDIR/branch-workspace"
status=0
output=$(bash scripts/cloud-setup.sh pilot --host 2>&1) || status=$?
test "$status" -eq 1
grep -F 'Reference is ambiguous' <<< "$output"
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"

# should fail missing references, commits and entrypoints without changing the workspace
cd "$TMPDIR/branch-workspace"
for ref in unavailable ffffffffffffffffffffffffffffffffffffffff no-installer; do
  status=0
  output=$(bash scripts/cloud-setup.sh "$ref" --host 2>&1) || status=$?
  test "$status" -eq 1
  test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"
  test -z "$(git status --porcelain)"
done

# should preserve the selected entrypoint's failure status
cd "$TMPDIR/branch-workspace"
status=0
output=$(bash scripts/cloud-setup.sh main --host --agent 2>&1) || status=$?
test "$status" -eq 2
grep -F 'Choose only one setup mode' <<< "$output"
test -z "$(git status --porcelain)"

# should preserve the current revision and local tag when a required tag fetch conflicts
cd "$TMPDIR/branch-workspace"
first=$(cat "$TMPDIR/first")
git tag conflict "$first"
git -C "$TMPDIR/remote" tag conflict "$(cat "$TMPDIR/second")"
status=0
output=$(bash scripts/cloud-setup.sh "$first" --version 2>&1) || status=$?
test "$status" -eq 1
grep -F 'Could not fetch the resolved commit and tags' <<< "$output"
test "$(git rev-parse conflict)" = "$first"
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"

# should select the canonical default branch for dev regardless of local refs
cd "$TMPDIR/channel-workspace"
test "$(git symbolic-ref refs/remotes/origin/HEAD)" = refs/remotes/origin/main
first=$(cat "$TMPDIR/first")
output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" dev --version)
grep -F "Workspace revision: dev ($first)" <<< "$output"
test "$(git rev-parse HEAD)" = "$first"

# should report a fallback for both aliases when no published release qualifies
cd "$TMPDIR/channel-workspace"
first=$(cat "$TMPDIR/first")
printf '%s\n' '{"pages":[[]]}' > "$CURL_HOME/responses.json"
for alias in stable edge; do
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$alias" --version 2>&1)
  grep -F "$alias has no eligible GitHub release. Falling back to dev." <<< "$output"
  grep -F "Workspace revision: $alias ($first)" <<< "$output"
  test "$(git rev-parse HEAD)" = "$first"
done

# should use the latest release tag for stable even when a branch has the same name
cd "$TMPDIR/channel-workspace"
jq '{latest:.latest}' "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
release=$(cat "$TMPDIR/release")
output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" stable --version)
grep -F "Workspace revision: stable ($release)" <<< "$output"
test "$(git rev-parse HEAD)" = "$release"

# should limit prereleases and regular releases without latest status to edge
cd "$TMPDIR/channel-workspace"
for release_type in preview regular; do
  jq --arg release "$release_type" '{pages:[[.[$release]]]}' "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" stable --version 2>&1)
  grep -F 'stable has no eligible GitHub release. Falling back to dev.' <<< "$output"
  test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/first")"
  case "$release_type" in
    preview) expected=$(cat "$TMPDIR/first") ;;
    regular) expected=$(cat "$TMPDIR/second") ;;
  esac
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" edge --version 2>&1)
  grep -F "Workspace revision: edge ($expected)" <<< "$output"
  [[ "$output" != *'Falling back'* ]]
  test "$(git rev-parse HEAD)" = "$expected"
done

# should choose edge by publication time across pages even when latest status differs
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
cd "$TMPDIR/channel-workspace"
jq '{pages:[[.regular],[.draft,.preview]]}' "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" edge --version
test "$(git rev-parse HEAD)" = "$(cat "$TMPDIR/second")"

# should preserve the checkout when github cannot confirm a release selection
cd "$TMPDIR/channel-workspace"
before=$(git rev-parse HEAD)
while IFS='|' read -r alias query expected; do
  jq "$query" "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
  status=0
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" "$alias" --version 2>&1) || status=$?
  test "$status" -eq 1
  grep -F "$expected" <<< "$output"
  [[ "$output" != *'Falling back'* ]]
  test "$(git rev-parse HEAD)" = "$before"
done <<'CASES'
stable|{latest:401}|HTTP 401
stable|{pages:[404]}|Could not confirm
edge|{pages:[[.preview],429]}|page 2 (HTTP 429)
edge|{pages:[[.preview],{}]}|invalid data on page 2
CASES

# should fail release lookup on a tls error without using dev
cd "$TMPDIR/channel-workspace"
before=$(git rev-parse HEAD)
mkdir "$TMPDIR/untrusted-api"
sed '/^cacert =/d' "$CURL_HOME/.curlrc" > "$TMPDIR/untrusted-api/.curlrc"
status=0
output=$(CURL_HOME="$TMPDIR/untrusted-api" bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" edge --version 2>&1) || status=$?
test "$status" -eq 1
grep -F "GitHub 'edge' release lookup failed" <<< "$output"
[[ "$output" != *'Falling back'* ]]
test "$(git rev-parse HEAD)" = "$before"

# should fail selected releases with a missing tag or installer without using another revision
cd "$TMPDIR/channel-workspace"
before=$(git rev-parse HEAD)
while IFS='|' read -r tag expected; do
  jq --arg tag "$tag" '{latest:(.latest | .tag_name = $tag)}' \
    "$CURL_HOME/catalog.json" > "$CURL_HOME/responses.json"
  status=0
  output=$(bash "$TANABOOT_PACKAGE_ROOT/scripts/cloud-setup.sh" stable --version 2>&1) || status=$?
  test "$status" -eq 1
  grep -F "$expected" <<< "$output"
  [[ "$output" != *'Falling back'* ]]
  test "$(git rev-parse HEAD)" = "$before"
done <<'CASES'
missing-tag|Could not resolve the selected GitHub release tag
without-installer|Selected revision has no tanaboot.sh entrypoint
CASES
```

## Cleanup

```bash
# should stop the local release endpoint
if test -s "$CURL_HOME/pid"; then
  kill "$(cat "$CURL_HOME/pid")"
fi
```
