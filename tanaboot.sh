#!/bin/bash
set -euo pipefail
# Prepare tanaabot's Codex Cloud environment through Bootbox.

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
DATA_DIR="${XDG_DATA_HOME:-${HOME}/.local/share}/tanaabot"
DEBUG="${TANABOOT_DEBUG:-${DEBUG:-${RUNNER_DEBUG:-}}}"
TARGET="bootstrap"
ACTION="apply"
# The receiving shell expands HOME when it loads this line.
# shellcheck disable=SC2016
SHELL_INIT_LINE='[ ! -r "$HOME/.config/tanaabot/env.sh" ] || . "$HOME/.config/tanaabot/env.sh"'

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
tty_green="$(tty_escape 32)"
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

success() {
  printf '%sdone%s: %s\n' "${tty_green}" "${tty_reset}" "$*"
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
Usage: ${tty_bold}tanaboot.sh${tty_reset} ${tty_dim}[TANABOOT_*...] [options]${tty_reset}

Prepare a Linux Codex Cloud environment for tanaabot.
The default mode selects host then agent. Choose one mode and one action.

${tty_tp}Options:${tty_reset}
  --host              Select host dependencies only
  --agent             Select guidance and shell initialization only
  --check             Check installed tools and configuration offline
  --dry-run           Preview delegation without downloads or changes
  --debug             Show diagnostics ${tty_dim}[default: ${debug_display}]${tty_reset}
  --version           Show the script version
  -h, --help          Show this help

${tty_tp}Environment Variables:${tty_reset}
  TANABOOT_DEBUG        Same as --debug

HELP
}

option_error() {
  usage
  fail "$1" 2
}

parse_args() {
  local info=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --host | --agent)
        [[ "${TARGET}" == bootstrap ]] || option_error 'Choose only one setup mode.'
        TARGET="${1#--}"
        ;;
      --check | --dry-run)
        [[ "${ACTION}" == apply ]] || option_error 'Choose only one of --check or --dry-run.'
        if [[ "$1" == --check ]]; then ACTION="check"; else ACTION="plan"; fi
        ;;
      --debug) DEBUG="1" ;;
      --debug=*) DEBUG="${1#*=}" ;;
      -h | --help | --version)
        [[ -z "${info}" ]] || option_error 'Choose only one of --help or --version.'
        info="$1"
        ;;
      *) option_error 'Unknown option. See usage above.' ;;
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
  plan_action ensure "Existing Homebrew or a no-sudo installation at ${HOME}/.linuxbrew"
  plan_action provision 'Bootbox dependencies and Brewfile'
  plan_command bootbox.sh --no-sudo --brewfile "${REPO_DIR}/Brewfile"
  plan_action configure 'Homebrew and Node PATH for this setup'
}

plan_agent() {
  printf '\n%sagent%s\n' "${tty_tp}" "${tty_reset}"
  plan_action stow 'Home-relative dotpackages through Bootbox'
  plan_command bootbox.sh --no-sudo --dotpkg "${REPO_DIR}/dotfiles/ai" --dotpkg "${REPO_DIR}/dotfiles/shell"
}

require_tool() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required. Install it in the Cloud setup, then retry."
}

