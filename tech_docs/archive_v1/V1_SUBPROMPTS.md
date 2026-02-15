# CLAUDE_SUBPROMPTS.md
Sub-prompts por Fase — WEB_updt_MUSIC v1

---

## FASE 0 — Arquitectura Visual (Bloqueante)

- Implementar design tokens como CSS variables.
- Refactor CSS eliminando colores y tamaños hardcodeados.
- Implementar Layout Profiles: Compact / Regular / Wide.
- Refactor Login base:
  - Usuario + contraseña en misma fila en Compact.
  - Header compacto.
  - Eliminar texto fijo “Esperando…”.
- Implementar estados visuales de componentes.
- Validar contraste AA.
- Actualizar tech_docs/V1_05_design_system.md.

Commit:
feat(ui): design tokens + layout profiles (phase 0)

---

## FASE 1 — Modo Dispositivo y UX Base

- Implementar deviceMode persistente.
- Heurística posible coche (altura <= 520 y aspect > 2.2).
- Modal sugerencia primera vez.
- Modo teclado ocultando elementos secundarios.
- Modal “Recordar” tras login OK sin remember marcado.
- Implementar logout y limpiar storage.

Commit:
feat(ui): device mode + car ux (phase 1)

---

## FASE 2 — i18n

- Crear módulo i18n ES/EN.
- Sustituir todas las strings hardcodeadas.
- Autodetección idioma.
- Selector persistente.
- Tests fallback claves faltantes.

Commit:
feat(i18n): es/en support (phase 2)

---

## FASE 3 — PWA

- Añadir manifest.webmanifest.
- Implementar service worker cache-first.
- Documentar instalación en car unit.
- Verificar arranque offline básico.

Commit:
feat(pwa): manifest + service worker (phase 3)

---

## FASE 4 — FastAPI Broker

Crear broker/ con:

Endpoints:
- POST /api/device/start
- POST /api/device/poll
- POST /api/device/verify
- POST /api/device/complete
- POST /api/session/refresh
- POST /api/session/revoke

Requisitos:
- user_code XXXX-XXXX sin ambiguos
- TTL 5 minutos
- One-time
- Hash almacenado
- Refresh token rotativo y revocable
- Rate limiting verify y polling
- CORS restringido

Tests pytest obligatorios.

Commit:
feat(broker): device auth flow (phase 4)

---

## FASE 5 — Integración Total

Frontend:
- UI Vincular con móvil.
- Código grande + contador expiración.
- Polling con backoff.
- Guardar sesión.
- Cerrar sesión y olvidar dispositivo (revocar).

Añadir chaos tests documentados.

Commit:
feat(auth): integrate device flow (phase 5)

---

FIN
