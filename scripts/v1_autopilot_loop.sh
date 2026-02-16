#!/bin/bash
# v1_autopilot_loop.sh
# Bucle persistente de guardia V1: controla progreso y gates.

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INTERVAL="${V1_AUTOPILOT_INTERVAL:-60}"
LOG_DIR="${CARAUDIO_LOG_DIR:-$BASE_DIR/logs}"
LOG_FILE="$LOG_DIR/v1_autopilot.log"
RUN_ID="${V1_AUTOPILOT_RUN_ID:-v1-$(date '+%Y%m%d%H%M%S')-$$}"
export V1_AUTOPILOT_RUN_ID="$RUN_ID"

# Load optional project env for webhook and runtime settings.
if [ -f "$BASE_DIR/.env" ]; then
  # shellcheck disable=SC1091
  set -a && . "$BASE_DIR/.env" && set +a
fi

mkdir -p "$LOG_DIR"
cd "$BASE_DIR"

echo "[v1_autopilot] $(date '+%F %T') started (interval=${INTERVAL}s run_id=${RUN_ID})" >> "$LOG_FILE"

while true; do
  TS="$(date '+%F %T')"
  echo "[v1_autopilot] [$TS] cycle begin" >> "$LOG_FILE"

  set +e
  python3 "$BASE_DIR/scripts/v1_autopilot_guard.py" >> "$LOG_FILE" 2>&1
  RC=$?
  python3 "$BASE_DIR/scripts/v1_autopilot_notify.py" >> "$LOG_FILE" 2>&1
  NRC=$?
  set -e

  if [ "$NRC" -ne 0 ]; then
    echo "[v1_autopilot] [$TS] WARN: notify failed (rc=$NRC)" >> "$LOG_FILE"
  fi

  if [ "$RC" -eq 0 ]; then
    echo "[v1_autopilot] [$TS] COMPLETE: V1 gates and tracker are 100%" >> "$LOG_FILE"
    exit 0
  fi

  if [ "$RC" -eq 3 ]; then
    echo "[v1_autopilot] [$TS] BLOCKED task detected; waiting for unblock" >> "$LOG_FILE"
    python3 "$BASE_DIR/scripts/v1_incident_capture.py" --reason blocked --rc "$RC" >> "$LOG_FILE" 2>&1 || true
  elif [ "$RC" -eq 4 ]; then
    echo "[v1_autopilot] [$TS] Gates failed; waiting for fixes" >> "$LOG_FILE"
    python3 "$BASE_DIR/scripts/v1_incident_capture.py" --reason gates_failed --rc "$RC" >> "$LOG_FILE" 2>&1 || true
  elif [ "$RC" -ne 2 ]; then
    echo "[v1_autopilot] [$TS] ERROR: guard returned unexpected rc=$RC" >> "$LOG_FILE"
    python3 "$BASE_DIR/scripts/v1_incident_capture.py" --reason guard_error --rc "$RC" >> "$LOG_FILE" 2>&1 || true
  else
    echo "[v1_autopilot] [$TS] In progress" >> "$LOG_FILE"
  fi

  sleep "$INTERVAL"
done
