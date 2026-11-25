# loaded by the CLOUD user's login and interactive BASH shells.
_tanaabot_brew="$(command -v brew 2>/dev/null || true)"
if [ -z "$_tanaabot_brew" ]; then
  for _tanaabot_brew in "$HOME/.linuxbrew/bin/brew" /home/linuxbrew/.linuxbrew/bin/brew; do
    [ ! -x "$_tanaabot_brew" ] || break
  done
fi
if [ -x "$_tanaabot_brew" ]; then
  eval "$("$_tanaabot_brew" shellenv)"
  PATH="$("$_tanaabot_brew" --prefix node@26)/bin:$("$_tanaabot_brew" --prefix libpq)/bin:$PATH"
  export PATH
fi
unset _tanaabot_brew

# keep secret values out of shell tracing. values are data, never shell source.
_tanaabot_trace=0
case $- in *x*) _tanaabot_trace=1; set +x ;; esac
_tanaabot_source="$(readlink -f -- "${BASH_SOURCE[0]}")"
_tanaabot_root="${_tanaabot_source%/dotfiles/shell/.config/tanaabot/env.sh}"
if command -v bun >/dev/null 2>&1; then
  while IFS= read -r -d '' _tanaabot_name && IFS= read -r -d '' _tanaabot_value; do
    export "$_tanaabot_name=$_tanaabot_value"
  done < <(bun --no-env-file "$_tanaabot_root/scripts/environment-task.js" --export)
fi
unset _tanaabot_source _tanaabot_root _tanaabot_name _tanaabot_value
if [ "$_tanaabot_trace" = 1 ]; then
  unset _tanaabot_trace
  set -x
else
  unset _tanaabot_trace
fi
