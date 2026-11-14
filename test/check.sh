#!/bin/bash
# Exercise the read-only startup path with isolated tool and shell boundaries.
# shellcheck disable=SC2030,SC2031,SC2329
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")/.." && pwd -P)"
# shellcheck source=tanaboot.sh
source "${root}/tanaboot.sh"
test_dir="$(mktemp -d)"
trap 'chmod -R u+w "${test_dir}"; rm -rf -- "${test_dir}"' EXIT
export HOME="${test_dir}/home"
mkdir -p "${HOME}/.codex" "${HOME}/.config/tanaabot" "${test_dir}/bin"
cp "${root}/dotfiles/ai/.codex/AGENTS.md" "${HOME}/.codex/AGENTS.md"
cp "${root}/dotfiles/shell/.config/tanaabot/env.sh" "${HOME}/.config/tanaabot/env.sh"
printf '%s\n' "${SHELL_INIT_LINE}" > "${HOME}/.profile"
cp "${HOME}/.profile" "${HOME}/.bashrc"
cat > "${test_dir}/bin/tool" <<'SH'
#!/bin/bash
set -eu
[[ "$1" == --version ]] || exit 99
case "${0##*/}" in
  node) printf 'v%s.0.0\n' "$TEST_NODE_MAJOR" ;;
  bun) printf '%s.0.0\n' "$TEST_BUN_MAJOR" ;;
  *) printf '%s test version\n' "${0##*/}" ;;
esac
SH
chmod +x "${test_dir}/bin/tool"
for tool in brew node bun git curl gh jq stow; do
  ln -s tool "${test_dir}/bin/${tool}"
done
export TEST_NODE_MAJOR TEST_BUN_MAJOR
TEST_NODE_MAJOR="$(cut -d . -f 1 "${root}/.node-version")"
TEST_BUN_MAJOR="$(cut -d . -f 1 "${root}/.bun-version")"
export PATH="${test_dir}/bin:/usr/bin:/bin"
chmod -R a-w "${HOME}" "${test_dir}/bin"

(
  # No write, network, maintenance or privilege prerequisite may enter a check.
  uname() { if [[ "$1" == -s ]]; then printf 'Linux\n'; else printf 'x86_64\n'; fi; }
  id() { exit 90; }
  mkdir() { exit 91; }
  mktemp() { exit 92; }
  prepare_bootbox() { exit 93; }
  run_bootbox() { exit 94; }
  activate_tools() { exit 95; }
  check_shells() { printf 'fixture: shell boundary reached\n'; }
  DATA_DIR=/unwritable/tanaabot
  [[ ! -w "${HOME}" ]]
  output="$(main --check)"
  [[ "${output}" == *'fixture: shell boundary reached'* ]]
  [[ "${output}" == *'bootstrap check complete.'* ]]
  [[ "${output}" == *'Dependency: gh'* ]]
)
printf 'ok: startup reads configuration and dependencies without setup privileges or network calls\n'

status=0
output=$(TEST_NODE_MAJOR=0 check_host 2>&1) || status=$?
[[ "${status}" == 1 && "${output}" == *'Node does not match'* ]]
printf 'ok: incompatible runtime fails readiness\n'

chmod u+w "${test_dir}/bin"
rm "${test_dir}/bin/stow"
status=0
output=$(check_host 2>&1) || status=$?
[[ "${status}" == 1 && "${output}" == *'stow is required'* ]]
printf 'ok: missing declared dependency fails readiness\n'

chmod u+w "${HOME}/.codex/AGENTS.md"
printf 'changed\n' >> "${HOME}/.codex/AGENTS.md"
status=0
output=$(check_agent 2>&1) || status=$?
[[ "${status}" == 1 && "${output}" == *'Global guidance is missing or differs'* ]]
printf 'ok: changed guidance fails comparison without repair\n'
