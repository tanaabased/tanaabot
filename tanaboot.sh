#!/bin/bash
set -euo pipefail
# prepare TANAABOT's CODEX CLOUD environment through BOOTBOX.

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
SCRIPT_VERSION="v1.0.1"
BOOTBOX_URL="https://bootbox.tanaab.sh/bootbox.sh"
SSH_KEY_SPEC="io7gvjejiyau6my2xasglxbydy/id_tanaabot"
DATA_DIR="${XDG_DATA_HOME:-${HOME}/.local/share}/tanaabot"
DEBUG="${TANABOOT_DEBUG:-${DEBUG:-${RUNNER_DEBUG:-}}}"
op_token="${OP_SERVICE_ACCOUNT_TOKEN:-}"
token_source="OP_SERVICE_ACCOUNT_TOKEN"
if [[ -n "${TANABOOT_OP_TOKEN:-}" ]]; then
  op_token="${TANABOOT_OP_TOKEN}"
  token_source="TANABOOT_OP_TOKEN"
fi
TARGET="bootstrap"
ACTION="apply"
# the receiving shell expands HOME when it loads this line.
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
  local debug_display="off" token_display="unset"
  if value_enabled "${DEBUG}"; then debug_display="on"; fi
  if [[ -n "${op_token}" ]]; then token_display="${token_source}"; fi
  cat <<HELP
Usage: ${tty_bold}tanaboot.sh${tty_reset} ${tty_dim}[TANABOOT_*...] [options]${tty_reset}

Prepare a Linux Codex Cloud environment for tanaabot.
The default mode selects host then agent. Choose one mode and one action.

${tty_tp}Options:${tty_reset}
  --host              Select host dependencies only
  --agent             Select dotfiles, environment and the Tanaabot SSH key
  --check             Check installed tools and configuration offline
  --dry-run           Preview delegation without downloads or changes
  --op-token TOKEN    Use a 1Password service account token ${tty_dim}[default: ${token_display}]${tty_reset}
  --debug             Show diagnostics ${tty_dim}[default: ${debug_display}]${tty_reset}
  --version           Show the script version
  -h, --help          Show this help

