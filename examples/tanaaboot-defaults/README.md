# Tanaboot defaults

Run the packaged entrypoint through Cloud setup with no mode selection, then inspect the resulting Linux tools,
dotfiles and approved SSH key on a disposable runner. CI supplies `TANAABOTKEY` as
`OP_SERVICE_ACCOUNT_TOKEN`; an authorized Cloud run supplies it privately. Use the prepared package;
fresh-task Codex Cloud startup remains a separate acceptance check.

## Setup

```bash
# should record existing github authentication state
for file in .config/gh/hosts.yml; do
  if test -f "$HOME/$file"; then sha256sum "$HOME/$file"; else printf 'missing %s\n' "$file"; fi
done > "$TMPDIR/access-before"

# should run the default setup once
set -o pipefail
workspace="$TMPDIR/setup-workspace"
mkdir "$workspace"
cp -a "$TANABOOT_PACKAGE_ROOT/." "$workspace"
git -C "$workspace" init -qb main
git -C "$workspace" add .
git -C "$workspace" -c user.name=Test -c user.email=test@example.invalid commit -qm candidate
git -C "$workspace" remote add origin https://github.com/tanaabased/tanaabot.git
git -C "$workspace" config "url.file://$workspace.insteadOf" https://github.com/tanaabased/tanaabot.git
cd "$workspace"
bash scripts/cloud-setup.sh main | tee "$TMPDIR/setup-output"
```

## Testing

```bash
# should apply guidance without folding private configuration into the source
test -d "$HOME/.codex"
test ! -L "$HOME/.codex"
test -L "$HOME/.codex/AGENTS.md"
cmp -s "$HOME/.codex/AGENTS.md" "$TANABOOT_PACKAGE_ROOT/dotfiles/ai/.codex/AGENTS.md"
test ! -e "$TANABOOT_PACKAGE_ROOT/dotfiles/ai/.codex/config.toml"

# should prepare a receipt for the installed commit outside the clean checkout
workspace="$TMPDIR/setup-workspace"
receipt="$HOME/.local/state/tanaabot/publication.json"
setup_id=$(jq -er '.setupId' "$receipt")
grep -Fx "note: Setup ID: $setup_id" "$TMPDIR/setup-output"
jq -e --arg sha "$(git -C "$workspace" rev-parse HEAD)" '
  .installedCommit == $sha and .selector == "main" and .target == {branch: "main"}
' "$receipt"
test -z "$(git -C "$workspace" status --porcelain)"
bun --no-env-file "$workspace/scripts/publication-task.js" local "$setup_id"

# should leave the receipt alone on a preview or rejected setup
cd "$TMPDIR/setup-workspace"
receipt="$HOME/.local/state/tanaabot/publication.json"
before=$(sha256sum "$receipt")
bash scripts/cloud-setup.sh main --dry-run
status=0
bash scripts/cloud-setup.sh main --host --agent || status=$?
test "$status" -eq 2
test "$(sha256sum "$receipt")" = "$before"

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
exec sudo -u "#$4" env HOME="$1" PATH="$3" HISTFILE=/dev/null /bin/bash -lc 'bash "$1/tanaboot.sh" --check' _ "$5"
ROOT
SH

# should install the requested identity configuration
test "$(git config --global user.email)" = tanaabot@tanaab.dev
test "$(git config --global gpg.format)" = ssh
test -L "$HOME/.ssh/config"
test -L "$HOME/.ssh/id_tanaabot.pub"
test -f "$HOME/.ssh/id_tanaabot"
test ! -L "$HOME/.ssh/id_tanaabot"

# should preserve existing github authentication state
for file in .config/gh/hosts.yml; do
  if test -f "$HOME/$file"; then sha256sum "$HOME/$file"; else printf 'missing %s\n' "$file"; fi
done > "$TMPDIR/access-after"
cmp "$TMPDIR/access-before" "$TMPDIR/access-after"
```
