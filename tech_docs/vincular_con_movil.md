# Vincular Con Móvil: Función Completa + Presentación Web

## 1. Objetivo de la funcionalidad

La funcionalidad de **vincular con móvil** permite iniciar sesión en el dispositivo del coche sin escribir usuario/contraseña en la pantalla principal.

Flujo resumido:

1. El coche solicita un código temporal al broker.
2. El usuario abre una URL de móvil (`/link`) y escribe ese código + credenciales.
3. El broker valida credenciales contra Navidrome y emite una sesión.
4. El coche hace polling hasta recibir `approved` y guarda la sesión.

---

## 2. Capas implicadas

- **UI coche (presentación principal):** `web/index.html`
- **Lógica de vinculación coche:** `web/assets/js/app.js`
- **UI móvil (pantalla de autorización):** `web/link.html` + `web/assets/js/link.js`
- **Cliente HTTP para broker:** `web/assets/js/modules/broker-client.js`
- **API backend:** `broker/app/main.py`

---

## 3. Presentación web (parte visual)

### 3.1 Botón de vinculación en login (coche)

Archivo: `web/index.html`

```html
<div class="actionsStack">
  <button id="connectBtn" class="btn btnPrimary" type="button" data-i18n="login.connect"></button>
  <button id="linkBtn" class="btn btnSecondary" type="button" data-i18n="login.link_device"></button>
</div>
```

### 3.2 Modal de código en coche

Archivo: `web/index.html`

```html
<dialog id="deviceModal" class="modal">
  <form method="dialog" class="modalCard">
    <h3 data-i18n="modal.link_title"></h3>
    <p data-i18n="modal.link_body"></p>
    <p class="statusLine" id="mobileLinkUrl"></p>
    <p class="codeValue" id="userCodeValue">----</p>
    <p class="statusLine" id="userCodeTimer"></p>
    <p class="statusLine" id="deviceModalStatus"></p>
    <div class="modalActions">
      <button id="deviceModalClose" class="btn btnSecondary" value="close" data-i18n="modal.close"></button>
    </div>
  </form>
</dialog>
```

Qué se muestra en el modal:

- URL de móvil para autorizar.
- Código de usuario (`ABCD-EFGH`).
- Cuenta atrás de expiración.
- Estado (`pending`, `expired`, `denied`, etc.).

### 3.2.1 Decisión V1 (cerrada)

Reglas de UX para V1:

- `Car Unit`: NO mostrar botón secundario `Copiar URL`.
- `Desktop/Tablet`: `Copiar URL` opcional.
- El modal de coche no debe abrir teclado Android ni recibir foco en campos editables.
- Prioridad visual: `user_code` grande -> URL móvil -> temporizador -> estado.

Reglas anti-teclado (Car Unit):

- En `deviceModal` no hay `<input>`, `<textarea>` ni elementos `contenteditable`.
- No usar `autofocus` al abrir el modal.
- Al abrir modal, forzar foco en botón de cierre o en un contenedor no editable:
  - `refs.deviceModalClose.focus({ preventScroll: true })`
- Si hay CTA para abrir URL, usar botón (`window.open(...)`) y no campo editable.

Estados de UI en modal:

- `starting`: Generando código...
- `pending`: Esperando confirmación en móvil...
- `approved`: Vinculación completada. Entrando...
- `expired`: Código expirado. Generar nuevo.
- `denied`: Autorización cancelada.
- `error`: No se pudo iniciar. Reintentar.

### 3.3 Pantalla web de autorización (móvil)

Archivo: `web/link.html`

```html
<main class="linkPage">
  <section class="card linkCard">
    <h1 data-i18n="link.title"></h1>
    <p class="subtitle" data-i18n="link.subtitle"></p>

    <label class="fieldLabel" for="digit0" data-i18n="link.code"></label>
    <div class="codeInputs" id="codeInputs" role="group" aria-label="Código de vinculación">
      <input id="digit0" class="codeDigit" type="text" maxlength="1" />
      <input id="digit1" class="codeDigit" type="text" maxlength="1" />
      <input id="digit2" class="codeDigit" type="text" maxlength="1" />
      <input id="digit3" class="codeDigit" type="text" maxlength="1" />
      <span class="codeDash" aria-hidden="true">-</span>
      <input id="digit4" class="codeDigit" type="text" maxlength="1" />
      <input id="digit5" class="codeDigit" type="text" maxlength="1" />
      <input id="digit6" class="codeDigit" type="text" maxlength="1" />
      <input id="digit7" class="codeDigit" type="text" maxlength="1" />
    </div>

    <label class="fieldLabel" for="linkUser" data-i18n="login.username"></label>
    <input id="linkUser" class="inputControl" type="text" autocomplete="username" />

    <label class="fieldLabel" for="linkPass" data-i18n="login.password"></label>
    <input id="linkPass" class="inputControl" type="password" autocomplete="current-password" />

    <button id="linkAuthorize" class="btn btnPrimary" type="button" data-i18n="link.authorize"></button>
    <p class="statusLine" id="linkStatus"></p>
  </section>
</main>
```

