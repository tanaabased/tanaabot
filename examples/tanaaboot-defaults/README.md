# Tanaboot defaults

Run the packaged entrypoint once with no mode selection, then inspect the resulting Linux tools,
guidance and shell configuration.
CI supplies the prepared package on a disposable runner; this proves
runner installation, while fresh-task Codex Cloud discovery remains a separate acceptance check.

## Setup

```bash
# should record existing identity and access configuration
for file in .gitconfig .ssh/config .config/gh/hosts.yml; do
  if test -f "$HOME/$file"; then sha256sum "$HOME/$file"; else printf 'missing %s\n' "$file"; fi
done > "$TMPDIR/access-before"

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
bash -lc 'bun_major=$(cut -d . -f 1 "$TANABOOT_PACKAGE_ROOT/.bun-version"); case "$(bun --version)" in "$bun_major."*) ;; *) exit 1;; esac'
bash -lc 'node_major=$(cut -d . -f 1 "$TANABOOT_PACKAGE_ROOT/.node-version"); case "$(node --version)" in "v$node_major."*) ;; *) exit 1;; esac'

# should apply guidance without folding private configuration into the source
test -d "$HOME/.codex"
test ! -L "$HOME/.codex"
test -L "$HOME/.codex/AGENTS.md"
cmp -s "$HOME/.codex/AGENTS.md" "$TANABOOT_PACKAGE_ROOT/dotfiles/ai/.codex/AGENTS.md"
test ! -e "$TANABOOT_PACKAGE_ROOT/dotfiles/ai/.codex/config.toml"

# should verify installed tools and readable configuration
bash -lc 'bash "$TANABOOT_PACKAGE_ROOT/tanaboot.sh" --check'

# should check offline with read-only home and homebrew
bash -l <<'SH'
set -euo pipefail
sudo unshare --mount --net -- /bin/bash -s -- "$HOME" "$(brew --prefix)" "$PATH" "$(id -u)" "$TANABOOT_PACKAGE_ROOT" <<'ROOT'
set -euo pipefail
mount --make-rprivate /
for directory in "$1" "$2"; do
  mount --bind "$directory" "$directory"
  mount -o remount,bind,ro "$directory"
done
exec sudo -u "#$4" env HOME="$1" PATH="$3" HISTFILE=/dev/null /bin/bash "$5/tanaboot.sh" --check
ROOT
SH

# should preserve existing identity and access configuration
for file in .gitconfig .ssh/config .config/gh/hosts.yml; do
  if test -f "$HOME/$file"; then sha256sum "$HOME/$file"; else printf 'missing %s\n' "$file"; fi
done > "$TMPDIR/access-after"
cmp "$TMPDIR/access-before" "$TMPDIR/access-after"
```
