#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Uso:
  scripts/chat_notify.sh --type TIPO --message "MENSAJE" [opciones]

Opciones:
  --type TIPO        Tipo de evento: duda|finalizado|verificacion|permiso|info
  --message TEXTO    Mensaje principal
  --title TEXTO      Titulo opcional (si no se indica, usa el tipo)
  --url URL          Webhook URL (si no, usa CHAT_WEBHOOK_URL)
  --project NOMBRE   Nombre proyecto (default: caraudio)
  --source ORIGEN    Origen (default: codex)
  --provider NOMBRE  Formato webhook: generic|synology-chat (default: generic)
  --dry-run          No envia; solo muestra payload
  -h, --help         Mostrar ayuda

Variables de entorno:
  CHAT_WEBHOOK_URL           URL webhook por defecto
  CHAT_WEBHOOK_AUTH_HEADER   Header opcional, ej: "Authorization: Bearer <token>"
  CHAT_WEBHOOK_TEXT_FIELD    Campo para texto (default: text)
  CHAT_WEBHOOK_PROVIDER      generic|synology-chat
USAGE
}

json_escape() {
  sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e ':a;N;$!ba;s/\n/\\n/g'
}

TYPE=""
TITLE=""
MESSAGE=""
URL="${CHAT_WEBHOOK_URL:-}"
PROJECT="caraudio"
SOURCE="codex"
DRY_RUN="false"
PROVIDER="${CHAT_WEBHOOK_PROVIDER:-generic}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --type)
      TYPE="${2:-}"; shift 2 ;;
    --title)
      TITLE="${2:-}"; shift 2 ;;
    --message)
      MESSAGE="${2:-}"; shift 2 ;;
    --url)
      URL="${2:-}"; shift 2 ;;
    --project)
      PROJECT="${2:-}"; shift 2 ;;
    --source)
      SOURCE="${2:-}"; shift 2 ;;
    --provider)
      PROVIDER="${2:-}"; shift 2 ;;
    --dry-run)
      DRY_RUN="true"; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Argumento no reconocido: $1" >&2
      usage
      exit 1 ;;
  esac
done

if [[ -z "$TYPE" || -z "$MESSAGE" ]]; then
  echo "Error: --type y --message son obligatorios" >&2
  usage
  exit 1
fi

if [[ -z "$TITLE" ]]; then
  TITLE="$TYPE"
fi

TEXT_FIELD="${CHAT_WEBHOOK_TEXT_FIELD:-text}"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

TITLE_E="$(printf '%s' "$TITLE" | json_escape)"
TYPE_E="$(printf '%s' "$TYPE" | json_escape)"
MESSAGE_E="$(printf '%s' "$MESSAGE" | json_escape)"
PROJECT_E="$(printf '%s' "$PROJECT" | json_escape)"
SOURCE_E="$(printf '%s' "$SOURCE" | json_escape)"
TS_E="$(printf '%s' "$TIMESTAMP" | json_escape)"

TEXT_CONTENT="[$TYPE] $TITLE - $MESSAGE"
TEXT_E="$(printf '%s' "$TEXT_CONTENT" | json_escape)"

PAYLOAD_JSON=$(cat <<JSON
{
  "$TEXT_FIELD": "$TEXT_E",
  "type": "$TYPE_E",
  "title": "$TITLE_E",
  "message": "$MESSAGE_E",
  "project": "$PROJECT_E",
  "source": "$SOURCE_E",
  "timestamp": "$TS_E"
}
JSON
)

if [[ "$DRY_RUN" == "true" ]]; then
  if [[ "$PROVIDER" == "synology-chat" ]]; then
    printf 'payload=%s\n' "$PAYLOAD_JSON"
  else
    printf '%s\n' "$PAYLOAD_JSON"
  fi
  exit 0
fi

if [[ -z "$URL" ]]; then
  echo "Error: falta webhook URL. Usa --url o CHAT_WEBHOOK_URL" >&2
  exit 1
fi

if [[ "$PROVIDER" == "synology-chat" ]]; then
  CURL_ARGS=(
    -sS
    -X POST
    -H "Content-Type: application/x-www-form-urlencoded"
    --data-urlencode "payload=$PAYLOAD_JSON"
    "$URL"
  )
else
  CURL_ARGS=(
    -sS
    -X POST
    -H "Content-Type: application/json"
    --data "$PAYLOAD_JSON"
    "$URL"
  )
fi

if [[ -n "${CHAT_WEBHOOK_AUTH_HEADER:-}" ]]; then
  CURL_ARGS=(-sS -X POST -H "${CHAT_WEBHOOK_AUTH_HEADER}" "${CURL_ARGS[@]:3}")
fi

curl "${CURL_ARGS[@]}" >/dev/null

echo "Notificacion enviada ($TYPE)"
