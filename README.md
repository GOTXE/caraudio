# W.I.P. · CarPlayer · Navidrome (UI para coche)

Cliente web “car mode” (1280×480) para Navidrome usando la API compatible **Subsonic** (`/rest/...`).

Estado: **prueba / viabilidad (proof-of-concept)**. La UI y el flujo de reproducción pueden cambiar.

## Contenido

- UI: `index.html`
- Proxy opcional (evitar CORS): `proxy.php`
- Config ejemplo del proxy: `proxy.config.sample.php` → `proxy.config.php` (no se commitea)

## Requisitos mínimos

- Un Navidrome accesible por HTTP/HTTPS (recomendado HTTPS).
- Servir `index.html` como estático (cualquier servidor: NAS, VPS, PC, etc.).
- **Solo si usas proxy**: algún backend que ejecute `proxy.php` (PHP + cURL).

## ¿Hay que configurar algo en `index.html`?

No es obligatorio.

- En la pantalla de login puedes poner el **Servidor**, usuario y contraseña.
- Si quieres, puedes cambiar el valor por defecto del servidor editando el `value="https://..."` del input `Servidor`.

## Proxy: cuándo es necesario

En un navegador, una web no puede llamar libremente a otro dominio si el servidor no permite **CORS**.

Usa **Directo** (sin proxy) si:
- Sirves el cliente en el **mismo origen** que Navidrome (misma URL base), o
- Tu Navidrome/reverse-proxy añade cabeceras CORS y permite peticiones desde tu dominio.

Usa **Proxy** si:
- Sirves el cliente en un **dominio distinto** y Navidrome no permite CORS (lo más común), o
- Quieres evitar exponer CORS en tu proxy inverso.

El proxy hace el fetch “desde el servidor” y el navegador solo habla con el mismo host que sirve la página.

### Configurar el proxy (si lo necesitas)

1. Copia `proxy.config.sample.php` → `proxy.config.php`
2. Edita `proxy.config.php`:
   - `$NAVIDROME_BASE_URL = 'https://TU-NAVIDROME';`
3. Verifica: abre `https://TU_HOST_DEL_CLIENTE/proxy.php?ping=1` y debe devolver `configured: true`.
4. En la UI, selecciona `Modo conexión = Proxy` (o `Auto`).

## Seguridad

- El proxy está **limitado** a rutas `/rest/*.view` y no acepta URLs absolutas (evita “open proxy”).
- En la UI se usa token Subsonic (salt+md5) para evitar enviar la contraseña como `p=...`.
- Si activas “Recordarme”, la contraseña queda guardada en el navegador del dispositivo (recomendado: usuario Navidrome dedicado).
