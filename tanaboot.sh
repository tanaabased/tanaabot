#!/bin/bash
set -euo pipefail
# Prepare tanaabot's Codex Cloud environment through Bootbox and Codex Tools.

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
SOURCE_URL="https://github.com/tanaabased/tanaabot.git"
BOOTBOX_URL="https://bootbox.tanaab.sh/bootbox.sh"
DATA_DIR="${XDG_DATA_HOME:-${HOME}/.local/share}/tanaabot"
SOURCE_REF=""
DEBUG="${TANABOOT_DEBUG:-${DEBUG:-${RUNNER_DEBUG:-}}}"
TARGET="bootstrap"
ACTION="apply"
PLUGIN_SOURCES=()
IFS=',' read -r -a PLUGIN_SOURCES <<< "${TANABOOT_CODEX_PLUGIN:-}"
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
  local debug_display="off" plugins_display="none"
  if [[ ${#PLUGIN_SOURCES[@]} -gt 0 ]]; then plugins_display="$(IFS=,; printf '%s' "${PLUGIN_SOURCES[*]}")"; fi
  if value_enabled "${DEBUG}"; then debug_display="on"; fi
  cat <<HELP
Usage: ${tty_bold}tanaboot.sh${tty_reset} ${tty_dim}[TANABOOT_*...] [options]${tty_reset}

Prepare a Linux Codex Cloud environment for tanaabot.
The default mode selects host then agent. Choose one mode and one action.

${tty_tp}Options:${tty_reset}
  --ref REF           Resolve a canonical branch, tag or full commit SHA ${tty_dim}[default: ${SOURCE_REF:-this checkout}]${tty_reset}
  --codex-plugin SRC  Install a Codex plugin; repeatable ${tty_dim}[default: ${plugins_display}]${tty_reset}
  --host              Select host dependencies only
  --agent             Select guidance, dotpackages and Codex plugins only
  --check             Check base setup without installing; omit --codex-plugin
  --dry-run           Preview delegation without downloads or changes
  --debug             Show diagnostics ${tty_dim}[default: ${debug_display}]${tty_reset}
  --version           Show the script version
  -h, --help          Show this help

${tty_tp}Environment Variables:${tty_reset}
  TANABOOT_DEBUG        Same as --debug
  TANABOOT_CODEX_PLUGIN Same as --codex-plugin; comma-separated sources

Plugin sources: npm:<package>[@version] or tanaabased repo[#ref] (default: main).

HELP
}

option_error() {
  usage
  fail "$1" 2
}

parse_args() {
  local info="" plugins_cli=""
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
      --ref)
        [[ $# -gt 1 && -n "$2" && "$2" != -* ]] || option_error 'Provide a branch, tag or full commit SHA after --ref.'
        [[ -z "${SOURCE_REF}" ]] || option_error 'Choose only one reference.'
        SOURCE_REF="$2"
        shift
        ;;
      --ref=*)
        [[ -z "${SOURCE_REF}" ]] || option_error 'Choose only one reference.'
        SOURCE_REF="${1#*=}"
        [[ -n "${SOURCE_REF}" && "${SOURCE_REF}" != -* ]] || option_error 'Provide a branch, tag or full commit SHA after --ref.'
        ;;
      --codex-plugin | --codex-plugin=*)
        if [[ -z "${plugins_cli}" ]]; then PLUGIN_SOURCES=(); plugins_cli=1; fi
        if [[ "$1" == --codex-plugin ]]; then
          [[ $# -gt 1 && -n "$2" && "$2" != -* ]] || option_error 'Provide a Codex plugin source after --codex-plugin.'
          PLUGIN_SOURCES+=("$2")
          shift
        else
          [[ -n "${1#*=}" && "${1#*=}" != -* ]] || option_error 'Provide a Codex plugin source after --codex-plugin.'
          PLUGIN_SOURCES+=("${1#*=}")
        fi
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
  validate_plugins
  case "${info}" in
    -h | --help) usage; exit 0 ;;
    --version) printf '%s\n' "${SCRIPT_VERSION}"; exit 0 ;;
  esac
}

validate_plugins() {
  local selection repo ref
  for selection in ${PLUGIN_SOURCES[@]+"${PLUGIN_SOURCES[@]}"}; do
    if [[ "${selection}" == npm:* ]]; then
      [[ -n "${selection#npm:}" ]] || option_error 'Provide a package after npm:.'
      continue
    fi
    repo="${selection%%#*}"
    [[ "${repo}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ && ${#repo} -le 100 ]] || option_error 'Use npm:<package>[@version] or a tanaabased repository name[#ref].'
    if [[ "${selection}" == *#* ]]; then
      ref="${selection#*#}"
      validate_ref "${ref}"
    fi
  done
  if [[ ${#PLUGIN_SOURCES[@]} -gt 0 ]]; then
    [[ "${TARGET}" != host ]] || option_error '--codex-plugin requires agent or default setup.'
    [[ "${ACTION}" != check ]] || option_error '--check verifies base setup; omit --codex-plugin.'
  fi
}

plan_host() {
  printf '\n%shost%s\n' "${tty_tp}" "${tty_reset}"
  plan_action provision 'Bootbox dependencies and Brewfile'
  plan_command bootbox.sh --brewfile "${REPO_DIR}/Brewfile"
  plan_action configure 'Homebrew and Node PATH for this setup'
}

plan_agent() {
  printf '\n%sagent%s\n' "${tty_tp}" "${tty_reset}"
  plan_action stow 'Home-relative dotpackages through Bootbox'
  plan_command bootbox.sh --dotpkg "${REPO_DIR}/dotfiles/ai" --dotpkg "${REPO_DIR}/dotfiles/shell"
  plan_action install "Tanaabot plugin from ${REPO_DIR} through Codex Tools"
  local selection
  for selection in ${PLUGIN_SOURCES[@]+"${PLUGIN_SOURCES[@]}"}; do plan_action install "Codex plugin: ${selection}"; done
}

require_tool() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required. Install it in the Cloud setup, then retry."
}

validate_ref() {
  [[ -n "$1" && "$1" != -* ]] || fail 'Invalid reference. Use a branch, tag or full commit SHA.' 2
  [[ "$1" =~ ^[a-fA-F0-9]{40}$ ]] || git check-ref-format "refs/heads/$1" >/dev/null 2>&1 || fail 'Invalid reference. Use a branch, tag or full commit SHA.' 2
}

resolve_ref() {
  local url="$1" ref="$2" rows sha name branch="" tag="" peeled=""
  validate_ref "${ref}"
  if [[ "${ref}" =~ ^[a-fA-F0-9]{40}$ ]]; then
    printf '%s\n' "${ref}" | tr '[:upper:]' '[:lower:]'
    return
  fi
  rows="$(git ls-remote --exit-code "${url}" "refs/heads/${ref}" "refs/tags/${ref}" "refs/tags/${ref}^{}")" || fail 'Reference is unavailable in the canonical repository. Check its name and network access.'
  while read -r sha name; do
    case "${name}" in
      "refs/heads/${ref}") branch="${sha}" ;;
      "refs/tags/${ref}") tag="${sha}" ;;
      "refs/tags/${ref}^{}") peeled="${sha}" ;;
    esac
  done <<< "${rows}"
  [[ -z "${branch}" || -z "${tag}" ]] || fail 'Reference is ambiguous: both a branch and tag have that name. Use a full commit SHA.'
  sha="${branch:-${peeled:-${tag}}}"
  [[ "${sha}" =~ ^[a-f0-9]{40}$ ]] || fail 'Reference did not resolve to one commit.'
  printf '%s\n' "${sha}"
}

verify_source() {
  local dir="$1" url="$2" sha="$3"
  [[ -d "${dir}/.git" && ! -L "${dir}" && ! -L "${dir}/.git" ]] || fail 'Managed source path conflicts with an existing file or checkout.'
  [[ "$(git -C "${dir}" config --get remote.origin.url)" == "${url}" ]] || fail 'Managed source has an unexpected origin; preserve it and resolve the conflict before retrying.'
  [[ "$(git -C "${dir}" rev-parse HEAD)" == "${sha}" && "$(git -C "${dir}" cat-file -t "${sha}")" == commit ]] || fail 'Managed source does not match the resolved commit.'
  [[ -z "$(git -C "${dir}" status --porcelain --untracked-files=normal)" ]] || fail 'Managed source has local changes; preserve them before retrying.'
}

acquire_source() (
  local project="$1" url="$2" sha="$3" dir parent
  acquisition_stage=""
  dir="${DATA_DIR}/sources/${project}/${sha}"
  if [[ "${ACTION}" == check ]]; then
    verify_source "${dir}" "${url}" "${sha}"
    printf '%s\n' "${dir}"
    return
  fi
  parent="$(dirname -- "${dir}")"
  mkdir -p -- "${parent}" || fail 'Cannot create the managed source directory.'
  acquisition_lock="${dir}.lock"
  mkdir -- "${acquisition_lock}" 2>/dev/null || fail 'Source acquisition is already running or its lock needs operator inspection.'
  # Subshell globals survive an exit that unwinds function-local variables.
  trap '[[ -z "${acquisition_stage}" ]] || rm -rf -- "${acquisition_stage}"; rmdir -- "${acquisition_lock}"' EXIT
  if [[ ! -e "${dir}" && ! -L "${dir}" ]]; then
    acquisition_stage="$(mktemp -d "${parent}/.acquire.XXXXXX")" || fail 'Cannot create source staging.'
    git init -q "${acquisition_stage}" || fail 'Cannot initialize source staging.'
    git -C "${acquisition_stage}" remote add origin "${url}" || fail 'Cannot select the canonical source.'
    git -C "${acquisition_stage}" fetch -q --depth=1 origin "${sha}" || fail 'Resolved commit could not be fetched. Nothing else was selected.'
    [[ "$(git -C "${acquisition_stage}" rev-parse FETCH_HEAD)" == "${sha}" && "$(git -C "${acquisition_stage}" cat-file -t "${sha}")" == commit ]] || fail 'Fetched object is not the requested commit.'
    git -C "${acquisition_stage}" checkout -q --detach "${sha}" || fail 'Cannot check out the resolved commit.'
    mv -- "${acquisition_stage}" "${dir}" || fail 'Cannot retain the selected source.'
    acquisition_stage=""
  fi
  verify_source "${dir}" "${url}" "${sha}"
  printf '%s\n' "${dir}"
)

preflight() {
  [[ "$(uname -s)" == Linux ]] || fail 'Tanaboot setup requires Linux. Use --dry-run to preview it on this host.'
  case "$(uname -m)" in
    x86_64 | aarch64 | arm64) ;;
    *) fail 'Bootbox requires a supported 64-bit Linux architecture.' ;;
  esac
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
  local variable script="${BOOTBOX_SCRIPT}"
  # Inherited profile inputs must not add secrets, SSH keys or overwrite behavior.
  for variable in ${!BOOTBOX_@} ${!TANAAB_@} OP_SERVICE_ACCOUNT_TOKEN INTERACTIVE; do
    unset "${variable}"
  done
  cd -- "$(dirname -- "${script}")"
  NONINTERACTIVE=1 BOOTBOX_QUIET=1 BOOTBOX_DEBUG="${DEBUG}" bash "${script}" "$@"
)

activate_tools() {
  local node_prefix brew_prefix
  if ! command -v brew >/dev/null 2>&1 && [[ -x /home/linuxbrew/.linuxbrew/bin/brew ]]; then
    export PATH="/home/linuxbrew/.linuxbrew/bin:${PATH}"
  fi
  require_tool brew
  node_prefix="$(brew --prefix node@26)"
  brew_prefix="$(brew --prefix)"
  PATH="${node_prefix}/bin:${brew_prefix}/bin:${PATH}"
  export PATH
}

check_host() {
  local node_version node_major
  activate_tools
  run_bootbox --check-core || fail 'Bootbox core dependencies are incomplete. Run host setup.'
  HOMEBREW_NO_AUTO_UPDATE=1 brew bundle check --file "${REPO_DIR}/Brewfile" --no-upgrade >/dev/null || fail 'Host dependencies are incomplete. Run host setup.'
  require_tool node
  require_tool bun
  node_major="$(cut -d . -f 1 "${REPO_DIR}/.node-version")"
  node_version="$(node --version)"
  [[ "${node_version}" == "v${node_major}."* ]] || fail 'Node does not match the major version in .node-version. Run host setup and check its PATH.'
  [[ "$(bun --version)" == "$(cat "${REPO_DIR}/.bun-version")" ]] || fail 'Bun does not match .bun-version. Select that runtime in the Cloud setup and retry.'
}

codex_tools() (
  local variable
  for variable in ${!CODEX_TOOLS_@}; do unset "${variable}"; done
  bun "${REPO_DIR}/node_modules/.bin/codex-tools" "$@"
)

check_plugin() {
  local output
  output="$(codex_tools status --repo-root "$1" --json)" || fail 'Plugin readiness failed. Run agent setup and inspect Codex Tools diagnostics.'
  jq -e '.ok == true and .inspection.installed == true and .inspection.enabled == true' <<< "${output}" >/dev/null || fail 'Plugin is not installed and enabled. Resolve its Codex state before retrying.'
}

install_plugins() {
  local selection repo ref sha source
  for selection in ${PLUGIN_SOURCES[@]+"${PLUGIN_SOURCES[@]}"}; do
    source="${selection}"
    if [[ "${selection}" != npm:* ]]; then
      repo="${selection%%#*}"
      ref=main
      if [[ "${selection}" == *#* ]]; then ref="${selection#*#}"; fi
      sha="$(resolve_ref "https://github.com/tanaabased/${repo}.git" "${ref}")"
      note "Plugin source: ${repo}#${ref} (${sha})"
      source="$(acquire_source "${repo}" "https://github.com/tanaabased/${repo}.git" "${sha}")"
    fi
    codex_tools install "${source}"
  done
}

check_agent() {
  local file
  [[ -d "${HOME}/.codex" && ! -L "${HOME}/.codex" ]] || fail 'Codex home must be a real directory so runtime state stays outside the source checkout.'
  [[ -x "${REPO_DIR}/node_modules/.bin/codex-tools" ]] || fail 'Codex Tools is missing. Run agent setup.'
  cmp -s "${REPO_DIR}/dotfiles/ai/.codex/AGENTS.md" "${HOME}/.codex/AGENTS.md" || fail 'Global guidance is missing or differs. Run agent setup; preserve any conflicting guidance.'
  cmp -s "${REPO_DIR}/dotfiles/shell/.config/tanaabot/env.sh" "${HOME}/.config/tanaabot/env.sh" || fail 'Shell initialization is missing or differs. Run agent setup.'
  for file in .profile .bashrc; do
    grep -Fxq "${SHELL_INIT_LINE}" "${HOME}/${file}" || fail 'Shell startup is incomplete. Run agent setup.'
  done
  check_plugin "${REPO_DIR}"
}

apply_agent() {
  local file
  [[ -f "${REPO_DIR}/bun.lock" ]] || fail 'The selected revision is missing bun.lock.'
  for file in .profile .bashrc; do
    [[ ! -L "${HOME}/${file}" && ( ! -e "${HOME}/${file}" || ( -f "${HOME}/${file}" && -w "${HOME}/${file}" ) ) ]] || fail 'Shell startup conflicts with an existing path. Preserve it and resolve the conflict before retrying.'
  done
  for file in .codex .config; do
    [[ ! -L "${HOME}/${file}" && ( ! -e "${HOME}/${file}" || ( -d "${HOME}/${file}" && -w "${HOME}/${file}" ) ) ]] || fail 'Shared configuration directories must be writable real directories. Preserve the conflicting path before retrying.'
  done
  require_tool stow
  stow --simulate --dir "${REPO_DIR}/dotfiles" --target "${HOME}" ai shell >/dev/null 2>&1 || fail 'Guidance or shell dotfiles conflict with existing configuration. Preserve it and resolve the conflict before retrying.'
  # Prevent Stow directory folding from sending private runtime writes into Git sources.
  mkdir -p -- "${HOME}/.codex" "${HOME}/.config"
  run_bootbox --dotpkg "${REPO_DIR}/dotfiles/ai" --dotpkg "${REPO_DIR}/dotfiles/shell"
  for file in .profile .bashrc; do
    if ! grep -Fxq "${SHELL_INIT_LINE}" "${HOME}/${file}" 2>/dev/null; then
      printf '\n%s\n' "${SHELL_INIT_LINE}" >> "${HOME}/${file}"
    fi
  done
  (cd -- "${REPO_DIR}" && bun install --production --frozen-lockfile --ignore-scripts)
  codex_tools install "${REPO_DIR}"
  install_plugins
  check_agent
}

main() (
  local sha source selection lock
  setup_lock=""
  boot_tmpdir=""
  trap '[[ -z "${boot_tmpdir}" ]] || rm -rf -- "${boot_tmpdir}"; [[ -z "${setup_lock}" ]] || rmdir -- "${setup_lock}"' EXIT
  parse_args "$@"
  debug "target=${TARGET} action=${ACTION}"
  if [[ "${ACTION}" == plan ]]; then
    note 'Preview only. Commands below are not executed.'
    if [[ -n "${SOURCE_REF}" ]]; then
      validate_ref "${SOURCE_REF}"
      plan_action resolve "${SOURCE_REF} from canonical tanaabased/tanaabot (not resolved offline)"
      plan_action run "That revision's ${TARGET} setup"
      for selection in ${PLUGIN_SOURCES[@]+"${PLUGIN_SOURCES[@]}"}; do plan_action install "Codex plugin: ${selection}"; done
      return
    fi
    if [[ "${TARGET}" == bootstrap || "${TARGET}" == host ]]; then plan_host; fi
    if [[ "${TARGET}" == bootstrap || "${TARGET}" == agent ]]; then plan_agent; fi
    return
  fi
  preflight
  if [[ -n "${SOURCE_REF}" ]]; then
    sha="$(resolve_ref "${SOURCE_URL}" "${SOURCE_REF}")"
    note "Requested reference: ${SOURCE_REF}"
    note "Resolved commit: ${sha}"
    source="$(acquire_source tanaabot "${SOURCE_URL}" "${sha}")"
    [[ -f "${source}/tanaboot.sh" ]] || fail 'Selected revision has no tanaboot.sh entrypoint.'
    local -a forwarded=("--debug=${DEBUG}")
    [[ "${TARGET}" == bootstrap ]] || forwarded+=("--${TARGET}")
    [[ "${ACTION}" != check ]] || forwarded+=(--check)
    for selection in ${PLUGIN_SOURCES[@]+"${PLUGIN_SOURCES[@]}"}; do forwarded+=(--codex-plugin "${selection}"); done
    bash "${source}/tanaboot.sh" "${forwarded[@]}"
    return
  fi
  if [[ "${ACTION}" != check ]]; then
    mkdir -p -- "${DATA_DIR}"
    lock="${DATA_DIR}/setup.lock"
    mkdir -- "${lock}" 2>/dev/null || fail 'Setup is already running or its lock needs operator inspection.'
    setup_lock="${lock}"
  fi
  prepare_bootbox
  if [[ "${TARGET}" == bootstrap || "${TARGET}" == host ]]; then
    if [[ "${ACTION}" == apply ]]; then run_bootbox --brewfile "${REPO_DIR}/Brewfile"; fi
    check_host
  else
    check_host
  fi
  if [[ "${TARGET}" == bootstrap || "${TARGET}" == agent ]]; then
    if [[ "${ACTION}" == apply ]]; then apply_agent; else check_agent; fi
  fi
  success "${TARGET} ${ACTION} complete."
)

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi
