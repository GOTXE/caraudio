# Roadmap WEB_updt_MUSIC v1.0.0

Estado: en progreso  
Rama de trabajo: `develop_device_auth_pwa_v1`  
Base: `main`  
Objetivo: refactor completo a PWA multidispositivo usando 2 plantillas base (Car + Desktop) + Device Authorization Flow + i18n + hardening.

## Paso inicial obligatorio (MASTER PROMPT)

- [x] Rama creada: `develop_device_auth_pwa_v1`
- [x] Roadmap Fase 0 → 5 creado
- [x] Inventario técnico del estado previo realizado
- [x] Propuesta de limpieza inicial definida

### Inventario del repo previo (v0.1.0-alpha.6)

Estructura base:
- `index.html` (SPA principal)
- `debug.html` (consola debug)
- `assets/css/styles.css`
- `assets/js/app.js`
- `assets/js/modules/{constants,storage,ui,navidrome,player,whats-new}.js`

Storage keys detectadas:
- `carplayer.navidrome.server`
- `carplayer.navidrome.user`
- `carplayer.navidrome.pass`
- `carplayer.navidrome.theme`
- `carplayer.navidrome.quality`
- `carplayer.navidrome.listPaneSide`
- `carplayer.navidrome.rememberCreds`
- `carplayer.navidrome.whatsNewSeen`

Flujo de login actual:
1. Usuario/contraseña + server guardado.
2. `ping` Subsonic con `makeAuth`.
3. Si OK: guarda server/credenciales (según remember), cambia a player.
4. Logout limpia estado UI pero no cubre revoke backend (no existe broker).

### Propuesta de limpieza inicial

- Mantener base funcional del player actual y refactorizar incrementalmente.
- Eliminar texto fijo “Esperando…” y usar estado vacío por defecto.
- Sustituir strings hardcodeadas por i18n ES/EN.
- Reemplazar login por dos flujos: clásico + “Vincular con móvil”.
- Introducir `broker/` FastAPI para device flow y sesiones revocables.

## Fases (orden estricto)

## Fase 0 — Arquitectura Visual (bloqueante)
- [x] Tokens de diseño (colores, spacing, tipografía)
- [x] 2 plantillas base: Car Unit + Desktop (Tablet derivado de Desktop)
- [x] Login refactor (compacto coche, sin “Esperando…”)
- [ ] Plantillas Player en Pencil (`Player Car Unit 1280x480` + `Player Desktop 1920x1080`)
- [x] Estados visuales: default/hover/active/focus/disabled/error
- [ ] Validación contraste AA + expansión texto 30% (pendiente validación manual final)

## Fase 0.5 — Paridad funcional del player (bloqueante)
- [ ] Checklist de paridad creado (`tech_docs/V1_11_functional_parity.md`)
- [ ] Tema día/noche/auto validado
- [ ] Perfiles/cambio de usuario/autoconexión validados
- [ ] Favoritas, más reproducidas y scrobble validados
- [ ] Disposición player + panel listas validada (car/desktop)
- [ ] Modales del player validados (álbumes/canciones/ajustes/novedades)

## Fase 1 — Modo dispositivo y UX base (login/auth)
- [x] `deviceMode` persistente (`auto|car|desktop`) con tablet derivado de desktop
- [x] Heurística coche (altura <= 520 y aspect > 2.2)
- [x] Modal sugerencia 1ª vez + “no volver a preguntar”
- [x] Modo teclado (ocultar secundarios)
- [x] Modal “Recordar” tras login OK si remember desmarcado
- [x] Logout + olvidar dispositivo (limpieza local + revoke backend)

## Fase 2 — i18n ES/EN
- [x] Módulo i18n con fallback
- [x] Sustitución total de strings visibles
- [x] Autodetección idioma + selector persistente
- [x] Tests de claves faltantes/fallback

## Fase 3 — PWA
- [x] `manifest.webmanifest`
- [x] `service-worker.js` cache-first shell
- [ ] Verificación offline básica (pendiente prueba manual)
- [x] Documentación de instalación car unit

## Fase 4 — Broker FastAPI (Device Flow)
- [x] `POST /api/device/start`
- [x] `POST /api/device/poll`
- [x] `POST /api/device/verify`
- [x] `POST /api/device/complete`
- [x] `POST /api/session/refresh`
- [x] `POST /api/session/revoke`
- [x] TTL 5 min + one-time + hash user_code
- [x] Refresh rotativo + revocable + hash almacenado
- [x] Rate limiting verify/start/poll + CORS restringido
- [x] Tests pytest obligatorios (5/5 passing en `broker/tests`)

## Fase 5 — Integración total
- [x] UI “Vincular con móvil” (código grande + expiración + estado)
- [x] Polling con backoff y límites
- [x] Guardado de sesión de dispositivo
- [x] Cerrar sesión + olvidar dispositivo
- [ ] Chaos tests documentados (`tech_docs/security_test_report.md`)
