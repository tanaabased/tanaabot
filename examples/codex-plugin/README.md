# Install the packaged Codex plugin

Install the release candidate in the workflow’s disposable Codex home and check the installed skills.

## Testing

```bash
# should install and enable tanaabot from the packed candidate
mkdir -p "$TMPDIR/marketplace"
bun ../../node_modules/.bin/codex-tools install "$TANABOOT_PACKAGE_ROOT" --marketplace tanaabot-test \
  --marketplace-path "$TMPDIR/marketplace/.agents/plugins/marketplace.json" --json \
  | jq -e '.ok == true and .inspection.installed == true and .inspection.enabled == true'

# should read the startup skill from the current installed cache
cache="$(bun ../../node_modules/.bin/codex-tools cache check --repo-root "$TANABOOT_PACKAGE_ROOT" --marketplace tanaabot-test --json \
  | jq -er 'select(.ok == true and .status == "current") | .cachePath')"
cmp "$TANABOOT_PACKAGE_ROOT/skills/startup-check/SKILL.md" "$cache/skills/startup-check/SKILL.md"
```
