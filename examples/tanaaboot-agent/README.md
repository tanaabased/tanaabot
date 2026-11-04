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

# should install repeated published and git plugin selections
cp -R plugin "$TMPDIR/plugin"
git -C "$TMPDIR/plugin" init -q -b main
git -C "$TMPDIR/plugin" add .
git -C "$TMPDIR/plugin" -c user.name=Test -c user.email=test@example.invalid commit -qm 'plugin fixture'
sha=$(git -C "$TMPDIR/plugin" rev-parse HEAD)
GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0="url.$TMPDIR/plugin.insteadOf" GIT_CONFIG_VALUE_0=https://github.com/tanaabased/tanaboot-probe.git \
  tanaboot.sh --agent --codex-plugin npm:@tanaab/codex-tools@1.0.3 --codex-plugin "tanaboot-probe#$sha"
source="${XDG_DATA_HOME:-$HOME/.local/share}/tanaabot/sources/tanaboot-probe/$sha"
test "$(git -C "$source" rev-parse HEAD)" = "$sha"
bun "$TANABOOT_PACKAGE_ROOT/node_modules/.bin/codex-tools" status --repo-root "$source" --json | \
  jq -e '.ok and .inspection.installed and .inspection.enabled'
```
