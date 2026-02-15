# Mensajes externos (modo minimo)

Este directorio queda en modo minimo: solo envio de mensajes a Synology Chat.

## Script activo

- `synology_incoming_send.py`

## Uso

```bash
python3 tech_docs/mensajes/synology_incoming_send.py \
  --url 'https://TU_DOMINIO/chat/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...' \
  --prepend-datetime \
  --text 'Mensaje de prueba'
```

Control de rate limit (activo por defecto):

- `--min-interval 1.2` evita enviar mensajes demasiado seguidos.
- Reintento automático si Synology responde `code 411` (`create post too fast`).
- Puedes ajustar con `--max-retries` y `--retry-delay`.

Formato mejorado (multilinea):

```bash
python3 tech_docs/mensajes/synology_incoming_send.py \
  --url 'https://TU_DOMINIO/chat/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...' \
  --prepend-datetime \
  --pretty \
  --title 'Refactor login' \
  --text 'He detectado un bloqueo en la validacion de sesion.' \
  --detail 'Tras recargar, el token local no coincide con el estado de usuario activo.' \
  --action 'Cuando puedas, entra al PC para revisar el diff y decidir criterio final.'
```

Con archivo remoto opcional:

```bash
python3 tech_docs/mensajes/synology_incoming_send.py \
  --url 'https://TU_DOMINIO/chat/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...' \
  --prepend-datetime \
  --text 'Adjunto de prueba' \
  --file-url 'https://example.com/imagen.png'
```

## Nota

El flujo de respuestas automáticas y polling se ha retirado por decisión funcional.

## Formato oficial de mensajes

Se usará siempre el formato `pretty` con prefijo de fecha-hora.

Estructura:

```text
[YYYY-MM-DD HH:MM:SS] Titulo

Resumen:
Texto breve de estado o duda

Detalle:
Contexto tecnico concreto

Accion requerida:
Que debe hacer Gotxe (venir al PC, validar decision, etc.)
```

Reglas:

- Usar `--prepend-datetime`.
- Usar `--pretty`.
- No usar prefijos tipo `Iask`.
- Redactar en espanol claro y directo.

## Reutilizar en cada sesion

Usa este bloque al inicio de una sesion nueva:

```text
Modo mensajes externos:
- Solo envio unidireccional a Synology Chat.
- Script oficial: /data/projects/caraudio/tech_docs/mensajes/synology_incoming_send.py
- Cuando necesites avisarme fuera del PC, envia mensaje al webhook incoming.
- Formato obligatorio: `--prepend-datetime` + `--pretty` (bloques Resumen/Detalle/Accion requerida).
- No usar polling ni lectura de respuestas.
```

Comando base de envio:

```bash
python3 /data/projects/caraudio/tech_docs/mensajes/synology_incoming_send.py \
  --url 'https://srv.dimoti.myds.me/chat/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=TU_TOKEN' \
  --prepend-datetime \
  --text 'TU_MENSAJE'
```
