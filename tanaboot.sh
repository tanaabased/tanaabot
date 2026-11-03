#!/usr/bin/env bash
set -euo pipefail

SCRIPT_VERSION=0.0.0-unreleased
repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

case "${1:-}" in
  -h|--help)
    [[ $# -eq 1 ]] || { printf 'error: Unexpected arguments.\n' >&2; exit 2; }
    cat <<'HELP'
Usage: tanaboot.sh [options]

Scaffold for Bootbox provisioning and Codex Cloud setup. Installation is disabled.
Run from a selected tanaabot checkout; this script does not acquire its own source.

Options:
  --dry-run     Show the setup declarations without network access or changes
  --version     Show the script version
  -h, --help    Show this help
HELP
    ;;
  --version)
    [[ $# -eq 1 ]] || { printf 'error: Unexpected arguments.\n' >&2; exit 2; }
    printf '%s\n' "$SCRIPT_VERSION"
    ;;
  --dry-run)
    [[ $# -eq 1 ]] || { printf 'error: Unexpected arguments.\n' >&2; exit 2; }
    exec bash "$repo_dir/scripts/setup-cloud.sh" plan bootstrap
    ;;
  '')
    [[ $# -eq 0 ]] || { printf 'error: Unexpected empty argument.\n' >&2; exit 2; }
    exec bash "$repo_dir/scripts/setup-cloud.sh" apply bootstrap
    ;;
  *)
    printf 'error: Unknown option. Use tanaboot.sh --help.\n' >&2
    exit 2
    ;;
esac
