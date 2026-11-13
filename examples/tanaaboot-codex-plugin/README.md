# Tanaboot Codex plugins

Install the real Canon plugin through the packaged Tanaboot entrypoint. CI runs `canon#main` and
`npm:@tanaab/canon@0.13.0` on separate disposable runners. Codex Tools acquires the native Codex CLI;
these checks prove installation and enabled state without starting a model-backed task.

## Setup

```bash
# should install the selected canon plugin with host and agent setup
set -o pipefail
tanaboot.sh --codex-plugin "$CODEX_PLUGIN_SOURCE" --codex-plugin npm:@tanaab/codex-tools@1.0.3 2>&1 | tee "$TMPDIR/setup.log"
```

## Testing

```bash
# should inspect canon through the native codex runtime acquired by codex tools
runtime=$(find "${XDG_CACHE_HOME:-$HOME/.cache}/codex-tools/codex" -type f -name codex -print -quit)
test -x "$runtime"
"$runtime" --version
"$runtime" plugin list --json > "$TMPDIR/plugins.json"
jq -e '.installed | any(.pluginId == "tanaab@personal" and .installed == true and .enabled == true)' "$TMPDIR/plugins.json"
jq -e '.installed | any(.pluginId == "codex-tools@personal" and .installed == true and .enabled == true)' "$TMPDIR/plugins.json"

# should retain the requested source or exact published release
case "$CODEX_PLUGIN_SOURCE" in
  canon#main)
    source="${XDG_DATA_HOME:-$HOME/.local/share}/tanaabot/sources/canon"
    sha=$(git -C "$source" rev-parse HEAD)
    test "$(git -C "$source" config --get remote.origin.url)" = https://github.com/tanaabased/canon.git
    grep -F "Plugin source: canon#main ($sha)" "$TMPDIR/setup.log"
    bash -lc 'bash "$TANABOOT_PACKAGE_ROOT/tanaboot.sh" --agent --codex-plugin "canon#$1" --check' _ "$sha"
    ;;
  npm:@tanaab/canon@0.13.0)
    jq -e '.plugins | any(.name == "tanaab" and .source.source == "npm" and .source.package == "@tanaab/canon" and .source.version == "0.13.0")' "$HOME/.agents/plugins/marketplace.json"
    jq -e '.installed | any(.pluginId == "tanaab@personal" and .version == "0.13.0")' "$TMPDIR/plugins.json"
    ;;
  *) exit 1 ;;
esac

# should check retained canon without consulting a newer or unavailable upstream revision
if test "$CODEX_PLUGIN_SOURCE" = canon#main; then
  git() { case "$1" in ls-remote | fetch) return 99;; *) command git "$@";; esac; }
  export -f git
  bash -lc 'bash "$TANABOOT_PACKAGE_ROOT/tanaboot.sh" --agent --codex-plugin canon#main --check'
fi

# should install canon skill resources in the native cache
version=$(jq -r '.installed[] | select(.pluginId == "tanaab@personal") | .version' "$TMPDIR/plugins.json")
test -f "$HOME/.codex/plugins/cache/personal/tanaab/$version/skills/task-author/SKILL.md"

# should clean a failed plugin acquisition without leaving its lock or staging directory
status=0
output=$(tanaboot.sh --agent --codex-plugin codex-tools#ffffffffffffffffffffffffffffffffffffffff 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 1
printf '%s\n' "$output" | grep -F 'could not be fetched'
sources="${XDG_DATA_HOME:-$HOME/.local/share}/tanaabot/sources"
test ! -e "$sources/codex-tools"
test ! -e "$sources/codex-tools.lock"
test -z "$(find "$sources" -name '.acquire.*')"
```
