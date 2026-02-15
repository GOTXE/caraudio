# WEB_updt_MUSIC v1
## PWA Multidispositivo + Arquitectura Visual + Device Authorization Flow + i18n
Versión: 2.0 (Integrada y Definitiva)

---

# OBJETIVO GLOBAL

Transformar WEB_updt_MUSIC en:

- PWA instalable
- Multidispositivo real con 2 plantillas base (Car Unit 1280x480 y Desktop 1920x1080); Tablet deriva de Desktop
- Login sin teclado para coche (Device Authorization Flow)
- i18n ES/EN
- Arquitectura visual sólida y escalable
- Seguridad robusta con refresh token y revocación

## Regla crítica de alcance (no regresión)

- V1 prioriza refactor de login/autenticación.
- El player de `v0.1.0-alpha.6` debe mantenerse funcional al completo.
- Cualquier cambio en player debe ser compatible con la UX existente y validado contra `tech_docs/V1_11_functional_parity.md`.

---

# ORDEN ESTRICTO DE IMPLEMENTACIÓN

⚠️ No se puede avanzar de fase hasta completar la anterior.

---

# FASE 0 — ARQUITECTURA VISUAL (BLOQUEANTE)

## Objetivo
Estabilizar UI antes de introducir nueva lógica.

## 0.1 Design Tokens

Definir CSS variables obligatorias:

Colores:
- --color-bg-primary
- --color-bg-surface
- --color-bg-elevated
- --color-accent
- --color-accent-hover
- --color-danger
- --color-success
- --color-text-primary
- --color-text-secondary
- --color-border

Espaciado:
space-1 = 4px
space-2 = 8px
space-3 = 12px
space-4 = 16px
space-5 = 24px
space-6 = 32px
space-7 = 48px

Tipografía:
text-xs
text-sm
text-base
text-lg
text-xl
text-2xl

Regla:
- Ningún color hardcodeado
- Ningún tamaño fuera de escala

---

## 0.2 Plantillas base (fuente visual)

Fuente canónica:
- `tech_docs/V1_99_pencil_webs.pen`
- Frame `Login Car Unit 1280x480`
- Frame `Login Desktop 1920x1080`

### Plantilla Car Unit (Compact)
- Activación automática por heurística o forzado manual
- Header <= 72px
- Usuario + contraseña en misma fila
- Botón ancho completo
- Sin texto "Esperando…"
- Elementos secundarios ocultos con teclado abierto
- Altura mínima botón: 40px

### Plantilla Desktop (Wide base)
- Ancho máximo contenido ~1200px
- Mayor espacio en blanco
- Hover real habilitado

Regla Tablet:
- Tablet reutiliza la plantilla Desktop con ajustes responsive.

---

## 0.3 Estados de Componentes

Cada componente debe definir:
default, hover, active, focus, disabled, error

Aplicar especialmente en:
- Button
- Input
- Modal
- Card

---

## 0.4 Accesibilidad

- Contraste mínimo WCAG AA
- Focus visible
- Estados no dependientes solo de color

---

## Checklist Fase 0

- [ ] Refactor CSS a tokens
- [ ] Implementar 2 plantillas base: Car Unit + Desktop (Tablet derivado)
- [ ] Refactor Login base
- [ ] Definir plantillas canónicas de Player en Pencil (Car + Desktop)
- [ ] Validar contraste
- [ ] Validar expansión texto 30%

---

# FASE 0.5 — PARIDAD FUNCIONAL DEL PLAYER (BLOQUEANTE)

## Objetivo
Blindar que V1 no pierda funcionalidades ya operativas en `v0.1.0-alpha.6`.

## Regla

- No avanzar a Fase 1 sin checklist de paridad validado.
- Si un cambio de login afecta el estado global, debe preservar contratos del player.

Checklist:
- [ ] Mantener tema `día/noche/auto` (incluyendo configuración auto por zona horaria)
- [ ] Mantener perfiles/cambio de usuario/autoconexión
- [ ] Mantener favoritos, más reproducidas y scrobble
- [ ] Mantener disposición actual del player y panel de listas
- [ ] Mantener modales operativos (álbumes, canciones, menú, novedades)
- [ ] Validar todo contra `tech_docs/V1_11_functional_parity.md`

