#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/mnt/Kingston/Coding/redmi-project"
WAIT_SECONDS="${DROIDMETER_WAIT_SECONDS:-120}"
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

deadline=$((SECONDS + WAIT_SECONDS))
while [ ! -f "$PROJECT_DIR/package.json" ]; do
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "DroidMeter: $PROJECT_DIR/package.json not available after ${WAIT_SECONDS}s" >&2
    exit 1
  fi

  sleep 2
done

cd "$PROJECT_DIR"

if [ -s "$NVM_DIR/nvm.sh" ]; then
  # systemd user services do not load the interactive shell profile.
  # Load NVM explicitly so DroidMeter uses the same Node as the terminal.
  . "$NVM_DIR/nvm.sh"

  if [ -f ".nvmrc" ]; then
    nvm use --silent --delete-prefix >/dev/null
  else
    nvm use --silent --delete-prefix v24.12.0 >/dev/null || nvm use --silent --delete-prefix node >/dev/null
  fi
fi

echo "DroidMeter: using node $(node --version) and npm $(npm --version)"
exec npm run droidmeter
