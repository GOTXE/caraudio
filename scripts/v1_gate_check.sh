#!/bin/bash
# v1_gate_check.sh
# Ejecuta validaciones automáticas para gates V1.

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR"

echo "[v1_gate_check] $(date '+%F %T') Inicio"

NODE_BIN="${CARAUDIO_NODE_BIN:-}"
if [ -z "$NODE_BIN" ]; then
  if command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
  elif [ -x /usr/bin/node ]; then
    NODE_BIN="/usr/bin/node"
  else
    echo "[v1_gate_check] ERROR: node no encontrado (define CARAUDIO_NODE_BIN)"
    exit 1
  fi
fi

mapfile -t FRONTEND_TESTS < <(find frontend_tests -type f -name "*.mjs" | sort)

if [ "${#FRONTEND_TESTS[@]}" -gt 0 ]; then
  echo "[v1_gate_check] Ejecutando frontend tests ($NODE_BIN --test)"
  "$NODE_BIN" --test "${FRONTEND_TESTS[@]}"
else
  echo "[v1_gate_check] ERROR: no hay tests frontend en frontend_tests/ (recursivo)"
  exit 1
fi

if [ -d broker ]; then
  if ! command -v pytest >/dev/null 2>&1; then
    echo "[v1_gate_check] ERROR: broker detectado pero pytest no disponible"
    exit 1
  fi
  echo "[v1_gate_check] Ejecutando broker tests (pytest)"
  pytest broker
else
  echo "[v1_gate_check] broker/ no existe aún; tests broker en N/A"
fi

echo "[v1_gate_check] $(date '+%F %T') OK"
