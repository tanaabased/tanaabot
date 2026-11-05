# Tanaboot agent

Prepare host tools, apply the packaged agent mode, and rerun it to check convergence. The scenario
owns guidance, shell initialization and enabled plugins on a disposable Linux runner. It does
not configure accounts, retrieve secrets or establish fresh-task Codex Cloud discovery.

## Setup

```bash
# should prepare the host prerequisite
tanaboot.sh --host

# should install agent guidance and plugins
set -o pipefail
tanaboot.sh --agent 2>&1 | tee "$TMPDIR/setup.log"
```

## Testing

```bash
# should report successful agent setup
grep -F 'done: agent apply complete.' "$TMPDIR/setup.log"

# should satisfy agent readiness
tanaboot.sh --agent --check

# should initialize the published tools in a fresh interactive shell
bash -ic 'command -v brew >/dev/null; command -v node >/dev/null; command -v bun >/dev/null'

# should rerun without duplicating startup configuration
tanaboot.sh --agent
for file in .profile .bashrc; do
  test "$(grep -cF '. "$HOME/.config/tanaabot/env.sh"' "$HOME/$file")" -eq 1
done
tanaboot.sh --agent --check

# should install runtime dependencies without development tooling
test -x "$TANABOOT_PACKAGE_ROOT/node_modules/.bin/codex-tools"
test ! -e "$TANABOOT_PACKAGE_ROOT/node_modules/mocha"
test ! -e "$TANABOOT_PACKAGE_ROOT/node_modules/eslint"

# should fail declared plugin readiness when canon has not been installed
status=0
output=$(tanaboot.sh --agent --codex-plugin canon#main --check 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Selected source is missing'
```