${tty_tp}Environment Variables:${tty_reset}
  TANABOOT_HOST       Same as --host
  TANABOOT_AGENT      Same as --agent
  TANABOOT_CHECK      Same as --check
  TANABOOT_DRY_RUN    Same as --dry-run
  TANABOOT_OP_TOKEN   Same as --op-token; falls back to OP_SERVICE_ACCOUNT_TOKEN
  TANABOOT_DEBUG      Same as --debug
  TANABOOT_VERSION    Same as --version
  TANABOOT_HELP       Same as --help

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
      --op-token | --op-token=*)
        if [[ "$1" == --op-token ]]; then
          [[ -n "${2:-}" && "$2" != -* ]] || option_error '--op-token requires a token value.'
          shift
          op_token="$1"
        else
          op_token="${1#*=}"
          [[ -n "${op_token}" ]] || option_error '--op-token requires a token value.'
        fi
        token_source="command line"
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
  if [[ -z "${info}" ]]; then
    if value_enabled "${TANABOOT_HELP:-}"; then info=--help; fi
    if value_enabled "${TANABOOT_VERSION:-}"; then
      [[ -z "${info}" ]] || option_error 'Choose only one of --help or --version.'
      info=--version
    fi
  fi
  case "${info}" in
    -h | --help) usage; exit 0 ;;
    --version) printf '%s\n' "${SCRIPT_VERSION}"; exit 0 ;;
  esac
  if [[ "${TARGET}" == bootstrap ]]; then
    if value_enabled "${TANABOOT_HOST:-}"; then TARGET=host; fi
    if value_enabled "${TANABOOT_AGENT:-}"; then
      [[ "${TARGET}" == bootstrap ]] || option_error 'Choose only one setup mode.'
      TARGET=agent
    fi
  fi
  if [[ "${ACTION}" == apply ]]; then
    if value_enabled "${TANABOOT_CHECK:-}"; then ACTION=check; fi
    if value_enabled "${TANABOOT_DRY_RUN:-}"; then
      [[ "${ACTION}" == apply ]] || option_error 'Choose only one of --check or --dry-run.'
      ACTION=plan
    fi
  fi
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
  plan_action ensure 'The approved SSH private key; reuse an existing matching key'
  plan_command bootbox.sh --no-sudo --ssh-key "${SSH_KEY_SPEC}"
  plan_action refresh 'Private 1Password Environment file, or reuse it when no token is supplied'
  plan_command bun --no-env-file "${REPO_DIR}/scripts/environment-task.js" --ensure
  plan_action stow 'Home-relative dotpackages through Bootbox'
  plan_command bootbox.sh --no-sudo --dotpkg "${REPO_DIR}/dotfiles/ai" --dotpkg "${REPO_DIR}/dotfiles/shell" --dotpkg "${REPO_DIR}/dotfiles/git" --dotpkg "${REPO_DIR}/dotfiles/gh" --dotpkg "${REPO_DIR}/dotfiles/ssh"
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
  local variable prefix key_token="" script="${BOOTBOX_SCRIPT}"
  if [[ "${1:-}" == --ssh-key ]]; then key_token="${op_token}"; fi
  # inherited profile inputs must not add secrets, SSH keys or overwrite behavior.
  for variable in ${!BOOTBOX_@} ${!TANAAB_@} TANABOOT_OP_TOKEN OP_SERVICE_ACCOUNT_TOKEN INTERACTIVE; do
    unset "${variable}"
  done
  prefix="$(brew --prefix)" || fail 'Cannot determine the selected Homebrew prefix.'
  cd -- "$(dirname -- "${script}")"
  BOOTBOX_OP_TOKEN="${key_token}" HOMEBREW_PREFIX="${prefix}" HOMEBREW_NO_SUDO=1 NONINTERACTIVE=1 BOOTBOX_QUIET=1 BOOTBOX_DEBUG="${DEBUG}" bash "${script}" --no-sudo "$@"
)

check_ssh_key() {
  local key="${HOME}/.ssh/id_tanaabot" public key_type key_data expected_type expected_data
  require_tool ssh-keygen
  [[ -d "${HOME}/.ssh" && ! -L "${HOME}/.ssh" && -O "${HOME}/.ssh" ]] || fail 'SSH keys need a real .ssh directory owned by this user.'
  [[ -f "${key}" && ! -L "${key}" && -O "${key}" ]] || fail 'The approved SSH private key is missing or has an unsafe path. Run agent setup.'
  public="$(ssh-keygen -y -P '' -f "${key}" </dev/null 2>/dev/null)" || fail 'The SSH private key is unreadable, encrypted or has unsafe permissions.'
  read -r key_type key_data _ <<< "${public}"
  read -r expected_type expected_data _ < "${REPO_DIR}/dotfiles/ssh/.ssh/id_tanaabot.pub"
  [[ "${key_type} ${key_data}" == "${expected_type} ${expected_data}" ]] || fail 'The installed SSH private key does not match the approved public key. Preserve it and resolve the conflict.'
}

install_ssh_key() {
  if [[ -e "${HOME}/.ssh/id_tanaabot" || -L "${HOME}/.ssh/id_tanaabot" ]]; then
    check_ssh_key
    note 'Reusing the approved SSH private key.'
    return
  fi
  [[ -n "${op_token}" ]] || fail 'Set TANABOOT_OP_TOKEN or OP_SERVICE_ACCOUNT_TOKEN before initial SSH key setup.'
  run_bootbox --ssh-key "${SSH_KEY_SPEC}" || return
  check_ssh_key
}

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
  local node_prefix libpq_prefix brew_prefix brew_path
  brew_path="$(find_homebrew)" || fail 'brew is required. Run host setup first.'
  PATH="$(dirname -- "${brew_path}"):${PATH}"
  export PATH
  node_prefix="$(brew --prefix node@26)"
  libpq_prefix="$(brew --prefix libpq)"
  brew_prefix="$(brew --prefix)"
  PATH="${node_prefix}/bin:${libpq_prefix}/bin:${brew_prefix}/bin:${PATH}"
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