### 3.4 Estilos CSS principales de la pantalla de link

Archivo: `web/assets/css/styles.css`

```css
.linkPage {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-4);
}

.linkCard {
  width: min(680px, calc(100vw - 24px));
}

.codeInputs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin: var(--space-2) 0 var(--space-4);
}

.codeDigit {
  width: 52px;
  height: 58px;
  border-radius: 14px;
  text-transform: uppercase;
  font-size: 28px;
  font-weight: 700;
}
```

---

## 4. Función de vinculación (lógica de negocio)

## 4.1 Inicio desde el coche: `startLinkFlow()`

Archivo: `web/assets/js/app.js`

```js
async function startLinkFlow() {
  const server = getServer();
  if (!server) {
    setStatus("status.need_server", "error");
    refs.serverModal.showModal();
    return;
  }

  const mobileUrl = deriveDefaultMobileUrl();
  refs.mobileLinkUrl.textContent = state.i18n.t("modal.mobile_url", { url: mobileUrl });

  const response = await startDevice({ server_url: server });
  state.deviceFlow = {
    deviceCode: response.device_code,
    userCode: response.user_code,
    expiresAt: Date.now() + (response.expires_in || DEVICE_CODE_TTL_SECONDS) * 1000
  };

  refs.userCodeValue.textContent = state.deviceFlow.userCode;
  refs.deviceModal.showModal();

  startCountdown();
  runPolling();
}
```

Qué hace:

- Valida servidor configurado.
- Deriva la URL móvil en runtime según la instalación actual (origen/base URL del usuario).
- Regla: no hardcodear `https://dominio/link`; debe construirse dinámicamente.
- Pide código al broker (`/api/device/start`).
- Guarda estado temporal (`deviceCode`, `userCode`, expiración).
- Abre modal y arranca:
  - cuenta atrás local
  - polling periódico al backend

## 4.2 Polling del coche: `runPolling()`

Archivo: `web/assets/js/app.js`

```js
async function runPolling() {
  const response = await pollDevice({ device_code: state.deviceFlow.deviceCode });

  if (response.status === "pending") {
    state.pollDelayMs = Math.min(8000, Math.max(2000, (response.interval_seconds || 2) * 1000));
    state.pollTimer = setTimeout(runPolling, state.pollDelayMs);
    return;
  }

  if (response.status === "approved") {
    setBrokerSession({
      sessionId: response.session_id,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      accessExpiresAt: response.access_expires_at,
      refreshExpiresAt: response.refresh_expires_at,
      linkedAt: Date.now()
    });
    showScreen("player");
    loadPlayerAfterAuth();
    return;
  }
}
```

Qué hace:

- Consulta estado del `device_code`.
- Si `pending`, reajusta intervalo y sigue consultando.
- Si `approved`, persiste sesión y entra al reproductor.

Reglas V1 adicionales en `runPolling()`:

- Si modal cerrado por usuario: cancelar `pollTimer` y `countdownTimer`.
- Si `expired`/`denied`/`error`: detener polling y dejar CTA `Generar nuevo código`.
- Al reintentar, siempre crear `device_code` nuevo (no reutilizar estado previo).

## 4.3 Autorización desde móvil: `authorize()`

Archivo: `web/assets/js/link.js`

```js
async function authorize() {
  const userCode = buildUserCode(); // ABCD-EFGH
  const username = refs.user.value.trim();
  const password = refs.pass.value;

  if (!userCode || !username || !password) {
    setStatus("link.status_need_fields", "error");
    return;
  }

  const verified = await verifyDeviceCode({ user_code: userCode });
  await completeDevice({
    verification_token: verified.verification_token,
    username,
    password
  });
  setStatus("link.status_done", "ok");
}
```

Qué hace:

- Valida campos.
- Envía código a `/api/device/verify`.
- Con `verification_token`, completa autorización en `/api/device/complete`.

