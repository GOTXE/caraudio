# WEB_updt_MUSIC → PWA multidispositivo + “Device Authorization Flow” (car unit) + i18n
**Objetivo**: que el agente ia implemente de inicio a fin (frontend + microservicio) el login “sin teclado” para car unit, manteniendo UI bonita en tablet/desktop, añadiendo i18n (ES/EN), y reforzando seguridad + tests.

> Repo analizado (zip): `WEB_updt_MUSIC`  
> Estructura actual: `index.html`, `debug.html`, `assets/css/styles.css`, `assets/js/app.js`, `assets/js/modules/*`

---

## 0) Auditoría del estado actual (lo que YA existe)

### Implementado ✅
- **Login clásico** por usuario/contraseña contra Navidrome:
  - `connectWithCredentials({server, username, password})` hace `restJson(server, auth, "ping")` y si OK:
    - guarda `server`
    - guarda `rememberCreds`
    - guarda credenciales y **perfil** con `{id, server, user, pass, updatedAt}`
    - establece `activeProfileId`
    - cambia a pantalla `player`
- **Perfiles (familia)** en `localStorage`:
  - `getProfiles`, `saveProfile`, `removeProfile`, `getActiveProfileId`, `setActiveProfileId`
  - El perfil incluye password en claro (conveniencia; riesgo asumido)
- **Preferencias**: tema y modo auto, side list, etc.
- **Update check** y “Novedades” (`whats-new.js`)
- **Debug bus** (`debug-bus.js`) con eventos `app.event` / `app.error`
- **Detección de teclado / viewport** (por variables CSS `--app-height` y flag `--keyboard-open`) ya está contemplada en CSS/JS (hay base para “modo teclado”).

### No implementado ❌ (según requerimiento)
- **Selector de modo dispositivo** (Auto / Coche / Tablet / Escritorio) + persistencia.
- **Sugerencia 1ª vez**: “Hemos detectado modo coche, ¿activar?” y no volver a molestar.
- **Reordenación del login para car unit**:
  - mover versión + indicador + “Novedades” debajo del subtítulo (bloque izq)
  - eliminar texto “Esperando…”
  - usuario + contraseña en 1 fila (2 columnas)
- **Login tipo YouTube/TV** (Device Authorization Flow) para evitar teclado en car unit.
- **Recordar**: si no está marcado “Recordar”, modal de aviso antes de finalizar login (con opción de marcarlo en el propio modal).
- **Logout / Olvidar conexión** (pensando en venta del coche) que borre tokens/sesión y perfil si el usuario lo pide.
- **i18n**: ES/EN con selector y autodetección inicial.
- **PWA**: manifest + service worker (caché estática + “offline shell” básico).

### Candidato a eliminar / simplificar 🧹
- Texto fijo **“Esperando…”**: reemplazar por estado vacío (mostrar solo en eventos reales: conectando/error/ok).
- Cualquier lógica duplicada de “preferencias legacy” que ya no se use (mantener migración si no molesta, pero no ampliar deuda).
- Avatar (no existe; no implementar).

---

## 1) Estrategia final (la que debes implementar)

### 1.1 Frontend (misma app para todo)
- Mantener **una sola codebase** y aplicar:
  1) **Auto-detección** de “posible coche” por heurísticas (alto bajo + aspecto apaisado + señales táctiles si existen).
  2) **Override manual** persistente: `Auto | Coche | Tablet | Escritorio`
  3) **Modo teclado**: cuando teclado está abierto, esconder elementos no críticos y garantizar que inputs + botón Conectar quedan visibles.

> NO dividir en dos proyectos separados (`carunit` vs `resto`).  
> Si hace falta, usar “presets”/flags dentro del mismo build.

### 1.2 Microservicio (FastAPI) — Device Authorization Flow
- En mismo dominio público (mismo host detrás del reverse proxy). pero carpetas distintas:
  - Frontend: `/volume1/web/caraudio/` (servido como está ahora, con index.html + assets)
  - Broker: `/volume1/Apps/caraudio_api/` (nuevo servicio FastAPI)
- Flujo:
  - Car unit:
    1) Introduce URL servidor (solo una vez)
    2) “Vincular con móvil” → obtiene `user_code` (ej: `34TL-89PD`) válido 5 min
    3) hace **polling** hasta recibir sesión/token
  - Móvil:
    1) entra en `/link`
    2) introduce `user_code`
    3) login con user/pass de Navidrome
    4) autoriza y listo

---

## 2) Diseño detallado (UX/UI)

### 2.1 “Modo coche” (login compacto)
**Cambios obligatorios**
- Header:
  - mover `verCurrent`, `verLatest`, botón `Novedades` **debajo del subtítulo** en la columna izquierda
  - compactar padding/altura
- Login:
  - eliminar “Esperando…”
  - `Usuario` + `Contraseña` en 2 columnas en una sola fila
  - botón `Conectar` a ancho completo debajo (alto táctil)
  - `Recordar credenciales` compacto (toggle/check a la derecha o debajo según espacio)
