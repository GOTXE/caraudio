#!/bin/bash
# stop_caraudio.sh
# Detiene API y watchdog si están corriendo.

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE_DEFAULT="$BASE_DIR/.env"
ENV_FILE="${CARAUDIO_ENV_FILE:-$ENV_FILE_DEFAULT}"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

WORKDIR="${CARAUDIO_WORKDIR:-$BASE_DIR}"
LOG_DIR="${CARAUDIO_LOG_DIR:-$WORKDIR/logs}"
APP_LOG="$LOG_DIR/caraudio_api.log"
RUN_PID="$LOG_DIR/caraudio_api.pid"

mkdir -p "$LOG_DIR"
cd "$WORKDIR"

{
  echo "[stop_caraudio.sh] --- $(date '+%F %T') ---"

  if [ -f "$RUN_PID" ]; then
    API_PID="$(cat "$RUN_PID")"
    if ps -p "$API_PID" >/dev/null 2>&1; then
      echo "Deteniendo API PID $API_PID"
      kill "$API_PID" || true
      sleep 2
      if ps -p "$API_PID" >/dev/null 2>&1; then
        echo "Forzando API PID $API_PID"
        kill -9 "$API_PID" || true
      fi
    else
      echo "PID registrado no está activo: $API_PID"
    fi
    rm -f "$RUN_PID"
  else
    echo "No existe PID file de API"
  fi

  WATCHDOG_PIDS=$(ps aux | grep '[w]atchdog_caraudio.sh' | awk '{print $2}')
  if [ -n "$WATCHDOG_PIDS" ]; then
    echo "Deteniendo watchdog(s): $WATCHDOG_PIDS"
    kill $WATCHDOG_PIDS || true
  else
    echo "No hay watchdog activo"
  fi

  echo "Parada completada"
} >> "$APP_LOG" 2>&1
