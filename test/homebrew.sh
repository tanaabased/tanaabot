#!/bin/bash
# Component checks with fake download and installer boundaries; never provision the host.
# Subshells isolate PATH and mocks invoked by the sourced functions.
# shellcheck disable=SC2030,SC2031,SC2329
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")/.." && pwd -P)"
# shellcheck source=tanaboot.sh
source "${root}/tanaboot.sh"
test_dir="$(mktemp -d)"
test_dir="$(cd -- "${test_dir}" && pwd -P)"
trap 'rm -rf -- "${test_dir}"' EXIT
export HOME="${test_dir}/home"
mkdir -p "${HOME}" "${test_dir}/downloads"
boot_tmpdir="${test_dir}/downloads"
original_path="${PATH}"

(
  # A cold machine is independent of Homebrew installed on the test runner.
  find_homebrew() { return 1; }
  curl() {
    [[ "$1" == -fsSL && "$2" == https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh ]] || return 91
    [[ "$3" == -o && "$4" == "${boot_tmpdir}/homebrew-install.sh" ]]
  }
  bash() {
    [[ "${HOMEBREW_NO_SUDO}" == 1 && "${NONINTERACTIVE}" == 1 && -z "${INTERACTIVE:-}" ]] || return 92
    [[ "$1" == "${boot_tmpdir}/homebrew-install.sh" && "$2" == --path && "$3" == "${HOME}/.linuxbrew" ]] || return 93
    mkdir -p "$3/bin"
    cp "${root}/test/brew" "$3/bin/brew"
    chmod +x "$3/bin/brew"
  }
  INTERACTIVE=1 ensure_homebrew
  [[ "$(command -v brew)" == "${HOME}/.linuxbrew/bin/brew" ]]
)
printf 'ok: cold bootstrap selects a user prefix without sudo\n'

(
  export PATH="${HOME}/.linuxbrew/bin:${original_path}"
  curl() { exit 90; }
  ensure_homebrew
  [[ "$(brew --prefix)" == "${HOME}/.linuxbrew" ]]
)
printf 'ok: existing homebrew is reused without downloading\n'

(
  mkdir -p "${test_dir}/existing/bin"
  cp "${root}/test/brew" "${test_dir}/existing/bin/brew"
  chmod +x "${test_dir}/existing/bin/brew"
  export PATH="${test_dir}/existing/bin:${original_path}"
  curl() { exit 90; }
  ensure_homebrew
  [[ "$(brew --prefix)" == "${test_dir}/existing" ]]
  BOOTBOX_SCRIPT="${boot_tmpdir}/bootbox.sh"
  BOOTBOX_NO_SUDO=0
  BOOTBOX_EXTERNAL_SUDO=1
  bash() {
    [[ "${HOMEBREW_PREFIX}" == "${test_dir}/existing" && "${HOMEBREW_NO_SUDO}" == 1 ]]
    [[ -z "${BOOTBOX_EXTERNAL_SUDO:-}" && -z "${BOOTBOX_NO_SUDO:-}" ]]
    [[ "$1" == "${boot_tmpdir}/bootbox.sh" && "$2" == --no-sudo && "$3" == --brewfile ]]
  }
  run_bootbox --brewfile
)
printf 'ok: bootbox receives the existing prefix and explicit no-sudo mode\n'

(
  export PATH=/usr/bin:/bin
  [[ "$(find_homebrew)" == "${HOME}/.linuxbrew/bin/brew" ]]
  # shellcheck source=dotfiles/shell/.config/tanaabot/env.sh
  source "${root}/dotfiles/shell/.config/tanaabot/env.sh"
  [[ "$(command -v brew)" == "${HOME}/.linuxbrew/bin/brew" ]]
  [[ "${PATH}" == "${HOME}/.linuxbrew/opt/node@26/bin:"* ]]
)
printf 'ok: shell initialization discovers the user prefix from system PATH\n'

status=0
output=$(
  find_homebrew() { return 1; }
  curl() { return 22; }
  ensure_homebrew
  printf 'unexpected success\n'
) || status=$?
[[ "${status}" == 1 && "${output}" != *'unexpected success'* ]]
printf 'ok: download failure stops bootstrap\n'

status=0
output=$(
  find_homebrew() { return 1; }
  curl() { return 0; }
  bash() { return 37; }
  ensure_homebrew
  printf 'unexpected success\n'
) || status=$?
[[ "${status}" == 1 && "${output}" != *'unexpected success'* ]]
printf 'ok: installer failure stops bootstrap\n'

status=0
output=$(PATH=/usr/bin:/bin check_tools) || status=$?
[[ "${status}" == 1 ]]
printf 'ok: readiness refuses missing inherited PATH instead of repairing it\n'
