#!/bin/bash
# stop_caraudio.sh
# Detiene app (static o broker) y watchdog si están corriendo.

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

resolve_path() {
  local value="${1:-}"
  local base="${2:-}"
  if [ -z "$value" ]; then
    echo ""
    return
  fi
  case "$value" in
    /*) echo "$value" ;;
    *) echo "$base/$value" ;;
  esac
}

WORKDIR_INPUT="$(resolve_path "${CARAUDIO_WORKDIR:-}" "$BASE_DIR")"
if [ -z "$WORKDIR_INPUT" ]; then
  WORKDIR="$BASE_DIR"
elif [ -d "$WORKDIR_INPUT" ]; then
  WORKDIR="$WORKDIR_INPUT"
else
  echo "[stop_caraudio.sh] WARN: CARAUDIO_WORKDIR no existe: $WORKDIR_INPUT. Usando BASE_DIR=$BASE_DIR" >&2
  WORKDIR="$BASE_DIR"
fi

LOG_DIR_INPUT="$(resolve_path "${CARAUDIO_LOG_DIR:-}" "$WORKDIR")"
LOG_DIR="${LOG_DIR_INPUT:-$WORKDIR/logs}"
APP_LOG="$LOG_DIR/caraudio.log"
RUN_PID="$LOG_DIR/caraudio.pid"
MODE_FILE="$LOG_DIR/caraudio.mode"

if ! mkdir -p "$LOG_DIR"; then
  LOG_DIR="$WORKDIR/logs"
  APP_LOG="$LOG_DIR/caraudio.log"
  RUN_PID="$LOG_DIR/caraudio.pid"
  MODE_FILE="$LOG_DIR/caraudio.mode"
  mkdir -p "$LOG_DIR"
fi
cd "$WORKDIR"

{
  echo "[stop_caraudio.sh] --- $(date '+%F %T') ---"

  if [ -f "$RUN_PID" ]; then
    APP_PID="$(cat "$RUN_PID")"
    APP_MODE="$(cat "$MODE_FILE" 2>/dev/null || echo desconocido)"
    if ps -p "$APP_PID" >/dev/null 2>&1; then
      echo "Deteniendo app PID $APP_PID (modo $APP_MODE)"
      kill "$APP_PID" || true
      sleep 2
      if ps -p "$APP_PID" >/dev/null 2>&1; then
        echo "Forzando app PID $APP_PID"
        kill -9 "$APP_PID" || true
      fi
    else
      echo "PID registrado no está activo: $APP_PID"
    fi
    rm -f "$RUN_PID"
    rm -f "$MODE_FILE"
  else
    echo "No existe PID file de app"
  fi

  WATCHDOG_PIDS=$(ps aux | awk '/[w]atchdog_caraudio.sh/{print $2}' || true)
  if [ -n "$WATCHDOG_PIDS" ]; then
    echo "Deteniendo watchdog(s): $WATCHDOG_PIDS"
    kill $WATCHDOG_PIDS || true
  else
    echo "No hay watchdog activo"
  fi

  echo "Parada completada"
} >> "$APP_LOG" 2>&1
