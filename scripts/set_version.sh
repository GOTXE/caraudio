#!/usr/bin/env bash
# set_version.sh
# Sincroniza la version de release en los archivos clave del proyecto.
#
# Uso:
#   ./scripts/set_version.sh v1.0.0
#   ./scripts/set_version.sh v1.0.0-rc.1
#   ./scripts/set_version.sh v1.0.0 --no-whats-new

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INDEX_FILE="$BASE_DIR/index.html"
README_FILE="$BASE_DIR/README.md"
WHATS_NEW_FILE="$BASE_DIR/assets/js/modules/whats-new.js"
VERSION_FILE="$BASE_DIR/VERSION"

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  cat <<'EOF'
set_version.sh
Sincroniza la version de release en archivos clave del proyecto.

Uso:
  ./scripts/set_version.sh <version> [--no-whats-new]

Opciones:
  -h, --help        Muestra esta ayuda.
  --no-whats-new    No crea entrada placeholder en assets/js/modules/whats-new.js.

Ejemplos:
  ./scripts/set_version.sh v1.0.0
  ./scripts/set_version.sh v1.0.0-rc.1
  ./scripts/set_version.sh v1.0.0 --no-whats-new
EOF
  exit 0
fi

if [ $# -lt 1 ]; then
  echo "Uso: $0 <version> [--no-whats-new]" >&2
  echo "Prueba: $0 --help" >&2
  exit 1
fi

NEW_VERSION="$1"
shift || true

SYNC_WHATS_NEW=1
while [ $# -gt 0 ]; do
  case "$1" in
    --no-whats-new)
      SYNC_WHATS_NEW=0
      ;;
    *)
      echo "Parametro no reconocido: $1" >&2
      exit 1
      ;;
  esac
  shift
done

# SemVer con prefijo v. Admite prerelease:
# v1.0.0
# v1.0.0-rc.1
# v1.0.0-alpha.2
if [[ ! "$NEW_VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z]+(\.[0-9A-Za-z]+)*)?$ ]]; then
  echo "Version invalida: $NEW_VERSION" >&2
  echo "Formato esperado: vMAJOR.MINOR.PATCH o vMAJOR.MINOR.PATCH-prerelease.N" >&2
  exit 1
fi

if [ ! -f "$INDEX_FILE" ] || [ ! -f "$README_FILE" ] || [ ! -f "$WHATS_NEW_FILE" ]; then
  echo "No se encontraron los archivos esperados para sincronizar version." >&2
  exit 1
fi

export NEW_VERSION
BADGE_VERSION="${NEW_VERSION//-/--}"
export BADGE_VERSION

echo "$NEW_VERSION" > "$VERSION_FILE"

# 1) index.html meta app-version
perl -0777 -i -pe \
  's{(<meta\s+name="app-version"\s+content=")[^"]+(")}{$1.$ENV{NEW_VERSION}.$2}e' \
  "$INDEX_FILE"

# 2) README badge/tag (si existe con formato esperado)
perl -0777 -i -pe \
  's{\[!\[tag\]\(https://img\.shields\.io/badge/TAG-[^)]+-00c8b6\)\]\(https://github\.com/GOTXE/caraudio/releases/tag/[^\)]+\)}{[![tag](https://img.shields.io/badge/TAG-$ENV{BADGE_VERSION}-00c8b6)](https://github.com/GOTXE/caraudio/releases/tag/$ENV{NEW_VERSION})}g' \
  "$README_FILE"

# 3) whats-new.js: si no existe la clave de version, la crea al inicio del objeto
if [ "$SYNC_WHATS_NEW" -eq 1 ]; then
  if ! grep -Fq "\"$NEW_VERSION\":" "$WHATS_NEW_FILE"; then
    tmp_file="$(mktemp)"
    awk -v ver="$NEW_VERSION" '
      /const WHATS_NEW_BY_VERSION = \{/ && !done {
        print
        printf "  \"%s\": [\n", ver
        print "    \"No hay novedades registradas para esta version.\","
        print "  ],"
        done = 1
        next
      }
      { print }
    ' "$WHATS_NEW_FILE" > "$tmp_file"
    mv "$tmp_file" "$WHATS_NEW_FILE"
    echo "Añadida entrada placeholder en whats-new para $NEW_VERSION"
  fi
fi

echo "Version sincronizada: $NEW_VERSION"
echo "Archivos:"
echo "- VERSION"
echo "- index.html"
echo "- README.md"
if [ "$SYNC_WHATS_NEW" -eq 1 ]; then
  echo "- assets/js/modules/whats-new.js"
fi
