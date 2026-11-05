#!/bin/bash
set -euo pipefail

fail() {
  printf 'error: %s\n' "$1" >&2
  exit "${2:-1}"
}

usage() {
  local dim="" reset=""
  if { [[ -t 1 ]] || [[ -n "${FORCE_COLOR:-}" && "${FORCE_COLOR}" != 0 ]]; } && [[ -z "${NO_COLOR-}" ]]; then
    dim=$'\033[2m'
    reset=$'\033[0m'
  fi
  printf 'Usage: cloud-setup.sh REF %s[tanaboot options...]%s\n\n' "${dim}" "${reset}"
  printf '%s\n' 'Select a branch, tag or full commit SHA in the current Cloud workspace.' \
    "Run that revision's tanaboot.sh with the remaining arguments." \
    'Use tanaboot.sh --help for provisioning options.'
}

require_clean_workspace() {
  [[ -z "$(git status --porcelain --untracked-files=normal)" ]] || fail 'Workspace has local changes. Preserve them before selecting a revision.'
}

main() (
  if [[ "${1:-}" == --help || "${1:-}" == -h ]]; then usage; return; fi
  if [[ $# -eq 0 || -z "$1" || "$1" == -* ]]; then
    usage
    fail 'Provide a branch, tag or full commit SHA before Tanaboot options.' 2
  fi
  command -v git >/dev/null 2>&1 || fail 'Git is required to select the Cloud workspace revision.'
  local workspace script_dir ref url origin rows sha name branch="" tag="" peeled=""
  workspace="$(git rev-parse --show-toplevel)" || fail 'Run Cloud setup from the existing Tanaabot workspace.'
  workspace="$(cd -- "${workspace}" && pwd -P)"
  script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
  if [[ "${script_dir}" == "${workspace}" || "${script_dir}" == "${workspace}/"* ]]; then
    # checkout may replace or remove this wrapper; finish from an external copy.
    snapshot="$(mktemp -d -t tanaaboot-cloud.XXXXXX)"
    snapshot="$(cd -- "${snapshot}" && pwd -P)"
    trap 'rm -rf -- "${snapshot}"' EXIT
    [[ "${snapshot}" != "${workspace}/"* ]] || fail 'The temporary directory must be outside the workspace.'
    cp -- "${BASH_SOURCE[0]}" "${snapshot}/cloud-setup.sh"
    bash "${snapshot}/cloud-setup.sh" "$@"
    return
  fi
  cd -- "${workspace}"
  url="https://github.com/tanaabased/tanaabot.git"
  origin="$(git config --get remote.origin.url)" || fail 'The workspace needs its canonical Tanaabot origin.'
  case "${origin}" in
    https://github.com/tanaabased/tanaabot | https://github.com/tanaabased/tanaabot.git | git@github.com:tanaabased/tanaabot.git | ssh://git@github.com/tanaabased/tanaabot.git) ;;
    *) fail 'Workspace origin is not the canonical tanaabased/tanaabot repository.' ;;
  esac
  require_clean_workspace
  ref="$1"
  shift
  if [[ "${1:-}" == -- ]]; then shift; fi
  if [[ "${ref}" =~ ^[a-fA-F0-9]{40}$ ]]; then
    sha="$(printf '%s' "${ref}" | tr '[:upper:]' '[:lower:]')"
  else
    git check-ref-format "refs/heads/${ref}" >/dev/null 2>&1 || fail 'Invalid reference. Use a branch, tag or full commit SHA.' 2
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
  fi
  [[ "${sha}" =~ ^[a-f0-9]{40}$ ]] || fail 'Reference did not resolve to one commit.'
  git fetch -q --no-tags --depth=1 "${url}" "${sha}" || fail 'Resolved commit could not be fetched. No other revision was selected.'
  [[ "$(git rev-parse FETCH_HEAD)" == "${sha}" && "$(git cat-file -t "${sha}")" == commit ]] || fail 'Fetched object is not the requested commit.'
  git cat-file -e "${sha}:tanaboot.sh" 2>/dev/null || fail 'Selected revision has no tanaboot.sh entrypoint.'
  require_clean_workspace
  git checkout -q --detach "${sha}" || fail 'Cannot select the workspace revision. Preserve conflicting files before retrying.'
  printf 'note: Workspace revision: %s (%s)\n' "${ref}" "${sha}"
  bash "${workspace}/tanaboot.sh" "$@"
)

main "$@"
