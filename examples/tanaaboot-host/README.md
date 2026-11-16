# Tanaboot host

Run the packaged host mode with the runner's existing Homebrew. Verify Tanaboot's dependency
readiness, runtime declaration and host/agent separation. Homebrew and Bootbox own their installer
coverage; this scenario does not repeat cold bootstrap or upstream download failures.

## Setup

```bash
# should install host dependencies without accepting inherited key provisioning
brew --prefix > "$TMPDIR/brew-prefix-before"
set -o pipefail
BOOTBOX_SSH_KEY=unrequested/key BOOTBOX_OP_TOKEN= OP_SERVICE_ACCOUNT_TOKEN= tanaboot.sh --host 2>&1 | tee "$TMPDIR/setup.log"
```

## Testing

```bash
# should satisfy host readiness
PATH="$(brew --prefix node@26)/bin:$PATH" tanaboot.sh --host --check

# should reuse existing homebrew without provisioning an unrequested key
test "$(brew --prefix)" = "$(cat "$TMPDIR/brew-prefix-before")"
! grep -F 'Installing Homebrew at' "$TMPDIR/setup.log"
test ! -e "$HOME/.ssh/key"

# should reject an incompatible runtime declaration without repairing it
cp -a "$TANABOOT_PACKAGE_ROOT" "$TMPDIR/incompatible-runtime"
cp incompatible-node-version "$TMPDIR/incompatible-runtime/.node-version"
status=0
output=$(PATH="$(brew --prefix node@26)/bin:$PATH" bash "$TMPDIR/incompatible-runtime/tanaboot.sh" --host --check 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'Node does not match'
cmp incompatible-node-version "$TMPDIR/incompatible-runtime/.node-version"

# should leave agent guidance and plugin configuration absent
test ! -e "$HOME/.codex/AGENTS.md"
test ! -e "$HOME/.codex/config.toml"
test ! -e "$HOME/.config/tanaabot/env.sh"
```