## 4.4 Entrada de código robusta (UX móvil)

Archivo: `web/assets/js/link.js`

```js
function normalizeCodeChar(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 1);
}

function buildUserCode() {
  const values = refs.digits.map((input) => normalizeCodeChar(input.value));
  if (values.some((value) => !value)) return "";
  return `${values.slice(0, 4).join("")}-${values.slice(4).join("")}`;
}
```

Características:

- Fuerza mayúsculas.
- Permite solo alfanumérico.
- Construye formato canónico `XXXX-XXXX`.
- Soporta pegado completo y navegación con teclado.
- Conversión en tiempo real: aunque el usuario escriba en minúsculas, cada carácter se normaliza a mayúscula en el `input` al instante.

---

## 5. Contrato API del broker (endpoints usados)

Archivo: `broker/app/main.py`

## 5.1 `POST /api/device/start`

Request:

```json
{
  "server_url": "https://tu-navidrome.example.com"
}
```

Response:

```json
{
  "device_code": "....",
  "user_code": "ABCD-EFGH",
  "expires_in": 300,
  "interval_seconds": 2,
  "server_hint": "https://tu-navidrome.example.com"
}
```

## 5.2 `POST /api/device/verify`

Request:

```json
{
  "user_code": "ABCD-EFGH"
}
```

Response:

```json
{
  "verification_token": "....",
  "expires_in": 241
}
```

## 5.3 `POST /api/device/complete`

Request:

```json
{
  "verification_token": "....",
  "username": "usuario",
  "password": "secreto"
}
```

Response:

```json
{
  "status": "ok"
}
```

## 5.4 `POST /api/device/poll`

Request:

```json
{
  "device_code": "...."
}
```

Responses típicas:

```json
{ "status": "pending", "interval_seconds": 4 }
```

```json
{
  "status": "approved",
  "session_id": "....",
  "access_token": "....",
  "refresh_token": "....",
  "access_expires_at": 1730000000,
  "refresh_expires_at": 1732500000
}
```

```json
{ "status": "expired" }
```

---

## 6. Flujo completo paso a paso

1. Usuario pulsa `Vincular dispositivo` en login (`#linkBtn`).
2. `startLinkFlow()` solicita `user_code` y abre modal del coche.
3. Usuario abre URL móvil (`/link`) y escribe código + credenciales.
4. Móvil llama `verify` y luego `complete`.
5. Coche sigue llamando `poll`.
6. Cuando backend responde `approved`, el coche guarda sesión y entra al player.

---

## 7. Seguridad implementada en esta función

- Códigos temporales con TTL (`CODE_TTL_SECONDS = 300`).
- `user_code` no se guarda en claro; se guarda `hash`.
- `verification_token` de un solo uso.
- Rate limiting por endpoint/IP/código.
- Tokens de sesión con expiración (`access` y `refresh`).
- Al consumir `approved`, los tokens emitidos se limpian de `device_requests`.

---

## 8. Textos i18n relevantes

Archivo: `web/assets/js/modules/i18n.js`

Claves usadas en esta funcionalidad:

- `login.link_device`
- `modal.link_title`
- `modal.link_body`
- `modal.mobile_url`
- `status.link_starting`
- `status.link_pending`
- `status.link_expired`
- `status.link_denied`
- `status.link_approved`
- `link.title`
- `link.subtitle`
- `link.authorize`
- `link.status_need_fields`
- `link.status_verifying`
- `link.status_authorizing`
- `link.status_done`
- `link.status_failed`

---

## 9. Resumen técnico

La parte de **presentación web** está separada entre:

- Modal de enlace en coche (`index.html`).
- Pantalla dedicada en móvil (`link.html`).

La parte de **función** se resuelve con flujo de tipo *device code*:

- `start` -> `verify` -> `complete` -> `poll`.

Esto permite una UX cómoda para coche, reduce entrada de credenciales en pantalla principal y mantiene control de sesión desde broker.

---

## 10. Comportamiento por dispositivo (V1)

### 10.1 Car Unit

- Modal compacto de una columna.
- Botón visible: `Cerrar` (y `Generar nuevo código` solo en estado final no exitoso).
- Sin botón `Copiar URL`.
- Sin teclado Android durante modal.

### 10.2 Desktop/Tablet

- Mismo flujo funcional.
- Puede incluir botón `Copiar URL` para conveniencia.
- Mantener estado y temporizador visibles igual que en Car Unit.
