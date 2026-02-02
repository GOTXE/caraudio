# CarPlayer · Navidrome (UI para coche)

Cliente web “car mode” (1280×480) para Navidrome usando su API compatible **Subsonic** (`/rest/...`).

## URL del servidor

- Tu Navidrome: `https://navimusic.dimoti.myds.me`
- La API Subsonic suele estar en: `https://navimusic.dimoti.myds.me/rest/...`

## Despliegue (2 opciones)

### Opción A (simple): servir el cliente en el MISMO host que Navidrome

Si puedes publicar estos estáticos dentro del mismo host `navimusic.dimoti.myds.me`, no necesitas proxy (sin CORS).

### Opción B (recomendado en Synology): cliente en `caraudio.*` + proxy PHP

Si el cliente vive en otro subdominio (ej. `https://caraudio...`) entonces el navegador bloqueará llamadas a `navimusic...` por CORS.

Solución: usar `proxy.php` (hace el fetch desde el NAS).

1. Asegura PHP activo en Web Station para este sitio.
2. Copia `proxy.config.sample.php` → `proxy.config.php`
3. Edita `proxy.config.php` y pon:
   - `$NAVIDROME_BASE_URL = 'https://navimusic.dimoti.myds.me';`
4. En la UI pon `Modo conexión = Proxy` (o `Auto`).

Verificación:
- `https://TU_HOST_DEL_CLIENTE/proxy.php?ping=1` debe devolver JSON con `configured: true`.

## Seguridad

- El proxy está **limitado** a rutas `/rest/*.view` y no acepta URLs absolutas (evita “open proxy”).
- En la UI, si usas usuario/contraseña, se genera token Subsonic (salt+md5) en el navegador para no enviar password como “p=...”.

