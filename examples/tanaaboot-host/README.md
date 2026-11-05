# Tanaboot host

Run only the packaged host mode on a disposable Linux runner. Check the complete host inventory
and confirm that guidance and plugin installation remain outside this mode.

## Setup

```bash
# should install host dependencies once
set -o pipefail
tanaboot.sh --host 2>&1 | tee "$TMPDIR/setup.log"
```

## Testing

```bash
# should report successful host setup
grep -F 'done: host apply complete.' "$TMPDIR/setup.log"

# should satisfy host readiness
tanaboot.sh --host --check
brew bundle check --file "$TANABOOT_PACKAGE_ROOT/Brewfile" --no-upgrade

# should leave agent guidance and plugin configuration absent
test ! -e "$HOME/.codex/AGENTS.md"
test ! -e "$HOME/.codex/config.toml"
test ! -e "$HOME/.config/tanaabot/env.sh"

# should keep the packed source free of development dependencies
test ! -e "$TANABOOT_PACKAGE_ROOT/node_modules"
```
