#!/bin/bash
# start_caraudio.sh
# Crea/actualiza venv, instala deps y arranca FastAPI en segundo plano.

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
WEB_DIR="${CARAUDIO_WEB_DIR:-$WORKDIR/web}"
VENV_DIR="${CARAUDIO_VENV_DIR:-$WORKDIR/.venv}"
PYTHON_BIN="${CARAUDIO_PYTHON_BIN:-python3}"
HOST="${CARAUDIO_HOST:-0.0.0.0}"
PORT="${CARAUDIO_PORT:-9000}"
LOG_DIR="${CARAUDIO_LOG_DIR:-$WORKDIR/logs}"
APP_LOG="$LOG_DIR/caraudio_api.log"
RUN_PID="$LOG_DIR/caraudio_api.pid"

mkdir -p "$LOG_DIR"
cd "$WORKDIR"
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
else
  pip install --disable-pip-version-check -r "$DEV_REQ" >> "$APP_LOG" 2>&1
fi

if [ -f "$RUN_PID" ] && ps -p "$(cat "$RUN_PID")" >/dev/null 2>&1; then
  echo "$(date '+%F %T') - API ya está corriendo (PID $(cat "$RUN_PID"))" >> "$APP_LOG"
  exit 0
fi

nohup "$VENV_DIR/bin/uvicorn" broker.app.main:app \
  --host "$HOST" \
  --port "$PORT" \
  >> "$APP_LOG" 2>&1 &

echo $! > "$RUN_PID"
echo "$(date '+%F %T') - API iniciada (PID $(cat "$RUN_PID"))" >> "$APP_LOG"
