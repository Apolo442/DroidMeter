#!/usr/bin/env bash
set -euo pipefail

PHONE_USER="u0_a160"
PHONE_HOST="192.168.15.73"
PHONE_PORT="8022"

HUB_PID=""
SERVER_PID=""

cleanup() {
  [ -n "$HUB_PID" ]    && kill "$HUB_PID"    2>/dev/null
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  wait 2>/dev/null
}
trap cleanup EXIT INT TERM

# Garante hub-health no celular sem duplicar o processo iniciado pelo Termux:Boot.
if ssh -p "$PHONE_PORT" \
       -o ConnectTimeout=3 \
       -o BatchMode=yes \
       -o StrictHostKeyChecking=no \
       "$PHONE_USER@$PHONE_HOST" \
       'pgrep -f "[h]ub-health.sh" >/dev/null' &>/dev/null
then
  echo "✓ hub-health já está rodando no celular"
elif ssh -p "$PHONE_PORT" \
         -o ConnectTimeout=3 \
         -o BatchMode=yes \
         -o StrictHostKeyChecking=no \
         "$PHONE_USER@$PHONE_HOST" \
         'chmod +x ~/hub-health.sh && bash ~/hub-health.sh' &>/dev/null &
then
  HUB_PID=$!
  echo "✓ hub-health iniciado no celular (PID $HUB_PID)"
else
  echo "⚠ celular não disponível — hub widget ficará sem dados"
fi

# Inicia servidor em background
npm run dev:server &
SERVER_PID=$!

# Inicia web em foreground (Ctrl+C aqui encerra tudo)
npm run dev:web
