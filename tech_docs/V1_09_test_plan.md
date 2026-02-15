# Test Plan v1

## Frontend (automático)

Comando:
- `npm run test:frontend`

Cobertura mínima:
- Persistencia `deviceMode` y flags remember.
- i18n detección/fallback.
- Normalización de URL servidor.
- No regresión de estado del player tras cambios de login/auth.

## Broker (automático)

Comando esperado:
- `pytest` desde `broker/`

Casos clave:
- Código one-time.
- Código expirado.
- Rate limiting en verify/poll.
- Rotación de refresh token.
- Revocación efectiva.

## Manual / Chaos

1. Cortar red durante polling y verificar recuperación.
2. Introducir códigos erróneos repetidos y validar bloqueo temporal.
3. Simular expiración de código y confirmar rechazo.
4. Revocar sesión y verificar que refresh falla.
5. Revisar `localStorage` tras logout/forget.
6. En `Car Unit`, abrir modal de vinculación y validar que no aparece teclado Android.
7. En `Car Unit`, validar que `Copiar URL` no se renderiza.
8. En `Desktop/Tablet`, validar que `Copiar URL` (si habilitado) funciona y copia URL correcta.
9. Cerrar modal en `pending` y verificar cancelación de polling/countdown.
10. Reabrir modal tras `expired` y verificar que genera nuevo `device_code`/`user_code`.

## Paridad funcional (manual obligatoria, baseline `v0.1.0-alpha.6`)

1. Tema: validar `día`, `noche` y `auto` (incluye zona horaria y horarios).
2. Perfiles: cambio de usuario, usuario activo y autoconexión cuando aplica.
3. Catálogo: artistas, géneros, álbumes y listas con filtros.
4. Reproducción: play/pause, prev/next, seek, cola, shuffle/aleatorio.
5. Música: favoritas (star/unstar), más reproducidas, scrobble.
6. UI player: disposición panel listas + panel reproducción en car y desktop.
7. Modales player: álbumes, canciones, ajustes, novedades.
8. Portadas/fallback: carga normal + fallback `music-player.svg`.
