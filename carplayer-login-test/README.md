# CarPlayer · Login test (DSM WebAPI)

Objetivo: confirmar que desde una página **servida en el NAS** (mismo host) puedes hacer login contra DSM y obtener una sesión (`sid`) para luego llamar a Audio Station (`SYNO.AudioStation.*`).

## Contexto importante (por qué te daba 404)

En DSM, normalmente acabas con **dos “mundos” distintos**:

- Un subdominio tipo `apimusic.*` que hace reverse proxy a `https://127.0.0.1:5001/` (DSM). Ahí existe `/webapi/...` y `/music/...`.
- Un subdominio tipo `caraudio.*` que sirve estáticos con Web Station. Ahí NO existe `/webapi/...` (por eso el 404).

Desde el navegador, si el frontend está en `caraudio.*` no puede llamar a `apimusic.*` directamente por CORS/cookies. Solución: **proxy backend en el NAS**.

Si tu reproductor Android está configurado para abrir `https://sek.sekhem.myds.me/music/`: eso es **la web oficial de Audio Station**. Para usar una web “a medida” necesitas que el reproductor abra tu URL (por ejemplo `https://caraudio.../`). Si no puedes cambiar esa URL, entonces la alternativa es seguir usando la UI oficial.

## Despliegue recomendado (Internet + en el NAS, sin exponer 5000/5001)

1. En DSM instala/activa **Web Station**.
2. Sirve esta carpeta (`carplayer-login-test/`) como sitio en Web Station (por ejemplo bajo `https://caraudio.sekhem.myds.me/`).
3. Activa PHP para ese sitio (necesario para `proxy.php`).
4. Configura el proxy:
   - Copia `carplayer-login-test/proxy.config.sample.php` → `carplayer-login-test/proxy.config.php`
   - Ajusta `$DSM_BASE_URL` a tu DSM publicado, por ejemplo `https://apimusic.sekhem.myds.me`
5. Verificación rápida:
   - `https://caraudio.sekhem.myds.me/proxy.php?ping=1` debe devolver JSON con `configured: true`.
4. Verificación rápida (en el navegador):
   - Debe devolver JSON (no HTML 404):
     - `https://apimusic.sekhem.myds.me/webapi/entry.cgi?api=SYNO.API.Info&version=1&method=query`
6. Abre `https://caraudio.sekhem.myds.me/` y en el formulario pon:
   - `Modo conexión`: `Auto` o `Proxy`
   - `Ruta base`: normalmente `/`

## Qué poner en el formulario

- `Ruta base de DSM/Audio Station`: si tu host apunta a la raíz de DSM, usa `/`. Si estás sirviendo el app bajo carpeta, usa esa carpeta.
- `Session`: para Audio Station usa `AudioStation` (por defecto). Si quieres probar sesión genérica, prueba `webui`.

## Qué esperar

- En éxito: `success: true` y `data.sid` (y a veces `data.synotoken`).
- En fallo: `success: false` con `error.code` (si ves algo de 2FA/SSO, lo adaptamos en el siguiente paso).
