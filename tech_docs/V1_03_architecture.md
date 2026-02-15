# Arquitectura v1

## Componentes

- Frontend estático (`index.html`, `link.html`, `assets/js/*`, `assets/css/styles.css`)
- PWA shell (`manifest.webmanifest`, `service-worker.js`)
- Broker (`broker/app/main.py`) con SQLite (`broker/data/broker.db`)
- Navidrome como proveedor de autenticación y catálogo

## Fronteras de cambio (v1)

- Dominio `auth/login`: rediseño completo (PWA + device flow + broker).
- Dominio `player`: preserve-first; mantener contratos funcionales de `v0.1.0-alpha.6`.
- Cambios de estado global no deben romper funciones de reproducción, perfiles ni tema.

## Flujo principal

1. Car Unit abre `index.html`.
2. Puede usar login clásico o flujo "Vincular con móvil".
3. En flujo por código:
   - Car llama `POST /api/device/start`.
   - Móvil abre `link.html`, valida código (`/api/device/verify`) y completa (`/api/device/complete`).
   - Car hace polling (`/api/device/poll`) hasta recibir sesión.
4. Sesión se renueva con `POST /api/session/refresh` y se revoca con `POST /api/session/revoke`.

## Persistencia

- Frontend: `localStorage` para modo dispositivo, idioma, servidor, remember, sesión de broker y claves legacy del player/perfiles.
- Broker: SQLite para requests de device flow y sesiones (hashes de tokens/códigos).

## Criterios de diseño

- Una sola codebase para 2 plantillas base (Car + Desktop) con Tablet derivado responsive.
- Tokens visuales en CSS variables.
- Estados de componentes explícitos.
- Sin logs de credenciales o tokens.

## Referencias canónicas

- Login visual: `tech_docs/V1_99_pencil_webs.pen` (`Login Car Unit 1280x480`, `Login Desktop 1920x1080`).
- Paridad funcional del player: `tech_docs/V1_11_functional_parity.md`.
