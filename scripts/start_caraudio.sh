#!/bin/bash
# start_caraudio.sh
# Arranca la app sin systemd en modo static o broker.

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
WEB_DIR="${CARAUDIO_WEB_DIR:-$WORKDIR}"
VENV_DIR="${CARAUDIO_VENV_DIR:-$WORKDIR/.venv}"
PYTHON_BIN="${CARAUDIO_PYTHON_BIN:-python3}"
HOST="${CARAUDIO_HOST:-0.0.0.0}"
PORT="${CARAUDIO_PORT:-9000}"
LOG_DIR="${CARAUDIO_LOG_DIR:-$WORKDIR/logs}"
MODE="${CARAUDIO_MODE:-auto}"
RUN_PID="$LOG_DIR/caraudio.pid"
MODE_FILE="$LOG_DIR/caraudio.mode"
APP_LOG="$LOG_DIR/caraudio.log"

pick_mode() {
  if [ "$MODE" = "auto" ]; then
    if [ -f "$WORKDIR/broker/app/main.py" ]; then
      echo "broker"
    else
      echo "static"
    fi
    return
  fi
  echo "$MODE"
}

mkdir -p "$LOG_DIR"
cd "$WORKDIR"

START_MODE="$(pick_mode)"

if [ "$START_MODE" != "static" ] && [ "$START_MODE" != "broker" ]; then
  echo "$(date '+%F %T') - Modo no soportado: $START_MODE (usar static|broker|auto)" | tee -a "$APP_LOG"
  exit 1
fi

if [ -f "$RUN_PID" ] && ps -p "$(cat "$RUN_PID")" >/dev/null 2>&1; then
  echo "$(date '+%F %T') - Proceso ya está corriendo (PID $(cat "$RUN_PID"), modo $(cat "$MODE_FILE" 2>/dev/null || echo desconocido))" >> "$APP_LOG"
  exit 0
fi

if [ "$START_MODE" = "static" ]; then
  if [ ! -f "$WORKDIR/index.html" ]; then
    echo "$(date '+%F %T') - No se encontró index.html en $WORKDIR (ajusta CARAUDIO_WEB_DIR o CARAUDIO_WORKDIR)" | tee -a "$APP_LOG"
    exit 1
  fi
  nohup "$PYTHON_BIN" -m http.server "$PORT" \
    --bind "$HOST" \
    --directory "$WEB_DIR" \
    >> "$APP_LOG" 2>&1 &
  echo $! > "$RUN_PID"
  echo "$START_MODE" > "$MODE_FILE"
  echo "$(date '+%F %T') - App static iniciada (PID $(cat "$RUN_PID")) en http://$HOST:$PORT" >> "$APP_LOG"
  exit 0
fi

if [ ! -f "$WORKDIR/broker/app/main.py" ]; then
  echo "$(date '+%F %T') - Modo broker seleccionado pero no existe broker/app/main.py" | tee -a "$APP_LOG"
  exit 1
fi

export CARAUDIO_FRONTEND_DIR="$WEB_DIR"
if [ ! -d "$VENV_DIR" ]; then
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"
pip install --disable-pip-version-check --upgrade pip >> "$APP_LOG" 2>&1
RUNTIME_REQ="$WORKDIR/broker/requirements-runtime.txt"
DEV_REQ="$WORKDIR/broker/requirements.txt"
if [ -f "$RUNTIME_REQ" ]; then
  pip install --disable-pip-version-check -r "$RUNTIME_REQ" >> "$APP_LOG" 2>&1
elif [ -f "$DEV_REQ" ]; then
  pip install --disable-pip-version-check -r "$DEV_REQ" >> "$APP_LOG" 2>&1
else
  echo "$(date '+%F %T') - No hay requirements de broker en $WORKDIR/broker" | tee -a "$APP_LOG"
  exit 1
fi

nohup "$VENV_DIR/bin/uvicorn" broker.app.main:app \
  --host "$HOST" \
  --port "$PORT" \
  >> "$APP_LOG" 2>&1 &

echo $! > "$RUN_PID"
echo "$START_MODE" > "$MODE_FILE"
echo "$(date '+%F %T') - Broker API iniciada (PID $(cat "$RUN_PID")) en http://$HOST:$PORT" >> "$APP_LOG"
