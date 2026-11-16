# Tanaboot agent

Prepare host tools, apply the packaged agent mode, and rerun it to check convergence. The scenario
owns dotfiles and the approved SSH key on a disposable runner. CI supplies the approved
`TANAABOTKEY` secret as `OP_SERVICE_ACCOUNT_TOKEN`; an authorized Cloud run supplies it privately.
The service account needs read access to the configured key item and Environment. This scenario does not
register keys with GitHub or establish fresh-task Codex Cloud startup. Negative cases temporarily
replace installed inputs and restore them within the same test; they never modify packaged sources.

## Setup

```bash
# should prepare the host prerequisite
tanaboot.sh --host

# should retain an existing login profile before agent setup
printf '\n' >> "$HOME/.bash_profile"
cat bash-profile >> "$HOME/.bash_profile"
cp "$HOME/.bash_profile" "$TMPDIR/bash-profile-before-agent"

# should install agent dotfiles and the approved ssh key
tanaboot.sh --agent
```

## Testing

```bash
# should satisfy agent readiness
bash -lc 'bash "$TANABOOT_PACKAGE_ROOT/tanaboot.sh" --agent --check'

# should keep the private key outside the source checkout
test -f "$HOME/.ssh/id_tanaabot"
test ! -L "$HOME/.ssh"
test ! -L "$HOME/.ssh/id_tanaabot"
test ! -e "$TANABOOT_PACKAGE_ROOT/dotfiles/ssh/.ssh/id_tanaabot"

# should install the approved private key with owner-only access
test "$(stat -c '%a' "$HOME/.ssh")" = 700
test "$(stat -c '%a' "$HOME/.ssh/id_tanaabot")" = 600
test "$(stat -c '%u' "$HOME/.ssh/id_tanaabot")" = "$(id -u)"
ssh-keygen -y -P '' -f "$HOME/.ssh/id_tanaabot" | cut -d ' ' -f 1,2 | cmp - "$TANABOOT_PACKAGE_ROOT/dotfiles/ssh/.ssh/id_tanaabot.pub"

# should keep the environment snapshot private and outside packaged sources
test ! -L "$HOME/.local/state/tanaabot"
test ! -L "$HOME/.local/state/tanaabot/environment.json"
test "$(stat -c '%a' "$HOME/.local/state/tanaabot")" = 700
test "$(stat -c '%a' "$HOME/.local/state/tanaabot/environment.json")" = 600
test "$(stat -c '%u' "$HOME/.local/state/tanaabot/environment.json")" = "$(id -u)"
case "$(realpath "$HOME/.local/state/tanaabot/environment.json")" in "$TANABOOT_PACKAGE_ROOT"/*) exit 1 ;; esac

# should export literal multiline and empty values without evaluating shell expressions
cp "$HOME/.local/state/tanaabot/environment.json" "$TMPDIR/environment-before"
trap 'cp "$TMPDIR/environment-before" "$HOME/.local/state/tanaabot/environment.json"' EXIT
jq --slurpfile values environment-values.json '.variables = $values[0]' "$TMPDIR/environment-before" > "$HOME/.local/state/tanaabot/environment.json"
cd "$TMPDIR"
env -u TANABOOT_LITERAL -u TANABOOT_MULTILINE -u TANABOOT_EMPTY bash -lc 'bun --no-env-file "$TANABOOT_PACKAGE_ROOT/scripts/environment-task.js" --check'
test ! -e should-not-exist

# should detect a missing export using names from the saved file
. "$HOME/.config/tanaabot/env.sh"
name=$(jq -r '.variables | keys[0]' "$HOME/.local/state/tanaabot/environment.json")
status=0
output=$(env -u "$name" bun --no-env-file "$TANABOOT_PACKAGE_ROOT/scripts/environment-task.js" --check 2>&1) || status=$?
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'missing or differ'

# should preserve the previous snapshot when refresh cannot launch 1password
cp "$HOME/.local/state/tanaabot/environment.json" "$TMPDIR/environment-before-failure"
mkdir -p "$TMPDIR/empty-path"
bun_path=$(command -v bun)
status=0
output=$(PATH="$TMPDIR/empty-path" "$bun_path" --no-env-file "$TANABOOT_PACKAGE_ROOT/scripts/environment-task.js" --refresh 2>&1) || status=$?
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'previous file was preserved'
cmp "$TMPDIR/environment-before-failure" "$HOME/.local/state/tanaabot/environment.json"

# should refuse an explicit refresh without a token and preserve the snapshot
cp "$HOME/.local/state/tanaabot/environment.json" "$TMPDIR/environment-without-token"
status=0
output=$(env -u OP_SERVICE_ACCOUNT_TOKEN bun --no-env-file "$TANABOOT_PACKAGE_ROOT/scripts/environment-task.js" --refresh 2>&1) || status=$?
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Set OP_SERVICE_ACCOUNT_TOKEN'
cmp "$TMPDIR/environment-without-token" "$HOME/.local/state/tanaabot/environment.json"

# should reject a world-readable environment without repairing it
trap 'chmod 600 "$HOME/.local/state/tanaabot/environment.json"' EXIT
chmod 644 "$HOME/.local/state/tanaabot/environment.json"
status=0
output=$(bun --no-env-file "$TANABOOT_PACKAGE_ROOT/scripts/environment-task.js" --check 2>&1) || status=$?
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'unsafe ownership, permissions or a symlink'
test "$(stat -c '%a' "$HOME/.local/state/tanaabot/environment.json")" = 644

# should reject malformed saved data without exposing its contents
cp "$HOME/.local/state/tanaabot/environment.json" "$TMPDIR/environment-valid"
trap 'cp "$TMPDIR/environment-valid" "$HOME/.local/state/tanaabot/environment.json"' EXIT
printf '{"variables":{"TANABOOT_SECRET":"private-parser-marker"' > "$HOME/.local/state/tanaabot/environment.json"
status=0
output=$(bun --no-env-file "$TANABOOT_PACKAGE_ROOT/scripts/environment-task.js" --check 2>&1) || status=$?
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Cannot read or refresh'
! printf '%s\n' "$output" | grep -F 'private-parser-marker'

# should refuse a symlinked environment without following or replacing it
mv "$HOME/.local/state/tanaabot/environment.json" "$TMPDIR/environment-real"
trap 'rm -f "$HOME/.local/state/tanaabot/environment.json"; mv "$TMPDIR/environment-real" "$HOME/.local/state/tanaabot/environment.json"' EXIT
ln -s "$TMPDIR/environment-real" "$HOME/.local/state/tanaabot/environment.json"
status=0
output=$(bun --no-env-file "$TANABOOT_PACKAGE_ROOT/scripts/environment-task.js" --refresh 2>&1) || status=$?
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'unsafe ownership, permissions or a symlink'
test -L "$HOME/.local/state/tanaabot/environment.json"

# should preserve existing login profile contents when adding initialization
head -c "$(wc -c < "$TMPDIR/bash-profile-before-agent")" "$HOME/.bash_profile" | cmp - "$TMPDIR/bash-profile-before-agent"

# should initialize the published tools in a fresh interactive shell
env -u BASH_ENV PATH=/usr/bin:/bin bash -ic 'set -e; command -v brew; command -v node; command -v bun'

# should preserve the active login profile and load its tools without inherited paths
env -u BASH_ENV PATH=/usr/bin:/bin bash -lc 'set -e; test "$TANABOOT_PROFILE_SENTINEL" = preserved; command -v brew; command -v node; command -v bun'

# should reject a command environment missing homebrew rather than activating it during checks
status=0
output=$(PATH=/usr/bin:/bin /bin/bash "$TANABOOT_PACKAGE_ROOT/tanaboot.sh" --agent --check 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'brew is required'

# should detect a login profile that contains an unreachable initializer
cp "$HOME/.bash_profile" "$TMPDIR/bash-profile-before"
trap 'cp "$TMPDIR/bash-profile-before" "$HOME/.bash_profile"' EXIT
{ printf 'return 0\n'; cat "$TMPDIR/bash-profile-before"; } > "$HOME/.bash_profile"
status=0
output=$(. "$HOME/.config/tanaabot/env.sh"; tanaboot.sh --agent --check 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Fresh Bash cannot discover'

# should reject changed guidance without repairing it
mv "$HOME/.codex/AGENTS.md" "$TMPDIR/guidance-link"
trap 'rm -f "$HOME/.codex/AGENTS.md"; mv "$TMPDIR/guidance-link" "$HOME/.codex/AGENTS.md"' EXIT
cp "$TANABOOT_PACKAGE_ROOT/dotfiles/ai/.codex/AGENTS.md" "$HOME/.codex/AGENTS.md"
printf '\nchanged for the readiness test\n' >> "$HOME/.codex/AGENTS.md"
cp "$HOME/.codex/AGENTS.md" "$TMPDIR/changed-guidance"
status=0
output=$(bash -lc 'bash "$TANABOOT_PACKAGE_ROOT/tanaboot.sh" --agent --check' 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Global guidance is missing or differs'
cmp "$TMPDIR/changed-guidance" "$HOME/.codex/AGENTS.md"

# should refuse a missing key when no service token is supplied
mv "$HOME/.ssh/id_tanaabot" "$TMPDIR/approved-key"
trap 'mv "$TMPDIR/approved-key" "$HOME/.ssh/id_tanaabot"' EXIT
status=0
output=$(env -u OP_SERVICE_ACCOUNT_TOKEN tanaboot.sh --agent 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Set OP_SERVICE_ACCOUNT_TOKEN'
test ! -e "$HOME/.ssh/id_tanaabot"

# should preserve a mismatched private key instead of replacing it
mv "$HOME/.ssh/id_tanaabot" "$TMPDIR/approved-key"
trap 'rm -f "$HOME/.ssh/id_tanaabot"; mv "$TMPDIR/approved-key" "$HOME/.ssh/id_tanaabot"' EXIT
ssh-keygen -q -t ed25519 -N '' -f "$TMPDIR/mismatched-key"
cp "$TMPDIR/mismatched-key" "$HOME/.ssh/id_tanaabot"
status=0
output=$(env -u OP_SERVICE_ACCOUNT_TOKEN tanaboot.sh --agent 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'does not match the approved public key'
cmp "$TMPDIR/mismatched-key" "$HOME/.ssh/id_tanaabot"

# should preserve and reject a symlinked private key
mv "$HOME/.ssh/id_tanaabot" "$TMPDIR/approved-key"
trap 'rm -f "$HOME/.ssh/id_tanaabot"; mv "$TMPDIR/approved-key" "$HOME/.ssh/id_tanaabot"' EXIT
ln -s "$TMPDIR/approved-key" "$HOME/.ssh/id_tanaabot"
status=0
output=$(env -u OP_SERVICE_ACCOUNT_TOKEN tanaboot.sh --agent 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'unsafe path'
test -L "$HOME/.ssh/id_tanaabot"
test "$(readlink "$HOME/.ssh/id_tanaabot")" = "$TMPDIR/approved-key"

# should reuse the approved key without credentials or duplicate startup configuration
sha256sum "$HOME/.ssh/id_tanaabot" > "$TMPDIR/key-before-rerun"
cp "$HOME/.local/state/tanaabot/environment.json" "$TMPDIR/environment-before-rerun"
env -u OP_SERVICE_ACCOUNT_TOKEN tanaboot.sh --agent
sha256sum --check "$TMPDIR/key-before-rerun"
cmp "$TMPDIR/environment-before-rerun" "$HOME/.local/state/tanaabot/environment.json"
for file in .bash_profile .bashrc; do
  test "$(grep -cF '. "$HOME/.config/tanaabot/env.sh"' "$HOME/$file")" -eq 1
done
bash -lc 'bash "$TANABOOT_PACKAGE_ROOT/tanaboot.sh" --agent --check'

# should leave runtime plugin configuration alone
test ! -e "$HOME/.codex/config.toml"
```
