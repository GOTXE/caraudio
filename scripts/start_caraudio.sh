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
  echo "[start_caraudio.sh] WARN: CARAUDIO_WORKDIR no existe: $WORKDIR_INPUT. Usando BASE_DIR=$BASE_DIR" >&2
  WORKDIR="$BASE_DIR"
fi

WEB_DIR_INPUT="$(resolve_path "${CARAUDIO_WEB_DIR:-}" "$WORKDIR")"
if [ -z "$WEB_DIR_INPUT" ]; then
  WEB_DIR="$WORKDIR"
elif [ -d "$WEB_DIR_INPUT" ]; then
  WEB_DIR="$WEB_DIR_INPUT"
else
  echo "[start_caraudio.sh] WARN: CARAUDIO_WEB_DIR no existe: $WEB_DIR_INPUT. Usando WORKDIR=$WORKDIR" >&2
  WEB_DIR="$WORKDIR"
fi

VENV_DIR_INPUT="$(resolve_path "${CARAUDIO_VENV_DIR:-}" "$WORKDIR")"
VENV_DIR="${VENV_DIR_INPUT:-$WORKDIR/.venv}"
PYTHON_BIN="${CARAUDIO_PYTHON_BIN:-python3}"
HOST="${CARAUDIO_HOST:-0.0.0.0}"
PORT="${CARAUDIO_PORT:-9000}"
LOG_DIR_INPUT="$(resolve_path "${CARAUDIO_LOG_DIR:-}" "$WORKDIR")"
LOG_DIR="${LOG_DIR_INPUT:-$WORKDIR/logs}"
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

if ! mkdir -p "$LOG_DIR"; then
  FALLBACK_LOG_DIR="$WORKDIR/logs"
  echo "[start_caraudio.sh] WARN: No se pudo crear LOG_DIR=$LOG_DIR. Usando $FALLBACK_LOG_DIR" >&2
  LOG_DIR="$FALLBACK_LOG_DIR"
  RUN_PID="$LOG_DIR/caraudio.pid"
  MODE_FILE="$LOG_DIR/caraudio.mode"
  APP_LOG="$LOG_DIR/caraudio.log"
  mkdir -p "$LOG_DIR"
fi
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
