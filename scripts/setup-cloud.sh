#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
bootbox_url='https://bootbox.tanaab.sh/bootbox.sh'

usage() {
  cat <<'HELP'
Usage: setup-cloud.sh <plan|check|apply> <bootstrap|host|guidance|shell|git|gh|ssh>
       setup-cloud.sh <plan|check|apply> plugin <id> local <path>
       setup-cloud.sh <plan|check|apply> plugin <id> github <owner/repo> <ref>
       setup-cloud.sh <plan|check|apply> plugin <id> npm <npm:selector>

Scaffold only. Plan prints intent; check and apply return 1 until implemented.
Invalid arguments return 2. No mode downloads, installs or changes runtime state.
Relative local plugin paths resolve from the tanaabot checkout, not the caller.

Options:
  -h, --help    Show this help
HELP
}

invalid() {
  printf 'error: %s Use setup-cloud.sh --help.\n' "$1" >&2
  exit 2
}

if [[ "${1:-}" == '--help' || "${1:-}" == '-h' ]]; then
  [[ $# -eq 1 ]] || invalid 'Unexpected arguments.'
  usage
  exit 0
fi
[[ $# -ge 2 ]] || invalid 'An action and target are required.'
action=$1
target=$2
shift 2
case "$action" in plan|check|apply) ;; *) invalid 'Unknown action.' ;; esac

case "$target" in
  bootstrap|host|guidance|shell|git|gh|ssh)
    [[ $# -eq 0 ]] || invalid 'Unexpected target arguments.'
    ;;
  plugin)
    [[ $# -ge 3 ]] || invalid 'A plugin ID, source kind and source are required.'
    plugin_id=$1
    source_kind=$2
    plugin_source=$3
    [[ "$plugin_id" =~ ^[a-z0-9][a-z0-9-]*$ ]] || invalid 'Invalid plugin ID.'
    [[ -n "$plugin_source" ]] || invalid 'An empty plugin source is not supported.'
    case "$source_kind" in
      local) [[ $# -eq 3 ]] || invalid 'Local sources take one path.' ;;
      github)
        [[ $# -eq 4 && -n "$4" && "$4" != -* ]] || invalid 'GitHub sources require a ref.'
        [[ "$plugin_source" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || invalid 'Use an owner/repo slug.'
        ;;
      npm)
        [[ $# -eq 3 && "$plugin_source" == npm:?* ]] || invalid 'Use an npm: selector.'
        ;;
      *) invalid 'Unknown plugin source kind.' ;;
    esac
    ;;
  *) invalid 'Unknown target.' ;;
esac

# A stub must never satisfy a setup check or allow a later step to assume provisioning succeeded.
if [[ "$action" != plan ]]; then
  printf 'error: Codex Cloud %s %s is not implemented; nothing was changed.\n' "$target" "$action" >&2
  exit 1
fi

printf 'status: scaffold preview; no installation or readiness check performed\n'
case "$target" in
  bootstrap)
    printf 'Host setup precedes agent setup; the installer integration remains undecided.\n'
    printf 'Codex automation management is separate from this Cloud setup scaffold.\n'
    printf 'host declarations: .agent-system/setup-host.yaml\n'
    cat "$repo_dir/.agent-system/setup-host.yaml"
    printf '\nagent declarations: .agent-system/setup-agent.yaml\n'
    cat "$repo_dir/.agent-system/setup-agent.yaml"
    ;;
  host)
    printf 'Bootbox source: %s\n' "$bootbox_url"
    printf 'Brewfile source: %s/Brewfile\n' "$repo_dir"
    printf 'Pending: verified acquisition, Cloud prerequisites, runtime versions and persistent Homebrew PATH.\n'
    ;;
  guidance)
    printf 'Dotpackage source: %s/dotfiles/ai\n' "$repo_dir"
    printf 'Pending: verify the Cloud home and Codex guidance location, then delegate dotpackage application to Bootbox.\n'
    ;;
  shell)
    printf 'Dotpackage source: %s/dotfiles/shell\n' "$repo_dir"
    printf 'Pending: Cloud shell startup, Homebrew discovery and PATH precedence in fresh tasks.\n'
    ;;
  git)
    printf 'Dotpackage source: %s/dotfiles/git\n' "$repo_dir"
    printf 'Pending: approved runtime identity and separate SSH signing key, signer and trust configuration.\n'
    ;;
  gh)
    printf 'Dotpackage source: %s/dotfiles/gh\n' "$repo_dir"
    printf 'Pending: verify the approved GitHub account through the executing host; no credentials are bundled.\n'
    ;;
  ssh)
    printf 'Dotpackage source: %s/dotfiles/ssh\n' "$repo_dir"
    printf 'Pending: outbound authentication and key delivery. Inbound authorized_keys is deferred unless needed.\n'
    ;;
  plugin)
    printf 'plugin: %s\n' "$plugin_id"
    case "$source_kind" in
      local)
        [[ "$plugin_source" == /* ]] || plugin_source="$repo_dir/$plugin_source"
        printf 'source checkout: %s\n' "$plugin_source"
        ;;
      github)
        printf 'source repository: https://github.com/%s.git\nrequested ref: %s\n' "$plugin_source" "$4"
        printf 'Pending: resolve the ref once to a commit and prepare an isolated checkout; Codex Tools does not acquire GitHub refs.\n'
        plugin_source='<resolved-checkout>'
        ;;
    esac
    printf 'planned command: codex-tools install %q --codex-home %q --marketplace %q\n' "$plugin_source" '<cloud-codex-home>' 'tanaabot'
    printf 'Pending: source preparation, declared build needs, target identity checks and native skill discovery in a fresh Cloud task.\n'
    ;;
esac
