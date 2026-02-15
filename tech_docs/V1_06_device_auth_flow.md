# Device Auth Flow

## Estados

- `pending`: código generado y esperando validación.
- `verified`: código validado en móvil.
- `completed`: credenciales aprobadas y tokens emitidos.
- `consumed`: tokens ya entregados al coche.
- `expired`: tiempo de código agotado.

## Secuencia

1. Car unit -> `POST /api/device/start`
   - recibe `user_code` + `device_code`.
2. Móvil -> `POST /api/device/verify`
   - valida `user_code`, recibe `verification_token`.
3. Móvil -> `POST /api/device/complete`
   - envía `verification_token` + credenciales Navidrome.
4. Car unit -> `POST /api/device/poll`
   - cuando está aprobado recibe `session_id`, `access_token`, `refresh_token`.
5. Renovación/revocación:
   - `POST /api/session/refresh`
   - `POST /api/session/revoke`

## Reglas

- Polling con intervalo progresivo (backoff).
- `device_code` no se muestra en UI.
- Código reutilizado o caducado debe fallar.
