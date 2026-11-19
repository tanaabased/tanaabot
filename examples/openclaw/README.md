# OpenClaw example

Validate the packaged tanaabot profile and install its skills in an isolated OpenClaw workspace.

## Testing

```bash
# should validate the packaged agent profile with OPENCLAW
cd "$TANABOOT_PACKAGE_ROOT"
"$OPENCLAW_CLI" agent-system validate --json | jq -e '.status == "valid" and .agentId == "tanaabot"'

# should discover the voice skill after installing the packaged plugin
cd "$OPENCLAW_WORKSPACE"
"$OPENCLAW_CLI" plugins install "$TANABOOT_PACKAGE_ROOT" --force --accept-capabilities
"$OPENCLAW_CLI" skills list --json | jq -e 'any(.skills[]; .name == "tanaabot-voice" and .eligible)'
```
