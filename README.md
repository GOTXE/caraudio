# W.I.P. · CarPlayer · Navidrome (UI para coche)

Cliente web “car mode” (1280×480) para Navidrome usando la API compatible **Subsonic** (`/rest/...`).

Estado: **prueba / viabilidad (proof-of-concept)**. La UI y el flujo de reproducción pueden cambiar.

## Contenido

- UI: `index.html`

## Requisitos mínimos

- Un Navidrome accesible por HTTP/HTTPS (recomendado HTTPS).
- Servir `index.html` como estático (cualquier servidor: NAS, VPS, PC, etc.).

## ¿Hay que configurar algo en `index.html`?

No es obligatorio.

- En la pantalla de login puedes poner el **Servidor**, usuario y contraseña.
- Si quieres, puedes cambiar el valor por defecto del servidor editando el `value="https://..."` del input `Servidor`.

## Seguridad

- En la UI se usa token Subsonic (salt+md5) para evitar enviar la contraseña como `p=...`.
- Si activas “Recordarme”, la contraseña queda guardada en el navegador del dispositivo (recomendado: usuario Navidrome dedicado).
