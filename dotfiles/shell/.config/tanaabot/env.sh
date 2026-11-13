# Loaded by the Cloud user's login and interactive Bash shells.
_tanaabot_brew="$(command -v brew 2>/dev/null || true)"
if [ -z "$_tanaabot_brew" ]; then
  for _tanaabot_brew in "$HOME/.linuxbrew/bin/brew" /home/linuxbrew/.linuxbrew/bin/brew; do
    [ ! -x "$_tanaabot_brew" ] || break
  done
fi
if [ -x "$_tanaabot_brew" ]; then
  eval "$("$_tanaabot_brew" shellenv)"
  PATH="$("$_tanaabot_brew" --prefix node@26)/bin:$PATH"
  export PATH
fi
unset _tanaabot_brew