check_dependency() {
  local tool version version_flag=--version
  tool="${1##*/}"
  tool="${tool%%@*}"
  case "${tool}" in
    libpq) tool=psql ;;
    socat) version_flag=-V ;;
  esac
  require_tool "${tool}"
  version="$("${tool}" "${version_flag}")" || fail "Cannot read ${tool}'s version."
  if [[ "${tool}" == socat ]]; then
    version="$(sed -n '/^socat version /p' <<< "${version}")"
    [[ -n "${version}" ]] || fail 'Cannot read socat version.'
  fi
  note "Dependency: ${tool} ($(command -v "${tool}")); ${version%%$'\n'*}"
}

check_host() {
  check_tools
  local formula version
  [[ -r "${REPO_DIR}/Brewfile" ]] || fail 'The dependency inventory is not readable.'
  version="$(HOMEBREW_NO_AUTO_UPDATE=1 brew --version)" || fail 'Cannot read Homebrew version.'
  note "Homebrew: ${version}"
  while IFS= read -r formula; do
    check_dependency "${formula}"
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

check_git_transport() {
  local url
  [[ "$(gh config get git_protocol --host github.com 2>/dev/null)" == https ]] || fail 'GitHub CLI must select HTTPS. Check its effective configuration.'
  [[ "$(git config --get-urlmatch credential.helper https://github.com/tanaabased/tanaabot.git 2>/dev/null)" == '!gh auth git-credential' ]] || fail 'GitHub HTTPS must select the gh credential helper. Inspect conflicting Git configuration privately.'
  for url in git@github.com:tanaabased/tanaabot.git ssh://git@github.com/tanaabased/tanaabot.git; do
    [[ "$(git ls-remote --get-url "${url}" 2>/dev/null)" == https://github.com/tanaabased/tanaabot.git ]] || fail 'GitHub SSH URLs must resolve to HTTPS. Check Git URL rewrites.'
  done
}

remove_retired_ssh_wrappers() {
  local client wrapper
  [[ ! -L "${HOME}/.local" && ! -L "${HOME}/.local/bin" ]] || return 0
  for client in ssh scp sftp; do
    wrapper="${HOME}/.local/bin/${client}"
    # remove only this checkout's retired STOW links, including dangling links.
    if [[ -L "${wrapper}" && "$(readlink -m -- "${wrapper}")" == "${REPO_DIR}/dotfiles/shell/.local/bin/${client}" ]]; then
      rm -- "${wrapper}"
    fi
  done
}

check_shells() {
  local mode name
  local -a fresh_environment=(env -u BASH_ENV)
  # remove saved variables as well as tool paths so inherited values cannot hide a broken loader.
  while IFS= read -r name; do
    fresh_environment+=(-u "${name}")
  done < <(jq -r '.variables | keys[]' "${HOME}/.local/state/tanaabot/environment.json")
  note 'Shell: inherited non-interactive Bash'
  bash -c 'source "$1"; check_tools; check_dependency libpq; check_git_transport; bun --no-env-file "${REPO_DIR}/scripts/environment-task.js" --check' _ "${REPO_DIR}/tanaboot.sh" || fail 'Non-interactive Bash cannot discover the declared tools or environment. Check the Cloud command launcher environment.'
  for mode in -lc -ic; do
    note "Shell: fresh Bash ${mode} from system PATH"
    # remove inherited tool paths so startup files must supply them.
    # shellcheck disable=SC2016
    "${fresh_environment[@]}" HISTFILE=/dev/null PATH=/usr/bin:/bin bash "${mode}" 'source "$1"; check_tools; check_dependency libpq; check_git_transport; bun --no-env-file "${REPO_DIR}/scripts/environment-task.js" --check' _ "${REPO_DIR}/tanaboot.sh" || fail 'Fresh Bash cannot discover the declared tools or environment. Check the active login file and .bashrc initialization.'
  done
}

check_agent() {
  local file
  cmp -s "${REPO_DIR}/dotfiles/ai/.codex/AGENTS.md" "${HOME}/.codex/AGENTS.md" || fail 'Global guidance is missing or differs. Run agent setup; preserve any conflicting guidance.'
  cmp -s "${REPO_DIR}/dotfiles/shell/.config/tanaabot/env.sh" "${HOME}/.config/tanaabot/env.sh" || fail 'Shell initialization is missing or differs. Run agent setup.'
  for file in .gitconfig .config/git/allowed_signers .config/gh/config.yml .ssh/config .ssh/id_tanaabot.pub; do
    case "${file}" in
      .gitconfig | .config/git/*) cmp -s "${REPO_DIR}/dotfiles/git/${file}" "${HOME}/${file}" ;;
      .config/gh/*) cmp -s "${REPO_DIR}/dotfiles/gh/${file}" "${HOME}/${file}" ;;
      .ssh/*) cmp -s "${REPO_DIR}/dotfiles/ssh/${file}" "${HOME}/${file}" ;;
    esac || fail 'Identity dotfiles are missing or differ. Run agent setup; preserve conflicting files.'
  done
  check_git_transport
  check_ssh_key
  bun --no-env-file "${REPO_DIR}/scripts/environment-task.js" --check
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
  for file in .codex .config .config/git .config/gh .ssh; do
    [[ ! -L "${HOME}/${file}" && ( ! -e "${HOME}/${file}" || ( -d "${HOME}/${file}" && -w "${HOME}/${file}" ) ) ]] || fail 'Shared configuration directories must be writable real directories. Preserve the conflicting path before retrying.'
  done
  [[ ! -e "${HOME}/.ssh" || -O "${HOME}/.ssh" ]] || fail 'The .ssh directory must be owned by this user.'
  require_tool stow
  stow --simulate --dir "${REPO_DIR}/dotfiles" --target "${HOME}" ai shell git gh ssh >/dev/null || fail 'Dotfiles conflict with existing configuration. Preserve it and resolve the conflict before retrying.'
  # prevent STOW directory folding from sending private runtime writes into GIT sources.
  mkdir -p -- "${HOME}/.codex" "${HOME}/.config/git" "${HOME}/.config/gh" "${HOME}/.ssh"
  chmod 700 "${HOME}/.ssh"
  install_ssh_key
  OP_SERVICE_ACCOUNT_TOKEN="${op_token}" bun --no-env-file "${REPO_DIR}/scripts/environment-task.js" --ensure
  remove_retired_ssh_wrappers
  run_bootbox --dotpkg "${REPO_DIR}/dotfiles/ai" --dotpkg "${REPO_DIR}/dotfiles/shell" --dotpkg "${REPO_DIR}/dotfiles/git" --dotpkg "${REPO_DIR}/dotfiles/gh" --dotpkg "${REPO_DIR}/dotfiles/ssh"
  while IFS= read -r file; do
    if ! grep -Fxq "${SHELL_INIT_LINE}" "${HOME}/${file}" 2>/dev/null; then
      printf '\n%s\n' "${SHELL_INIT_LINE}" >> "${HOME}/${file}"
    fi
  done < <(shell_startup_files)
  # load the same installed initialization that fresh task shells will use.
  # shellcheck source=dotfiles/shell/.config/tanaabot/env.sh
  source "${HOME}/.config/tanaabot/env.sh"
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
