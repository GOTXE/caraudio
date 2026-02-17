#!/bin/bash
# v1_gate_check.sh
# Ejecuta validaciones automáticas para gates V1.

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR"

echo "[v1_gate_check] $(date '+%F %T') Inicio"

echo "[v1_gate_check] Verificando referencias legacy de versionado"
LEGACY_CHECK_FILES=(
  "CHANGELOG.md"
  "tech_docs/14.3_checklist_commits_y_versionado.md"
  "tech_docs/V1_00_index.md"
  "tech_docs/V1_00_Prompt_Inicio.md"
)
LEGACY_FORBIDDEN_PHRASES=(
  'SemVer en `0.x`'
  'SemVer en 0.x'
  'Pre-release (0.x.x) - Desarrollo activo'
)
for phrase in "${LEGACY_FORBIDDEN_PHRASES[@]}"; do
  if rg -n -F -- "$phrase" "${LEGACY_CHECK_FILES[@]}" >/tmp/v1_gate_legacy_hits.txt 2>/dev/null; then
    echo "[v1_gate_check] ERROR: detectada frase legacy de versionado: $phrase"
    cat /tmp/v1_gate_legacy_hits.txt
    rm -f /tmp/v1_gate_legacy_hits.txt
    exit 1
  fi
done
rm -f /tmp/v1_gate_legacy_hits.txt

if [ "${V1_GATE_RELEASE_MODE:-0}" = "1" ]; then
  echo "[v1_gate_check] Verificacion modo release: CHANGELOG [Unreleased] y seccion versionada"
  APP_VERSION="$(grep -o 'meta name=\"app-version\" content=\"[^\"]*\"' index.html | head -n1 | cut -d '"' -f4)"
  if [ -z "$APP_VERSION" ]; then
    echo "[v1_gate_check] ERROR: no se pudo leer app-version desde index.html"
    exit 1
  fi
  if ! rg -n -F -- "## [$APP_VERSION]" CHANGELOG.md >/dev/null 2>&1; then
    echo "[v1_gate_check] ERROR: CHANGELOG.md no contiene seccion para la version $APP_VERSION"
    exit 1
  fi
  if ! awk '
    BEGIN { in_unreleased=0; has_content=0 }
    /^## \[Unreleased\]/ { in_unreleased=1; next }
    in_unreleased && /^## \[/ { in_unreleased=0; exit }
    in_unreleased {
      line=$0
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
      if (line != "") has_content=1
    }
    END { exit(has_content ? 1 : 0) }
  ' CHANGELOG.md; then
    echo "[v1_gate_check] ERROR: la seccion [Unreleased] debe estar vacia en modo release"
    exit 1
  fi
fi

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
  PYTEST_BIN="${CARAUDIO_PYTEST_BIN:-}"
  if [ -z "$PYTEST_BIN" ]; then
    if command -v pytest >/dev/null 2>&1; then
      PYTEST_BIN="$(command -v pytest)"
    elif [ -x "$BASE_DIR/.venv-tests/bin/pytest" ]; then
      PYTEST_BIN="$BASE_DIR/.venv-tests/bin/pytest"
    elif [ -x "$BASE_DIR/.venv/bin/pytest" ]; then
      PYTEST_BIN="$BASE_DIR/.venv/bin/pytest"
    fi
  fi
  if [ -z "$PYTEST_BIN" ]; then
    echo "[v1_gate_check] ERROR: broker detectado pero pytest no disponible (usa CARAUDIO_PYTEST_BIN o .venv-tests)"
    exit 1
  fi
  echo "[v1_gate_check] Ejecutando broker tests ($PYTEST_BIN)"
  "$PYTEST_BIN" broker
else
  echo "[v1_gate_check] broker/ no existe aún; tests broker en N/A"
fi

echo "[v1_gate_check] $(date '+%F %T') OK"
