# Tanaboot inputs

Check help, displayed defaults, validation and diagnostic precedence without provisioning a host.
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
set -o pipefail
for option in --host --agent --check --dry-run --debug --version --help; do
  tanaboot.sh --help | grep -F -- "$option"
done

# should document the wrapper debug environment variable
tanaboot.sh --help | grep -F 'TANABOOT_DEBUG'

# should keep internal diagnostic controls out of help
! tanaboot.sh --help | grep -F -- '--debug='
! tanaboot.sh --help | grep -F 'BOOTBOX_'
! tanaboot.sh --help | grep -F 'RUNNER_DEBUG'

# should show runner debug as the lowest priority default
set -o pipefail
env -u TANABOOT_DEBUG -u DEBUG RUNNER_DEBUG=1 tanaboot.sh --help | grep -F -- '--debug' | grep -F '[default: on]'
env -u TANABOOT_DEBUG DEBUG=off RUNNER_DEBUG=1 tanaboot.sh --help | grep -F -- '--debug' | grep -F '[default: off]'
TANABOOT_DEBUG=0 DEBUG=1 RUNNER_DEBUG=1 tanaboot.sh --help | grep -F -- '--debug' | grep -F '[default: off]'
TANABOOT_DEBUG=off tanaboot.sh --debug --help | grep -F -- '--debug' | grep -F '[default: on]'

# should retain the hidden diagnostic override
set -o pipefail
TANABOOT_DEBUG=1 tanaboot.sh --debug=false --help | grep -F -- '--debug' | grep -F '[default: off]'
test -z "$(TANABOOT_DEBUG=1 tanaboot.sh --dry-run --debug=false 2>&1 >/dev/null)"

# should print diagnostics on stderr when enabled
output=$(TANABOOT_DEBUG=1 tanaboot.sh --dry-run 2>&1 >/dev/null)
printf '%s\n' "$output"
printf '%s\n' "$output" | grep -F 'debug: target=bootstrap action=plan'

# should respect no color even when color is forced
output=$(NO_COLOR=1 FORCE_COLOR=1 tanaboot.sh --help)
! printf '%s\n' "$output" | grep -F $'\033['

# should style optional usage and displayed defaults when color is forced
output=$(env -u NO_COLOR FORCE_COLOR=1 tanaboot.sh --help)
printf '%s\n' "$output" | grep -F $'\033[2m[TANABOOT_*...] [options]'
printf '%s\n' "$output" | grep -F $'\033[2m[default:'

# should report the prepared release version
test "$(tanaboot.sh --version)" = "$STAMPED_VERSION"

# should reject conflicting modes with usage before provisioning
status=0
output=$(tanaboot.sh --host --agent 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 2
printf '%s\n' "$output" | grep -F 'Usage:'
printf '%s\n' "$output" | grep -F 'Choose only one setup mode'

# should reject conflicting actions with usage before provisioning
status=0
output=$(tanaboot.sh --check --dry-run 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 2
printf '%s\n' "$output" | grep -F 'Usage:'
printf '%s\n' "$output" | grep -F 'Choose only one of --check or --dry-run'

# should leave workspace revision selection to cloud setup
status=0
output=$(tanaboot.sh --ref main --dry-run 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 2
printf '%s\n' "$output" | grep -F 'Unknown option'
! tanaboot.sh --help | grep -F -- '--ref'

# should reject unknown options without exposing their values
status=0
output=$(tanaboot.sh --op-token=private-example 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 2
printf '%s\n' "$output" | grep -F 'Usage:'
printf '%s\n' "$output" | grep -F 'Unknown option'
! printf '%s\n' "$output" | grep -F 'private-example'

# should reject container plugin installation options
status=0
output=$(tanaboot.sh --codex-plugin canon#main --dry-run 2>&1) || status=$?
test "$status" -eq 2
printf '%s\n' "$output" | grep -F 'Unknown option'
! tanaboot.sh --help | grep -F -- '--codex-plugin'
! tanaboot.sh --dry-run | grep -F 'Codex'
```
