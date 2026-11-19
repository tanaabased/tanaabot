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
  printf '%s\n' 'Select dev (default branch), stable (GitHub Latest), or edge (newest published release).' \
    'An empty release channel falls back to dev. Failed lookups stop setup.' \
    'You can also select a branch, tag or full commit SHA. Use a SHA for names reserved by channels.' \
    "Run that revision's tanaboot.sh with the remaining arguments." \
    'Use tanaboot.sh --help for provisioning options.'
}

require_clean_workspace() {
  [[ -z "$(git status --porcelain --untracked-files=normal)" ]] || fail 'Workspace has local changes. Preserve them before selecting a revision.'
}

resolve_default_branch() {
  local rows first second name branch="" sha=""
  rows="$(git ls-remote --exit-code --symref "$1" HEAD)" ||
    fail 'Could not read the default branch from the canonical repository.'
  while read -r first second name; do
    if [[ "${first}" == ref: && "${name}" == HEAD && "${second}" == refs/heads/* ]]; then
      [[ -z "${branch}" ]] || fail 'The canonical repository advertised more than one default branch.'
      branch="${second}"
    elif [[ "${second}" == HEAD && -z "${name}" ]]; then
      [[ -z "${sha}" ]] || fail 'The canonical repository advertised more than one HEAD commit.'
      sha="${first}"
    fi
  done <<< "${rows}"
  [[ -n "${branch}" ]] || fail 'The canonical repository HEAD does not point to a default branch.'
  printf '%s\t%s\n' "${sha}" "${branch#refs/heads/}"
}

resolve_named_ref() {
  local url="$1" ref="$2" kind="${3:-explicit}" rows sha name branch="" tag="" peeled=""
  local -a patterns=("refs/tags/${ref}" "refs/tags/${ref}^{}")
  if [[ "${kind}" == release ]]; then
    git check-ref-format "refs/tags/${ref}" >/dev/null 2>&1 ||
      fail 'The selected GitHub release has an invalid tag.'
    rows="$(git ls-remote --exit-code "${url}" "${patterns[@]}")" ||
      fail "Could not resolve the selected GitHub release tag '${ref}'. Check the tag and network access."
  else
    git check-ref-format "refs/heads/${ref}" >/dev/null 2>&1 ||
      fail 'Invalid reference. Use a channel, branch, tag or full commit SHA.' 2
    rows="$(git ls-remote --exit-code "${url}" "refs/heads/${ref}" "${patterns[@]}")" ||
      fail 'Reference is unavailable in the canonical repository. Check its name and network access.'
  fi
  while read -r sha name; do
    case "${name}" in
      "refs/heads/${ref}") branch="${sha}" ;;
      "refs/tags/${ref}") tag="${sha}" ;;
      "refs/tags/${ref}^{}") peeled="${sha}" ;;
    esac
  done <<< "${rows}"
  [[ -z "${branch}" || -z "${tag}" ]] ||
    fail 'Reference is ambiguous: both a branch and tag have that name. Use a full commit SHA.'
  if [[ -n "${branch}" ]]; then
    printf '%s\tbranch\n' "${branch}"
  else
    printf '%s\ttag\n' "${peeled:-${tag}}"
  fi
}

release_status() {
  curl --silent --show-error --connect-timeout 10 --max-time 30 --proto '=https' \
    --header 'Accept: application/vnd.github+json' --header 'X-GitHub-Api-Version: 2026-03-10' \
    --suppress-connect-headers --dump-header "$2/headers" --output "$2/body" \
    --write-out '%{http_code}' "$1"
}

release_tag() (
  local channel="$1" api='https://api.github.com/repos/tanaabased/tanaabot/releases'
  local temp status selected more page=1
  if ! command -v curl >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1; then
    fail "curl and jq are required to look up the '${channel}' release channel."
  fi
  temp="$(mktemp -d -t tanaaboot-releases.XXXXXX)" || fail 'Could not prepare the release lookup.'
  trap 'rm -rf -- "${temp}"' EXIT

  if [[ "${channel}" == stable ]]; then
    status="$(release_status "${api}/latest" "${temp}")" ||
      fail "GitHub '${channel}' release lookup failed. Check network access and retry."
    if [[ "${status}" == 404 ]]; then
      # GitHub can also return 404 for an inaccessible repository. Verify the releases endpoint.
      jq -es 'length == 1 and (.[0].message == "Not Found")' "${temp}/body" >/dev/null ||
        fail "GitHub '${channel}' release lookup returned an unexpected HTTP 404 response."
      status="$(release_status "${api}?per_page=1" "${temp}")" ||
        fail "Could not confirm that the GitHub '${channel}' channel is empty. Check network access and retry."
      [[ "${status}" == 200 ]] ||
        fail "Could not confirm that the GitHub '${channel}' channel is empty (HTTP ${status})."
      jq -es 'length == 1 and (.[0] | type == "array" and all(.[]; (.draft | type == "boolean")))' \
        "${temp}/body" >/dev/null ||
        fail "Could not confirm that the GitHub '${channel}' channel is empty. Invalid releases response."
      return
    fi
    [[ "${status}" == 200 ]] || fail "GitHub '${channel}' release lookup failed (HTTP ${status})."
    selected="$(jq -ces '
      if length == 1 and (.[0] | .draft == false and .prerelease == false and
        (.published_at | fromdateiso8601 | type == "number"))
      then .[0] else error("expected one published full release") end
    ' "${temp}/body")" || fail "GitHub '${channel}' release lookup returned invalid release data."
  else
    while :; do
      status="$(release_status "${api}?per_page=100&page=${page}" "${temp}")" ||
        fail "GitHub '${channel}' release lookup failed on page ${page}. Check network access and retry."
      [[ "${status}" == 200 ]] || fail "GitHub '${channel}' release lookup failed on page ${page} (HTTP ${status})."
      more="$(awk 'tolower($1) == "link:" && /;[[:space:]]*rel="next"/ {next_page=1}
        END {print next_page ? "true" : "false"}' "${temp}/headers")" ||
        fail "Could not read GitHub release pagination on page ${page}."
      jq -ces --argjson page "${page}" --argjson more "${more}" '
        if length == 1 and (.[0] | type == "array" and (length > 0 or ($page == 1 and ($more | not))))
        then .[0] else error("expected one release list") end |
        map(
          if .draft == true then empty
          elif .draft == false and (.id | type == "number" and . > 0 and floor == .)
          then {id, published_at: (.published_at | fromdateiso8601), tag_name}
          else error("incomplete release metadata") end
        )
      ' "${temp}/body" >> "${temp}/pages" ||
        fail "GitHub '${channel}' release lookup returned invalid data on page ${page}."
      [[ "${more}" == true ]] || break
      page=$((page + 1))
    done
    selected="$(jq -cs '
      add | if length == (unique_by(.id) | length)
      then max_by([.published_at, .id]) else error("duplicate releases across pages") end
    ' "${temp}/pages")" || fail "GitHub '${channel}' release lookup returned inconsistent pages."
    [[ "${selected}" != null ]] || return 0
  fi

  jq -er '.tag_name | if type == "string" and length > 0 and (test("[[:cntrl:]]") | not)
    then . else error("expected a release tag name") end' <<< "${selected}" ||
    fail "The selected GitHub '${channel}' release has a missing or invalid tag."
)

write_publication_receipt() (
  local workspace="$1" selector="$2" sha="$3" mode="$4" branch="$5" tag="$6" fallback="$7"
  local folder receipt temporary prefix suffix setup_id jq_bin
  umask 077
  folder="$(realpath -m -- "${HOME}/.local/state/tanaabot")"
  case "${folder}" in
    "${workspace}" | "${workspace}/"*) fail 'The setup receipt must live outside the checkout.' ;;
  esac
  receipt="${folder}/publication.json"
  [[ ! -L "${receipt}" && ( ! -e "${receipt}" || -f "${receipt}" ) ]] ||
    fail 'The setup receipt path must be a regular file.'
  if ! jq_bin="$(command -v jq)"; then
    for jq_bin in "${HOME}/.linuxbrew/bin/jq" /home/linuxbrew/.linuxbrew/bin/jq; do
      [[ ! -x "${jq_bin}" ]] || break
    done
  fi
  [[ -x "${jq_bin}" ]] || fail 'jq is required to write the setup receipt.'
  prefix="$(printf '%s' "${tag:-${branch:-commit}}" | LC_ALL=C tr -cs 'a-zA-Z0-9._-' '-' | cut -c 1-24)"
  suffix="$(od -An -N4 -tx1 /dev/urandom | tr -d '[:space:]')"
  [[ "${suffix}" =~ ^[a-f0-9]{8}$ ]] || fail 'Could not generate a setup ID.'
  setup_id="${prefix}-${suffix}"
  mkdir -p -- "${folder}"
  temporary="$(mktemp "${folder}/.publication.XXXXXX")"
  trap 'rm -f -- "${temporary}"' EXIT
  # jq resolves the named bindings inside the filter.
  # shellcheck disable=SC2016
  "${jq_bin}" -n --arg setupId "${setup_id}" --arg selector "${selector}" --arg mode "${mode}" \
    --arg installedCommit "${sha}" --arg branch "${branch}" --arg tag "${tag}" --arg fallback "${fallback}" '
    {
      version: 1, repository: "tanaabased/tanaabot", $setupId, $selector, $mode, $installedCommit,
      branch: ($branch | select(length > 0) // null),
      tag: ($tag | select(length > 0) // null),
      fallback: ($fallback | select(length > 0) // null),
      target: (if $mode == "branch" then {branch: $branch} else {commit: $installedCommit} end)
    }
  ' > "${temporary}"
  mv -fT -- "${temporary}" "${receipt}"
  printf 'note: Setup ID: %s\n' "${setup_id}"
)

main() (
  if [[ "${1:-}" == --help || "${1:-}" == -h ]]; then usage; return; fi
  if [[ $# -eq 0 || -z "$1" || "$1" == -* ]]; then
    usage
    fail 'Provide a channel, branch, tag or full commit SHA before Tanaboot options.' 2
  fi
  command -v git >/dev/null 2>&1 || fail 'Git is required to select the Cloud workspace revision.'
  local workspace script_dir ref url origin sha resolved option
  local mode branch="" tag="" fallback=""
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
  case "${ref}" in
    dev)
      mode=branch
      resolved="$(resolve_default_branch "${url}")"
      IFS=$'\t' read -r sha branch <<< "${resolved}"
      ;;
    stable|edge)
      mode=channel
      tag="$(release_tag "${ref}")"
      if [[ -n "${tag}" ]]; then
        resolved="$(resolve_named_ref "${url}" "${tag}" release)"
        sha="${resolved%%$'\t'*}"
      else
        printf 'note: %s has no eligible GitHub release. Falling back to dev.\n' "${ref}" >&2
        fallback=dev
        resolved="$(resolve_default_branch "${url}")"
        IFS=$'\t' read -r sha branch <<< "${resolved}"
      fi
      ;;
    *)
      if [[ "${ref}" =~ ^[a-fA-F0-9]{40}$ ]]; then
        mode=commit
        sha="$(printf '%s' "${ref}" | tr '[:upper:]' '[:lower:]')"
      else
        resolved="$(resolve_named_ref "${url}" "${ref}")"
        IFS=$'\t' read -r sha mode <<< "${resolved}"
        if [[ "${mode}" == branch ]]; then branch="${ref}"; else tag="${ref}"; fi
      fi
      ;;
  esac
  [[ "${sha}" =~ ^[a-f0-9]{40}$ ]] || fail 'Reference did not resolve to one commit.'
  local shallow
  local -a fetch_options=(--atomic --no-prune --tags)
  shallow="$(git rev-parse --is-shallow-repository)" || fail 'Cannot determine workspace history depth.'
  if [[ "${shallow}" == true ]]; then
    fetch_options+=(--unshallow)
  fi
  git fetch --no-progress "${fetch_options[@]}" "${url}" "${sha}" ||
    fail 'Could not fetch the resolved commit and tags. No other revision was selected.'
  [[ "$(git rev-parse FETCH_HEAD)" == "${sha}" && "$(git cat-file -t "${sha}")" == commit ]] || fail 'Fetched object is not the requested commit.'
  git cat-file -e "${sha}:tanaboot.sh" 2>/dev/null || fail 'Selected revision has no tanaboot.sh entrypoint.'
  require_clean_workspace
  git checkout -q --detach "${sha}" || fail 'Cannot select the workspace revision. Preserve conflicting files before retrying.'
  printf 'note: Workspace revision: %s (%s)\n' "${ref}" "${sha}"
  bash "${workspace}/tanaboot.sh" "$@"
  for option in "$@"; do
    case "${option}" in
      --debug | --debug=*) ;;
      *) return 0 ;;
    esac
  done
  [[ "$(git rev-parse HEAD)" == "${sha}" ]] ||
    fail 'The checkout changed during setup. Run setup again before publishing.'
  write_publication_receipt "${workspace}" "${ref}" "${sha}" "${mode}" "${branch}" "${tag}" "${fallback}"
)

main "$@"