preflight() {
  [[ "$(uname -s)" == Linux ]] || fail 'Tanaboot setup requires Linux. Use --dry-run to preview it on this host.'
  case "$(uname -m)" in
    x86_64 | aarch64 | arm64) ;;
    *) fail 'Bootbox requires a supported 64-bit Linux architecture.' ;;
  esac
  if [[ "${ACTION}" == check ]]; then return; fi
  [[ "$(id -u)" != 0 ]] || fail 'Bootbox cannot provision as root. Run setup as the intended non-root Cloud user; no user or ownership was changed.'
  [[ "${HOME:-}" == /* && -d "${HOME}" && -w "${HOME}" && "${DATA_DIR}" == /* ]] || fail 'Setup needs a writable absolute HOME and data directory.'
  [[ "${CODEX_HOME:-${HOME}/.codex}" == "${HOME}/.codex" ]] || fail 'Guidance setup currently requires CODEX_HOME at ~/.codex. Select the intended Cloud home before retrying.'
  require_tool git
  require_tool jq
}

prepare_bootbox() {
  require_tool curl
  boot_tmpdir="$(mktemp -d -t tanaboot.XXXXXX)"
  BOOTBOX_SCRIPT="${boot_tmpdir}/bootbox.sh"
  curl -fsSL "${BOOTBOX_URL}" -o "${BOOTBOX_SCRIPT}" || fail 'Bootbox download failed. Check network access and retry.'
  chmod 700 "${BOOTBOX_SCRIPT}"
}

run_bootbox() (
  local variable prefix script="${BOOTBOX_SCRIPT}"
  # Inherited profile inputs must not add secrets, SSH keys or overwrite behavior.
  for variable in ${!BOOTBOX_@} ${!TANAAB_@} OP_SERVICE_ACCOUNT_TOKEN INTERACTIVE; do
    unset "${variable}"
  done
  prefix="$(brew --prefix)" || fail 'Cannot determine the selected Homebrew prefix.'
  cd -- "$(dirname -- "${script}")"
  HOMEBREW_PREFIX="${prefix}" HOMEBREW_NO_SUDO=1 NONINTERACTIVE=1 BOOTBOX_QUIET=1 BOOTBOX_DEBUG="${DEBUG}" bash "${script}" --no-sudo "$@"
)

find_homebrew() {
  local candidate
  if command -v brew >/dev/null 2>&1; then
    command -v brew
    return
  fi
  for candidate in "${HOME}/.linuxbrew/bin/brew" /home/linuxbrew/.linuxbrew/bin/brew; do
    if [[ -x "${candidate}" ]]; then
      printf '%s\n' "${candidate}"
      return
    fi
  done
  return 1
}

ensure_homebrew() {
  local brew_path installer="${boot_tmpdir}/homebrew-install.sh"
  if ! brew_path="$(find_homebrew)"; then
    note "Installing Homebrew at ${HOME}/.linuxbrew without sudo."
    curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh -o "${installer}" || fail 'Homebrew installer download failed. Check network access and retry.'
    (
      unset INTERACTIVE
      HOMEBREW_NO_SUDO=1 NONINTERACTIVE=1 bash "${installer}" --path "${HOME}/.linuxbrew"
    ) || fail 'Homebrew installation failed. Inspect its prefix, system prerequisite and network diagnostics before retrying.'
    brew_path="${HOME}/.linuxbrew/bin/brew"
    [[ -x "${brew_path}" ]] || fail 'Homebrew installation finished without the expected brew executable.'
  fi
  PATH="$(dirname -- "${brew_path}"):${PATH}"
  export PATH
}

activate_tools() {
  local node_prefix brew_prefix brew_path
  brew_path="$(find_homebrew)" || fail 'brew is required. Run host setup first.'
  PATH="$(dirname -- "${brew_path}"):${PATH}"
  export PATH
  node_prefix="$(brew --prefix node@26)"
  brew_prefix="$(brew --prefix)"
  PATH="${node_prefix}/bin:${brew_prefix}/bin:${PATH}"
  export PATH
}

check_tools() {
  local node_version node_major tool
  for tool in brew node bun; do
    require_tool "${tool}"
    note "Tool: ${tool} ($(command -v "${tool}"))"
  done
  node_major="$(cut -d . -f 1 "${REPO_DIR}/.node-version")"
  node_version="$(node --version)"
  [[ "${node_version}" == "v${node_major}."* ]] || fail 'Node does not match the major version in .node-version. Run host setup and check its PATH.'
  [[ "$(bun --version)" == "$(cut -d . -f 1 "${REPO_DIR}/.bun-version")."* ]] || fail 'Bun does not match the major version in .bun-version. Select that runtime in the Cloud setup and retry.'
  note "Runtimes: ${node_version}, Bun $(bun --version)"
}

check_host() {
  check_tools
  local formula tool version
  [[ -r "${REPO_DIR}/Brewfile" ]] || fail 'The dependency inventory is not readable.'
  version="$(HOMEBREW_NO_AUTO_UPDATE=1 brew --version)" || fail 'Cannot read Homebrew version.'
  note "Homebrew: ${version}"
  # The Brewfile is the dependency inventory; tap and version suffixes are not binary names.
  while IFS= read -r formula; do
    tool="${formula##*/}"
    tool="${tool%%@*}"
    require_tool "${tool}"
    version="$("${tool}" --version)" || fail "Cannot read ${tool}'s version."
    note "Dependency: ${tool} ($(command -v "${tool}")); ${version%%$'\n'*}"
  done < <(sed -n 's/^brew "\([^"]*\)".*/\1/p' "${REPO_DIR}/Brewfile")
}

shell_startup_files() {
  local file
  for file in .bash_profile .bash_login .profile; do
    if [[ -r "${HOME}/${file}" ]]; then
      printf '%s\n' "${file}" .bashrc
      return
    fi
  done
  printf '%s\n' .profile .bashrc
}

