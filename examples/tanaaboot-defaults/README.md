# Tanaboot defaults

Run the packaged entrypoint once with no mode selection, then inspect the resulting Linux tools,
guidance and plugins. CI supplies an isolated writable home and the prepared package; this proves
runner installation, while fresh-task Codex Cloud discovery remains a separate acceptance check.

## Setup

```bash
# should run the default setup once
set -o pipefail
tanaboot.sh 2>&1 | tee "$TMPDIR/setup.log"
```

## Testing

```bash
# should report successful default setup
grep -F 'done: bootstrap apply complete.' "$TMPDIR/setup.log"

# should make the complete toolchain available
for tool in brew git curl zsh jq stow op gh; do
  command -v "$tool" >/dev/null
done

# should satisfy the selected host inventory
brew bundle check --file "$TANABOOT_PACKAGE_ROOT/Brewfile" --no-upgrade

# should load the declared runtimes in a fresh login shell
bash -lc 'test "$(bun --version)" = "$(cat "$TANABOOT_PACKAGE_ROOT/.bun-version")"'
bash -lc 'node_major=$(cut -d . -f 1 "$TANABOOT_PACKAGE_ROOT/.node-version"); case "$(node --version)" in "v$node_major."*) ;; *) exit 1;; esac'

# should apply guidance without folding private configuration into the source
test -d "$HOME/.codex"
test ! -L "$HOME/.codex"
test -L "$HOME/.codex/AGENTS.md"
cmp -s "$HOME/.codex/AGENTS.md" "$TANABOOT_PACKAGE_ROOT/dotfiles/ai/.codex/AGENTS.md"
test ! -e "$TANABOOT_PACKAGE_ROOT/dotfiles/ai/.codex/config.toml"

# should verify both enabled plugins and the completed setup
tanaboot.sh --check

# should leave deferred identity and access configuration inactive
test ! -e "$HOME/.gitconfig"
test ! -e "$HOME/.ssh/config"
test ! -e "$HOME/.config/gh/hosts.yml"
```
