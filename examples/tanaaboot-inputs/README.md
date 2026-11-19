# Tanaboot inputs

Check help, displayed defaults, validation and option precedence without provisioning a host.
The [defaults](../tanaaboot-defaults/README.md), [host](../tanaaboot-host/README.md) and
[agent](../tanaaboot-agent/README.md) scenarios cover installation on disposable CI runners.

## Setup

```bash
# should have packaged tanaboot on path
command -v tanaboot.sh >/dev/null
```

## Testing

```bash
# should show tanaboot usage
tanaboot.sh --help | grep -F 'Usage: tanaboot.sh [TANABOOT_*...] [options]'

# should document public options
help=$(tanaboot.sh --help)
for option in --host --agent --check --dry-run --op-token --debug --version --help; do
  grep -F -- "$option" <<< "$help"
done

# should document each wrapper setting
help=$(tanaboot.sh --help)
for suffix in HOST AGENT CHECK DRY_RUN OP_TOKEN DEBUG VERSION HELP; do
  grep -F "TANABOOT_$suffix " <<< "$help"
done

# should keep internal diagnostic controls out of help
help=$(tanaboot.sh --help)
[[ "$help" != *--debug=* ]]
[[ "$help" != *BOOTBOX_* ]]
[[ "$help" != *RUNNER_DEBUG* ]]
[[ "$help" != *CODEX_HOME* && "$help" != *NO_COLOR* && "$help" != *FORCE_COLOR* ]]

# should inherit mode and action independently
output=$(TANABOOT_HOST=yes TANABOOT_AGENT=off TANABOOT_DRY_RUN=1 tanaboot.sh --debug 2>&1)
grep -F 'target=host action=plan' <<< "$output"
output=$(TANABOOT_HOST=1 TANABOOT_CHECK=yes TANABOOT_DEBUG=1 tanaboot.sh --agent --dry-run 2>&1)
grep -F 'target=agent action=plan' <<< "$output"

# should reject conflicting environment selections
status=0
output=$(TANABOOT_HOST=1 TANABOOT_AGENT=1 tanaboot.sh --dry-run 2>&1) || status=$?
test "$status" -eq 2
grep -F 'Choose only one setup mode' <<< "$output"
status=0
output=$(TANABOOT_DRY_RUN=yes TANABOOT_CHECK=yes tanaboot.sh 2>&1) || status=$?
test "$status" -eq 2
grep -F 'Choose only one of --check or --dry-run' <<< "$output"

# should resolve informational flags before setup
TANABOOT_HELP=1 tanaboot.sh | grep -F 'Usage: tanaboot.sh'
test "$(TANABOOT_VERSION=1 tanaboot.sh)" = "$STAMPED_VERSION"
test "$(TANABOOT_HELP=1 tanaboot.sh --version)" = "$STAMPED_VERSION"
TANABOOT_VERSION=1 tanaboot.sh --help | grep -F 'Usage: tanaboot.sh'

# should resolve the token without printing its value
env -u TANABOOT_OP_TOKEN -u OP_SERVICE_ACCOUNT_TOKEN tanaboot.sh --help | grep -F -- '--op-token TOKEN' | grep -F '[default: unset]'
output=$(TANABOOT_OP_TOKEN=private-wrapper OP_SERVICE_ACCOUNT_TOKEN=private-ambient tanaboot.sh --help)
grep -F '[default: TANABOOT_OP_TOKEN]' <<< "$output"
[[ "$output" != *private-* ]]
for args in '--op-token=private-inline' '--op-token private-separate'; do
  read -ra tokens <<< "$args"
  output=$(TANABOOT_OP_TOKEN=private-wrapper OP_SERVICE_ACCOUNT_TOKEN=private-ambient tanaboot.sh "${tokens[@]}" --debug --help 2>&1)
  grep -F '[default: command line]' <<< "$output"
  [[ "$output" != *private-* ]]
done
output=$(OP_SERVICE_ACCOUNT_TOKEN=private-ambient TANABOOT_OP_TOKEN= tanaboot.sh --debug --help 2>&1)
grep -F '[default: OP_SERVICE_ACCOUNT_TOKEN]' <<< "$output"
[[ "$output" != *private-ambient* ]]

# should reject a missing token value before provisioning
for args in '--op-token' '--op-token=' '--op-token --dry-run'; do
  read -ra tokens <<< "$args"
  status=0
  output=$(tanaboot.sh "${tokens[@]}" 2>&1) || status=$?
  test "$status" -eq 2
  grep -F -- '--op-token requires a token value' <<< "$output"
done

# should show runner debug as the lowest priority default
env -u TANABOOT_DEBUG -u DEBUG RUNNER_DEBUG=1 tanaboot.sh --help | grep -F -- '--debug' | grep -F '[default: on]'
env -u TANABOOT_DEBUG DEBUG=off RUNNER_DEBUG=1 tanaboot.sh --help | grep -F -- '--debug' | grep -F '[default: off]'
TANABOOT_DEBUG=0 DEBUG=1 RUNNER_DEBUG=1 tanaboot.sh --help | grep -F -- '--debug' | grep -F '[default: off]'
TANABOOT_DEBUG=off tanaboot.sh --debug --help | grep -F -- '--debug' | grep -F '[default: on]'

# should retain the hidden diagnostic override
TANABOOT_DEBUG=1 tanaboot.sh --debug=false --help | grep -F -- '--debug' | grep -F '[default: off]'
test -z "$(TANABOOT_DEBUG=1 tanaboot.sh --dry-run --debug=false 2>&1 >/dev/null)"

# should print diagnostics on stderr when enabled
output=$(TANABOOT_DEBUG=1 tanaboot.sh --dry-run 2>&1 >/dev/null)
grep -F 'debug: target=bootstrap action=plan' <<< "$output"

# should respect no color even when color is forced
output=$(NO_COLOR=1 FORCE_COLOR=1 tanaboot.sh --help)
[[ "$output" != *$'\033['* ]]

# should style optional usage and displayed defaults when color is forced
output=$(env -u NO_COLOR FORCE_COLOR=1 tanaboot.sh --help)
grep -F $'\033[2m[TANABOOT_*...] [options]' <<< "$output"
grep -F $'\033[2m[default:' <<< "$output"

# should report the prepared release version
test "$(tanaboot.sh --version)" = "$STAMPED_VERSION"

# should reject conflicting modes with usage before provisioning
status=0
output=$(tanaboot.sh --host --agent 2>&1) || status=$?
test "$status" -eq 2
grep -F 'Usage:' <<< "$output"
grep -F 'Choose only one setup mode' <<< "$output"

# should reject conflicting actions with usage before provisioning
status=0
output=$(tanaboot.sh --check --dry-run 2>&1) || status=$?
test "$status" -eq 2
grep -F 'Usage:' <<< "$output"
grep -F 'Choose only one of --check or --dry-run' <<< "$output"

# should leave workspace revision selection to cloud setup
status=0
output=$(tanaboot.sh --ref main --dry-run 2>&1) || status=$?
test "$status" -eq 2
grep -F 'Unknown option' <<< "$output"
help=$(tanaboot.sh --help)
[[ "$help" != *--ref* ]]

# should reject unknown options without exposing their values
status=0
output=$(tanaboot.sh --unknown-token=private-example 2>&1) || status=$?
test "$status" -eq 2
grep -F 'Usage:' <<< "$output"
grep -F 'Unknown option' <<< "$output"
[[ "$output" != *'private-example'* ]]

# should reject container plugin installation options
status=0
output=$(tanaboot.sh --codex-plugin canon#main --dry-run 2>&1) || status=$?
test "$status" -eq 2
grep -F 'Unknown option' <<< "$output"
help=$(tanaboot.sh --help)
plan=$(tanaboot.sh --dry-run)
[[ "$help" != *--codex-plugin* ]]
[[ "$plan" != *Codex* ]]
```