check_shells() {
  local mode
  note 'Shell: inherited non-interactive Bash'
  bash -c 'source "$1"; check_tools' _ "${REPO_DIR}/tanaboot.sh" || fail 'Non-interactive Bash cannot discover the declared tools. Check the Cloud command launcher environment.'
  for mode in -lc -ic; do
    note "Shell: fresh Bash ${mode} from system PATH"
    # Remove inherited tool paths so startup files must supply them.
    # shellcheck disable=SC2016
    env -u BASH_ENV HISTFILE=/dev/null PATH=/usr/bin:/bin bash "${mode}" 'source "$1"; check_tools' _ "${REPO_DIR}/tanaboot.sh" || fail 'Fresh Bash cannot discover the declared tools. Check the active login file and .bashrc initialization.'
  done
}

check_agent() {
  local file
  cmp -s "${REPO_DIR}/dotfiles/ai/.codex/AGENTS.md" "${HOME}/.codex/AGENTS.md" || fail 'Global guidance is missing or differs. Run agent setup; preserve any conflicting guidance.'
  cmp -s "${REPO_DIR}/dotfiles/shell/.config/tanaabot/env.sh" "${HOME}/.config/tanaabot/env.sh" || fail 'Shell initialization is missing or differs. Run agent setup.'
  while IFS= read -r file; do
    grep -Fxq "${SHELL_INIT_LINE}" "${HOME}/${file}" || fail 'Shell startup is incomplete. Run agent setup.'
  done < <(shell_startup_files)
  check_shells
  note "Guidance installed: ${HOME}/.codex/AGENTS.md (loaded guidance must be confirmed by the task)"
  note "Tanaabot source revision: $(git -C "${REPO_DIR}" rev-parse HEAD 2>/dev/null || printf '%s' "${SCRIPT_VERSION}")"
}

apply_agent() {
  local file
  while IFS= read -r file; do
    [[ ! -L "${HOME}/${file}" && ( ! -e "${HOME}/${file}" || ( -f "${HOME}/${file}" && -w "${HOME}/${file}" ) ) ]] || fail 'Shell startup conflicts with an existing path. Preserve it and resolve the conflict before retrying.'
  done < <(shell_startup_files)
  for file in .codex .config; do
    [[ ! -L "${HOME}/${file}" && ( ! -e "${HOME}/${file}" || ( -d "${HOME}/${file}" && -w "${HOME}/${file}" ) ) ]] || fail 'Shared configuration directories must be writable real directories. Preserve the conflicting path before retrying.'
  done
  require_tool stow
  stow --simulate --dir "${REPO_DIR}/dotfiles" --target "${HOME}" ai shell >/dev/null || fail 'Guidance or shell dotfiles conflict with existing configuration. Preserve it and resolve the conflict before retrying.'
  # Prevent Stow directory folding from sending private runtime writes into Git sources.
  mkdir -p -- "${HOME}/.codex" "${HOME}/.config"
  run_bootbox --dotpkg "${REPO_DIR}/dotfiles/ai" --dotpkg "${REPO_DIR}/dotfiles/shell"
  while IFS= read -r file; do
    if ! grep -Fxq "${SHELL_INIT_LINE}" "${HOME}/${file}" 2>/dev/null; then
      printf '\n%s\n' "${SHELL_INIT_LINE}" >> "${HOME}/${file}"
    fi
  done < <(shell_startup_files)
  check_agent
}

main() (
  local lock
  setup_lock=""
  boot_tmpdir=""
  trap '[[ -z "${boot_tmpdir}" ]] || rm -rf -- "${boot_tmpdir}"; [[ -z "${setup_lock}" ]] || rmdir -- "${setup_lock}"' EXIT
  parse_args "$@"
  debug "target=${TARGET} action=${ACTION}"
  if [[ "${ACTION}" == plan ]]; then
    note 'Preview only. Commands below are not executed.'
    if [[ "${TARGET}" == bootstrap || "${TARGET}" == host ]]; then plan_host; fi
    if [[ "${TARGET}" == bootstrap || "${TARGET}" == agent ]]; then plan_agent; fi
    return
  fi
  preflight
  if [[ "${ACTION}" != check ]]; then
    mkdir -p -- "${DATA_DIR}"
    lock="${DATA_DIR}/setup.lock"
    mkdir -- "${lock}" 2>/dev/null || fail 'Setup is already running or its lock needs operator inspection.'
    setup_lock="${lock}"
    prepare_bootbox
  fi
  if [[ "${TARGET}" == bootstrap || "${TARGET}" == host ]]; then
    if [[ "${ACTION}" == apply ]]; then
      ensure_homebrew
      run_bootbox --brewfile "${REPO_DIR}/Brewfile"
    fi
  fi
  if [[ "${ACTION}" == apply ]]; then activate_tools; fi
  check_host
  if [[ "${TARGET}" == bootstrap || "${TARGET}" == agent ]]; then
    if [[ "${ACTION}" == apply ]]; then apply_agent; else check_agent; fi
  fi
  success "${TARGET} ${ACTION} complete."
)

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi
