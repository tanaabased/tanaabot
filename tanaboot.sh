#!/bin/bash
set -euo pipefail
# Prepare tanaabot's Codex Cloud environment through Bootbox and Codex Tools.
# Provisioning remains disabled until #5; --dry-run previews the delegation.

# shellcheck disable=SC2292
if [ -z "${BASH_VERSION:-}" ]; then
  printf 'error: Bash is required to interpret this script.\n' >&2
  exit 1
fi
if [[ -n "${POSIXLY_CORRECT+1}" ]]; then
  printf 'error: Unset POSIXLY_CORRECT; Tanaboot requires Bash outside POSIX mode.\n' >&2
  exit 1
fi

REPO_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
SCRIPT_VERSION="${SCRIPT_VERSION:-$(git -C "${REPO_DIR}" describe --tags --always 2>/dev/null || printf '%s' '0.0.0-unreleased')}"
BOOTBOX_URL="https://bootbox.tanaab.sh/bootbox.sh"
DEBUG="${TANABOOT_DEBUG:-${DEBUG:-${RUNNER_DEBUG:-}}}"
TARGET="bootstrap"
ACTION="apply"

value_enabled() {
  case "${1:-}" in
    '' | 0 | false | FALSE | False | no | NO | No | off | OFF | Off) return 1 ;;
    *) return 0 ;;
  esac
}

tty_escape() {
  if { [[ -t "${2:-1}" ]] || value_enabled "${FORCE_COLOR:-}"; } && [[ -z "${NO_COLOR-}" ]]; then
    printf '\033[%sm' "$1"
  fi
}

tty_bold="$(tty_escape 1)"
tty_dim="$(tty_escape 2)"
tty_tp="$(tty_escape '38;2;0;200;138')"
tty_ts="$(tty_escape '38;2;219;39;119')"
tty_reset="$(tty_escape 0)"
err_red="$(tty_escape '1;31' 2)"
err_dim="$(tty_escape 2 2)"
err_reset="$(tty_escape 0 2)"

fail() {
  printf '%serror%s: %s\n' "${err_red}" "${err_reset}" "$1" >&2
  exit "${2:-1}"
}

debug() {
  if value_enabled "${DEBUG}"; then
    printf '%sdebug%s: %s\n' "${err_dim}" "${err_reset}" "$*" >&2
  fi
}

note() {
  printf '%snote%s: %s\n' "${tty_ts}" "${tty_reset}" "$*"
}

plan_action() {
  printf '  %s%s%s %s%s%s\n' "${tty_tp}" "$1" "${tty_reset}" "${tty_ts}" "$2" "${tty_reset}"
}

plan_command() {
  printf '    '
  printf '%q ' "$@"
  printf '\n'
}

usage() {
  local debug_display="off"
  if value_enabled "${DEBUG}"; then debug_display="on"; fi
  cat <<HELP
Usage: ${tty_bold}tanaboot.sh${tty_reset} ${tty_dim}[options]${tty_reset}

Prepare a Codex Cloud environment for tanaabot. Provisioning is not implemented.
The default mode selects host then agent. Choose one mode and one action.

${tty_tp}Options:${tty_reset}
  --host        Select host dependencies and Homebrew PATH only
  --agent       Select guidance, dotpackages and Codex plugins only
  --check       Check the selected setup; currently returns 1 (not implemented)
  --dry-run     Preview delegation without downloads or changes
  --debug       Show diagnostics ${tty_dim}[default: ${debug_display}]${tty_reset}
  --debug=BOOL  Override debug output; 0, false, no and off disable it
  --version     Show the script version
  -h, --help    Show this help

${tty_tp}Environment Variables:${tty_reset}
  TANABOOT_DEBUG  Same as --debug=BOOL

HELP
}

parse_args() {
  local info=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --host | --agent)
        [[ "${TARGET}" == bootstrap ]] || fail 'Choose only one setup mode.' 2
        TARGET="${1#--}"
        ;;
      --check | --dry-run)
        [[ "${ACTION}" == apply ]] || fail 'Choose only one of --check or --dry-run.' 2
        if [[ "$1" == --check ]]; then ACTION="check"; else ACTION="plan"; fi
        ;;
      --debug) DEBUG="1" ;;
      --debug=*) DEBUG="${1#*=}" ;;
      -h | --help | --version)
        [[ -z "${info}" ]] || fail 'Choose only one of --help or --version.' 2
        info="$1"
        ;;
      *) fail "Unknown option: $1. Use tanaboot.sh --help." 2 ;;
    esac
    shift
  done
  case "${info}" in
    -h | --help) usage; exit 0 ;;
    --version) printf '%s\n' "${SCRIPT_VERSION}"; exit 0 ;;
  esac
}

plan_host() {
  printf '\n%shost%s\n' "${tty_tp}" "${tty_reset}"
  plan_action provision 'Bootbox dependencies and Brewfile'
  plan_command bootbox.sh --brewfile "${REPO_DIR}/Brewfile"
  plan_action configure 'Homebrew PATH for subsequent Cloud tasks (pending)'
}

plan_agent() {
  local package
  local -a bootbox_args=()
  printf '\n%sagent%s\n' "${tty_tp}" "${tty_reset}"
  for package in "${REPO_DIR}"/dotfiles/*; do
    [[ -d "${package}" ]] || continue
    bootbox_args+=(--dotpkg "${package}")
  done
  plan_action stow 'Home-relative dotpackages through Bootbox'
  if [[ ${#bootbox_args[@]} -gt 0 ]]; then
    plan_command bootbox.sh "${bootbox_args[@]}"
  fi
  plan_action install "Tanaabot plugin from ${REPO_DIR} through Codex Tools (pending)"
  plan_action resolve 'Canon plugin from tanaabased/canon at main (pending)'
}

main() {
  parse_args "$@"
  debug "target=${TARGET} action=${ACTION} source=${REPO_DIR}"
  debug "Bootbox source: ${BOOTBOX_URL}"
  # A scaffold must never satisfy a readiness check or report successful setup.
  if [[ "${ACTION}" != plan ]]; then
    fail "Codex Cloud ${TARGET} ${ACTION} is not implemented (#5); nothing was changed."
  fi
  note 'Scaffold preview only. Commands below are planned delegation, not executed.'
  if [[ "${TARGET}" == bootstrap || "${TARGET}" == host ]]; then plan_host; fi
  if [[ "${TARGET}" == bootstrap || "${TARGET}" == agent ]]; then plan_agent; fi
}

main "$@"
