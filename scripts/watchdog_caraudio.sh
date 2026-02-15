#!/bin/bash
# watchdog_caraudio.sh
# Vigila proceso de app (static o broker) y lo relanza si cae.

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
WATCHDOG_LOG="$LOG_DIR/watchdog_caraudio.log"
RUN_PID="$LOG_DIR/caraudio.pid"
SLEEP_SECONDS="${CARAUDIO_WATCHDOG_INTERVAL:-30}"

mkdir -p "$LOG_DIR"
cd "$WORKDIR"

while true; do
  SHOULD_START=0

  if [ -f "$RUN_PID" ]; then
    PID="$(cat "$RUN_PID")"
    if ! ps -p "$PID" >/dev/null 2>&1; then
      SHOULD_START=1
    fi
  else
    SHOULD_START=1
  fi

  if [ "$SHOULD_START" -eq 1 ]; then
    echo "$(date '+%F %T') - API caída/no iniciada, relanzando" >> "$WATCHDOG_LOG"
    nohup "$WORKDIR/scripts/start_caraudio.sh" >> "$WATCHDOG_LOG" 2>&1 &
    sleep 5
  fi

  sleep "$SLEEP_SECONDS"
done