---

# FASE 1 — MODO DISPOSITIVO Y UX BASE

## 1.1 deviceMode

Persistencia:
Auto | Coche | Escritorio (Tablet usa plantilla Escritorio responsive)

## 1.2 Heurística “posible coche”

Condiciones:
- Altura <= 520px
- Aspect ratio > 2.2

Mostrar modal solo primera vez.

## 1.3 Modal “Recordar”

Si login OK y recordar no marcado:
- Modal advertencia
- Botón activar recordar
- Botón continuar sin recordar

## 1.4 Logout y olvidar dispositivo

- Revocar refresh token
- Limpiar storage
- Volver a login

---

# FASE 2 — I18N (ES / EN)

## 2.1 Autodetección

navigator.language:
- es → español
- resto → inglés

## 2.2 Selector manual

Guardar preferencia en storage.

## 2.3 Reglas

- Ningún texto hardcodeado
- Botones sin ancho fijo
- Tests de claves faltantes

Checklist:
- [ ] Diccionario ES
- [ ] Diccionario EN
- [ ] Reemplazo total strings
- [ ] Tests fallback

---

# FASE 3 — PWA

## 3.1 Manifest

- name
- short_name
- icons
- display standalone

## 3.2 Service Worker

- Cache assets estáticos
- Estrategia cache-first

## 3.3 Instalación Car Unit

- Sin barra navegador
- Comprobación funcionamiento offline shell

Checklist:
- [ ] Manifest válido
- [ ] SW funcionando
- [ ] Instalación verificada

---

# FASE 4 — DEVICE AUTHORIZATION FLOW (FASTAPI BROKER)

## 4.1 Arquitectura

Frontend (PWA)
↓
Broker FastAPI (mismo dominio)
↓
Navidrome

---

## 4.2 Endpoints

POST /api/device/start
POST /api/device/poll
POST /api/device/verify
POST /api/device/complete
POST /api/session/refresh
POST /api/session/revoke

---

## 4.3 Seguridad Obligatoria

user_code:
- Formato XXXX-XXXX
- Sin caracteres ambiguos
- TTL 5 minutos
- One-time
- Guardar hash

Refresh token:
- Rotación obligatoria
- Guardar hash
- Revocable

Rate limiting:
- verify limitado
- polling con backoff

HTTPS obligatorio.

---

## 4.4 Flujo

Car Unit:
1. Introduce URL servidor
2. Solicita user_code
3. Muestra código
4. Polling

Móvil:
1. Entra en /link
2. Introduce código
3. Login ND
4. Autoriza

Regla de URL (obligatoria):
- `/link` debe resolverse con la URL base de cada instalación.
- Nunca usar `dominio` hardcodeado en UI o lógica.

---

Checklist:
- [ ] SQLite persistencia
- [ ] Hash codes
- [ ] Rotación refresh
- [ ] Tests pytest completos

---

# FASE 5 — INTEGRACIÓN TOTAL

## 5.1 UI Vincular con móvil

- Código grande
- Contador expiración
- Estado polling visible

## 5.2 Gestión dispositivos

- Cerrar sesión
- Olvidar dispositivo

## 5.3 Tests de estrés

- Código caducado
- Código incorrecto repetido
- Red interrumpida
- Revocación inmediata

---

# TESTING OBLIGATORIO

Backend:
- Expiración user_code
- Reutilización prohibida
- Rotación refresh
- Revocación correcta

Frontend:
- deviceMode persistente
- i18n fallback
- Modo teclado

Manual:
- Car unit 1280x480
- Desktop
- Tablet (validación sobre plantilla Desktop responsive)

---

# DEFINICIÓN DE DONE

- Login coche sin teclado funcional
- UI consistente en todos los perfiles
- PWA instalable
- i18n completo
- Seguridad validada
- Tests pasando
- Documentación en tech_docs/
- Paridad funcional completa del player respecto a `v0.1.0-alpha.6`

---

# RAMAS Y COMMIT

Rama obligatoria:
develop_device_auth_pwa_v1

Reglas:
- Commits pequeños por fase
- No merge sin tests
- No push a main directo

---

FIN DEL DOCUMENTO