- Con teclado abierto:
  - ocultar elementos no esenciales (subtítulo, novedades, etc.)
  - asegurar inputs y botón visibles (scroll interno del card si hace falta)

### 2.2 Selector de “Modo dispositivo”
- Menú (o pantalla de ajustes):
  - `Modo: Auto / Coche / Tablet / Escritorio`
- Persistencia en `localStorage`
- **Sugerencia 1ª vez**:
  - si heurística detecta “posible coche” y el usuario no eligió modo:
    - mostrar modal: “Hemos detectado pantalla tipo coche, ¿activar modo Coche?”
    - checkbox “No volver a preguntar”
  - guardar `deviceModePromptSeen=true`

### 2.3 Modal de “Recordar”
- Si el usuario se logea con éxito pero **NO** marcó “Recordar credenciales”:
  - abrir modal:
    - “No estás guardando la sesión. En car unit esto significa que tendrás que volver a iniciar sesión.”
    - botones:
      - “Activar recordar y continuar”
      - “Continuar sin recordar”
- Si el usuario marca “Activar recordar”, se guarda preferencia y se reintenta persistencia (sin repetir ping).

### 2.4 i18n (ES/EN)
- Autodetección inicial:
  - `navigator.language` → si empieza por `es` usar `es`, si no `en`
- Selector en menú:
  - `Idioma: Español / English`
- TODAS las strings visibles deben salir del diccionario i18n (no hardcode).

---

## 3) Seguridad (requisitos mínimos, no negociables)

### 3.1 En el microservicio (FastAPI)
- **HTTPS obligatorio** (asumido por reverse proxy)
- `user_code`:
  - alfabeto sin ambiguos (sin 0/O, 1/I, etc.)
  - formato `XXXX-XXXX`
  - TTL 5 min
  - one-time
  - almacenar **hash** del `user_code` (no en claro)
- Rate limiting:
  - intentos de `verify(user_code)` limitados
  - polling del coche con backoff + limit (p.ej. 1 req/2s inicialmente)
- Tokens:
  - `access_token` corto (p.ej. 15 min)
  - `refresh_token` largo (p.ej. 30-90 días) con **rotación** y almacenamiento **hasheado**
- Revocación:
  - endpoint para revocar refresh por dispositivo
  - “Cerrar sesión / Olvidar dispositivo” en UI llama a revocación y borra storage local
- CORS:
  - solo permitir el propio origen (mismo dominio)
- Logs:
  - registrar eventos de auth (sin passwords)
  - auditoría de “device linked”, “revoked”, “expired”

### 3.2 En el frontend
- Seguir permitiendo “password en localStorage” (por compatibilidad) **pero**:
  - añadir aviso en UI (opcional, no intrusivo) sobre el riesgo en dispositivos compartidos
- Para tokens del broker:
  - guardar en `localStorage` (por comodidad) **o** `indexedDB`
  - en logout: borrar todo lo relacionado
- No imprimir tokens en debug logs.

---

## 4) Plan de implementación (hitos que CLAUDE debe marcar)

> CLAUDE debe mantener un checklist de hitos y marcarlo al completar cada uno.

### Hito A — Preparación repo y documentación
- [ ] Crear rama: `develop_device_auth_pwa`
- [ ] Añadir `.CLAUDE/agents.md` (si no existe) siguiendo las reglas del repo:
  - no push a main
  - commits pequeños
  - tests obligatorios
- [ ] Añadir `tech_docs/` con:
  - `tech_docs/V1_03_architecture.md` (frontend + broker + ND)
  - `tech_docs/V1_07_security.md` (amenazas y mitigaciones)
  - `tech_docs/V1_06_device_auth_flow.md` (diagrama y estados)

### Hito B — Frontend: modo dispositivo + layout car unit
- [ ] Añadir nueva preferencia `deviceMode` + `deviceModePromptSeen`
- [ ] Implementar heurística “posible coche”
- [ ] Implementar modal sugerencia 1ª vez
- [ ] Reordenar header (modo coche)
- [ ] Reordenar login (modo coche)
- [ ] Implementar “modo teclado” más agresivo (ocultar no críticos)
- [ ] Eliminar “Esperando…” (status vacío por defecto)

### Hito C — Frontend: modal “Recordar”
- [ ] Interceptar login OK si “Recordar” desmarcado → modal
- [ ] Si “Activar recordar”: persistir credenciales/perfil + preferencia sin repetir ping

### Hito D — i18n ES/EN
- [ ] Crear módulo i18n con diccionarios (mínimo `es`, `en`)
- [ ] Sustituir strings hardcode por `t("key")`
- [ ] Selector de idioma y autodetección inicial
- [ ] Tests unitarios de i18n (keys faltantes, fallback)

### Hito E — PWA
- [ ] `manifest.webmanifest`
- [ ] Service worker para assets estáticos (cache-first)
- [ ] Iconos mínimos
- [ ] Documentar instalación en car unit (sin barra del navegador)

