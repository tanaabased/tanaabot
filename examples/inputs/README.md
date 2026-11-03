# Tanaboot inputs

Exercise the packaged CLI's help, version and input failures. This scenario does not provision a host.
CI prepares the candidate and puts `tanaboot.sh` on `PATH`.

## Testing

```sh
# should expose the setup modes
set -o pipefail
tanaboot.sh --help | grep -F -- '--host'
tanaboot.sh --help | grep -F -- '--agent'

# should report the prepared release version
test "$(tanaboot.sh --version)" = "$STAMPED_VERSION"

# should reject conflicting modes before provisioning
status=0
output=$(tanaboot.sh --host --agent 2>&1) || status=$?
printf '%s\n' "$output"
test "$status" -eq 2
printf '%s\n' "$output" | grep -F 'Choose only one setup mode'

# should let the CLI disable environment-supplied debugging
test -z "$(TANABOOT_DEBUG=1 tanaboot.sh --dry-run --debug=false 2>&1 >/dev/null)"
```
