# Security Notes v1

## Device Authorization Flow

- `user_code` formato `XXXX-XXXX` con alfabeto sin ambiguos.
- TTL fijo de 5 minutos.
- Código de usuario almacenado como hash (`sha256(secret:value)`).
- Uso one-time: tras completar, el código queda marcado como usado.

## Tokens

- Access token corto (15 minutos).
- Refresh token largo (30 días), rotación obligatoria en cada refresh.
- Refresh token almacenado como hash en SQLite.
- Revocación por sesión (`/api/session/revoke`).

## Rate limiting

- Límites en `start`, `verify`, `poll`, `refresh`, `revoke`.
- Respuesta genérica `rate_limited` sin detalles internos.

## CORS y logs

- CORS restringido a orígenes configurados por `CARAUDIO_ALLOWED_ORIGINS`.
- No se registran passwords ni tokens en logs.
- Errores devuelven mensajes genéricos (`invalid_code`, `invalid_session`, etc.).
