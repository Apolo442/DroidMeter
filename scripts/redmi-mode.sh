#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PHONE_USER="${PHONE_USER:-u0_a160}"
PHONE_HOST="${PHONE_HOST:-192.168.15.73}"
PHONE_PORT="${PHONE_PORT:-8022}"
PHONE_NORMAL_FLAG="$PROJECT_DIR/.droidmeter-phone-normal"

usage() {
  cat <<'USAGE'
Uso:
  npm run phone:normal      # desabilita boot/kiosk/travas e restaura uso normal
  npm run phone:droidmeter  # reinstala boot/kiosk/travas do DroidMeter

Tambem aceita:
  bash scripts/redmi-mode.sh normal
  bash scripts/redmi-mode.sh droidmeter
USAGE
}

case "$MODE" in
  normal)
    LOCAL_SCRIPT="$PROJECT_DIR/scripts/phone-normal-mode.sh"
    REMOTE_SCRIPT="~/phone-normal-mode.sh"
    ;;
  droidmeter)
    LOCAL_SCRIPT="$PROJECT_DIR/scripts/phone-droidmeter-mode.sh"
    REMOTE_SCRIPT="~/phone-droidmeter-mode.sh"
    ;;
  *)
    usage
    exit 2
    ;;
esac

if [ "$MODE" = "normal" ]; then
  touch "$PHONE_NORMAL_FLAG"
fi

ssh_args=(
  -p "$PHONE_PORT"
  -o ConnectTimeout=5
  -o BatchMode=yes
  -o StrictHostKeyChecking=no
)

scp -P "$PHONE_PORT" -o StrictHostKeyChecking=no "$LOCAL_SCRIPT" "$PHONE_USER@$PHONE_HOST:~/" >/dev/null

if [ "$MODE" = "droidmeter" ]; then
  scp -P "$PHONE_PORT" -o StrictHostKeyChecking=no \
    "$PROJECT_DIR/stuff/hub-health.sh" \
    "$PROJECT_DIR/stuff/screen-watch.sh" \
    "$PROJECT_DIR/stuff/start-hub.sh" \
    "$PHONE_USER@$PHONE_HOST:~/" >/dev/null
fi

ssh "${ssh_args[@]}" "$PHONE_USER@$PHONE_HOST" "chmod +x $REMOTE_SCRIPT && bash $REMOTE_SCRIPT"

if [ "$MODE" = "droidmeter" ]; then
  rm -f "$PHONE_NORMAL_FLAG"
fi
