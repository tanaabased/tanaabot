# Loaded by the Cloud user's login and interactive Bash shells.
if [ -x /home/linuxbrew/.linuxbrew/bin/brew ]; then
  eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
  PATH="$(/home/linuxbrew/.linuxbrew/bin/brew --prefix node@26)/bin:$PATH"
  export PATH
fi
