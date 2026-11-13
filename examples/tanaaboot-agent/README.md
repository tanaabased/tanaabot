# Tanaboot agent

Prepare host tools, apply the packaged agent mode, and rerun it to check convergence. The scenario
owns guidance, shell initialization and enabled plugins on a disposable Linux runner. It does
not configure accounts, retrieve secrets or establish fresh-task Codex Cloud discovery.

## Setup

```bash
# should prepare the host prerequisite
tanaboot.sh --host

# should retain an existing login profile before agent setup
test ! -e "$HOME/.bash_profile"
cp bash-profile "$HOME/.bash_profile"

# should install agent guidance and plugins
set -o pipefail
tanaboot.sh --agent 2>&1 | tee "$TMPDIR/setup.log"
```

## Testing

```bash
# should report successful agent setup
grep -F 'done: agent apply complete.' "$TMPDIR/setup.log"

# should satisfy agent readiness
bash -lc 'bash "$TANABOOT_PACKAGE_ROOT/tanaboot.sh" --agent --check'

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

# should rerun without duplicating startup configuration
tanaboot.sh --agent
for file in .bash_profile .bashrc; do
  test "$(grep -cF '. "$HOME/.config/tanaabot/env.sh"' "$HOME/$file")" -eq 1
done
bash -lc 'bash "$TANABOOT_PACKAGE_ROOT/tanaboot.sh" --agent --check'

# should install runtime dependencies without development tooling
test -x "$TANABOOT_PACKAGE_ROOT/node_modules/.bin/codex-tools"
test ! -e "$TANABOOT_PACKAGE_ROOT/node_modules/mocha"
test ! -e "$TANABOOT_PACKAGE_ROOT/node_modules/eslint"

# should fail declared plugin readiness when canon has not been installed
status=0
output=$(bash -lc 'bash "$TANABOOT_PACKAGE_ROOT/tanaboot.sh" --agent --codex-plugin canon#main --check' 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Selected source is missing'
```
