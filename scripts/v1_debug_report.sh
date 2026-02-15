#!/bin/bash
# v1_debug_report.sh
# Reporte rápido para diagnosticar fallos del autopilot V1.

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${CARAUDIO_LOG_DIR:-$BASE_DIR/logs}"
STATUS_FILE="$LOG_DIR/v1_autopilot_status.json"
NOTIFY_FILE="$LOG_DIR/v1_autopilot_notify_state.json"
INC_SIG_FILE="$LOG_DIR/v1_last_incident_signature.json"
INC_DIR="$LOG_DIR/incidents"

echo "=== V1 DEBUG REPORT ==="
echo "ts: $(date '+%F %T')"
echo "repo: $BASE_DIR"
echo

echo "--- service ---"
systemctl --user status v1-autopilot-guard.service --no-pager 2>/dev/null | sed -n '1,14p' || true
echo

echo "--- status json ---"
if [ -f "$STATUS_FILE" ]; then
  cat "$STATUS_FILE"
else
  echo "missing: $STATUS_FILE"
fi
echo

echo "--- notify state ---"
if [ -f "$NOTIFY_FILE" ]; then
  cat "$NOTIFY_FILE"
else
  echo "missing: $NOTIFY_FILE"
fi
echo

echo "--- last incident pointer ---"
if [ -f "$INC_SIG_FILE" ]; then
  cat "$INC_SIG_FILE"
else
  echo "no incidents pointer yet"
fi
echo

echo "--- latest incident file ---"
LATEST_INC="$(ls -1t "$INC_DIR"/*.json 2>/dev/null | head -n 1 || true)"
if [ -n "${LATEST_INC:-}" ]; then
  echo "file: $LATEST_INC"
  cat "$LATEST_INC"
else
  echo "no incident snapshots yet"
fi
echo

echo "--- autopilot log tail (last 120) ---"
tail -n 120 "$LOG_DIR/v1_autopilot.log" 2>/dev/null || true
echo

echo "--- git status short ---"
git -C "$BASE_DIR" status --short || true