### Hito F — Microservicio FastAPI (Auth Broker)
- [ ] Crear carpeta `broker/` con FastAPI
- [ ] Endpoints mínimos:
  - `POST /api/device/start` → devuelve `user_code`, `expires_in`, `device_code`
  - `POST /api/device/poll`  → coche consulta estado por `device_code`
  - `POST /api/device/verify` → móvil verifica `user_code` válido
  - `POST /api/device/complete` → móvil envía credenciales ND y aprueba
  - `POST /api/session/refresh` → renueva access
  - `POST /api/session/revoke` → revoca refresh por dispositivo
- [ ] Persistencia: SQLite (por defecto) con migración simple
- [ ] Seguridad:
  - hash `user_code`
  - refresh token hash + rotación
  - rate limit básico

### Hito G — Integración frontend↔broker
- [ ] Pantalla/diálogo “Vincular con móvil”
- [ ] Mostrar `user_code` grande, con contador de expiración
- [ ] Polling con backoff y manejo de errores
- [ ] Al recibir sesión, guardar y pasar a “player”
- [ ] En menú: “Cerrar sesión” y “Olvidar dispositivo” (revoca y limpia storage)

### Hito H — Tests y validación (obligatorio antes de commit)
- [ ] Backend: pytest
  - tests de expiración `user_code` (TTL)
  - tests de rotación refresh
  - tests rate limit (al menos comportamiento esperado)
  - tests de verify inválido / caducado / ya usado
- [ ] Frontend:
  - tests unitarios (mínimos) para:
    - storage deviceMode
    - i18n fallback
    - normalización de server
- [ ] “Chaos tests” manuales guiados:
  - desconectar red en mitad de polling
  - introducir códigos incorrectos repetidos
  - cambiar hora del sistema (si aplica) y validar expiración
  - revocar dispositivo y comprobar que el coche queda fuera

---

## 5) Prompts sugeridos para CLAUDE 5.3 (en orden)
> Copia/pega tal cual en cada paso. CLAUDE debe **marcar hitos** y **no saltarse tests**.

### Prompt 1 — Inventario y plan
- Analiza el repo completo.
- Enumera lo existente (módulos, pantallas, storage keys).
- Propón el cambio mínimo para:
  - modo dispositivo
  - re-layout car unit
  - i18n
  - PWA
  - integración con broker
- Crea el checklist de hitos A–H en un fichero `tech_docs/V1_02_roadmap.md`.

### Prompt 2 — Modo dispositivo + layout car unit
- Implementa `deviceMode` (Auto/Coche/Tablet/Escritorio) + heurística “posible coche”.
- Modal 1ª vez si posible coche (con “No volver a preguntar”).
- Reordena header + login para modo coche y elimina “Esperando…”.
- Implementa “modo teclado” (ocultar no críticos).
- Añade tests mínimos de storage/heurística.

### Prompt 3 — Modal “Recordar”
- Si login OK y remember desmarcado, muestra modal:
  - activar recordar y continuar
  - continuar sin recordar
- Asegura que no repite el ping innecesariamente.
- Añade tests.

### Prompt 4 — i18n ES/EN
- Añade módulo i18n.
- Sustituye strings en `index.html` y `app.js` por claves.
- Autodetección + selector de idioma en menú.
- Tests: claves faltantes y fallback.

### Prompt 5 — PWA
- Añade manifest + SW (cache assets).
- Documenta instalación.
- Asegura que sigue funcionando en modo estático.

### Prompt 6 — FastAPI broker (device auth + refresh)
- Crea el servicio `broker/` con FastAPI y SQLite.
- Implementa endpoints del Hito F.
- Implementa seguridad: hashing codes, refresh rotación, rate limit.
- Tests completos (pytest + httpx).

### Prompt 7 — Integración completa y UX final
- Añade UI “Vincular con móvil”:
  - user_code grande
  - expiración visible
  - polling robusto (backoff)
- Añade menú:
  - cerrar sesión
  - olvidar dispositivo (revocar)
- Smoke tests manuales descritos en `tech_docs/V1_09_test_plan.md`.

### Prompt 8 — Hardening final
- Revisión de seguridad final con checklist.
- Limpieza: quitar logs sensibles, revisar almacenamiento.
- Asegura que todo pasa tests.
- Commits pequeños y mensaje claro por hito.

---

## 6) Notas de implementación (restricciones y decisiones)
- **Código sin ambigüedad**: usar alfabeto tipo Crockford Base32 (sin I/L/O/U) o lista propia equivalente.
- TTL de `user_code`: **5 minutos**.
- Polling: empezar cada 2s y aumentar hasta 5–8s con backoff.
- La UI debe funcionar:
  - car unit 1280×480 (sin barra ideal por PWA)
  - desktop / tablet responsive
- Mantener compatibilidad con perfiles actuales (server+user+pass).
- No implementar avatar.

---

## 7) Definición de “Done”
- [ ] Car unit puede logearse **sin teclado** (solo URL + código).
- [ ] “Modo coche” deja el login usable con teclado abierto.
- [ ] i18n ES/EN completo.
- [ ] PWA instalable.
- [ ] Logout + olvidar dispositivo (revoca y borra).
- [ ] Tests backend y frontend pasando.
- [ ] Documentación técnica y de seguridad añadida.
