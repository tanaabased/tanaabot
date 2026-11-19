# OpenClaw example

Validate the packaged tanaabot profile and install its skills in an isolated OpenClaw workspace.

## Testing

```bash
# should validate the packaged agent profile with OPENCLAW
cd "$TANABOOT_PACKAGE_ROOT"
openclaw agent-system validate --json | jq -e '.status == "valid" and .agentId == "tanaabot"'

# should discover the voice skill after installing the packaged plugin
cd "$OPENCLAW_WORKSPACE"
openclaw plugins install "$TANABOOT_PACKAGE_ROOT" --accept-capabilities
openclaw skills list --json | jq -e 'any(.skills[]; .name == "tanaabot-voice" and .eligible)'
```
