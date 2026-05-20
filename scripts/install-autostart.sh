#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/mnt/Kingston/Coding/redmi-project"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
UNIT_FILE="$UNIT_DIR/droidmeter.service"
WRAPPER="$PROJECT_DIR/scripts/droidmeter-autostart.sh"
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

if ! command -v systemctl >/dev/null 2>&1; then
  echo "systemctl não encontrado; não dá para instalar autostart via systemd." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1 && [ -s "$NVM_DIR/nvm.sh" ]; then
  # Interactive shell config is not guaranteed to be loaded when this script runs.
  . "$NVM_DIR/nvm.sh"
  nvm use --silent --delete-prefix v24.12.0 >/dev/null 2>&1 || nvm use --silent --delete-prefix node >/dev/null 2>&1 || true
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm não encontrado. Instale Node antes, por exemplo: nvm install v24.12.0" >&2
  exit 1
fi

if [ ! -f "$PROJECT_DIR/package.json" ]; then
  echo "Projeto não encontrado em $PROJECT_DIR." >&2
  exit 1
fi

chmod +x "$PROJECT_DIR/scripts/droidmeter.sh" "$WRAPPER"
mkdir -p "$UNIT_DIR"

cat > "$UNIT_FILE" <<UNIT
[Unit]
Description=DroidMeter dashboard dev server
Documentation=file://$PROJECT_DIR/README.md
After=default.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR
ExecStart=$WRAPPER
Restart=always
RestartSec=10
KillSignal=SIGINT
TimeoutStopSec=20

[Install]
WantedBy=default.target
UNIT

systemctl --user daemon-reload
systemctl --user enable droidmeter.service
systemctl --user restart droidmeter.service

if command -v loginctl >/dev/null 2>&1; then
  loginctl enable-linger "$USER" >/dev/null 2>&1 || true
fi

echo "Autostart instalado e serviço iniciado: $UNIT_FILE"
echo
systemctl --user --no-pager --full status droidmeter.service || true
