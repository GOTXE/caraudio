# Mejora del MVP (index.html) — CarPlayer · Navidrome

**Objetivo:** mejorar robustez, mantenibilidad y UX del MVP **sin framework** (sin Svelte/Vue/React) manteniendo **carga rápida** y una UI “car friendly”.

> Este documento propone cambios incrementales. Puedes aplicar solo los de **Fase 1** y ya notarás mejora sin reescribirlo todo.

---

## 0) Estado actual (resumen técnico)

En tu `index.html` actual hay:
- UI + estilos embebidos (bien optimizado visualmente para 1280×480).
- Lógica de API Subsonic (Navidrome) con `salt + md5`.
- Vistas: artistas / géneros / álbumes / playlists.
- Cola y reproducción con `<audio>`.
- **Media Session API** ya implementada (✅ importante).
- Persistencia de servidor/usuario/contraseña en `localStorage` (⚠️).

---

## 1) Prioridades (orden recomendado)

1. **Separar JS/CSS** (sin cambiar comportamiento).
2. **Añadir “Calidad (transcoding)” manual** (AAC 192 / 256, opcional 128) aplicado a **siguiente** tema.
3. **Robustecer red** (timeouts, abort, reintentos con backoff).
4. **Mejorar primera reproducción y buffering** (arranque rápido + control de rebuffer).
5. **UX de coche**: “Recientes”, “Favoritos”, y búsqueda más directa (sin navegar profundo).

---

## 2) Fase 1 — Refactor sin cambios funcionales (1–2 h)

### 2.1 Estructura mínima de ficheros

Crea esta estructura (mismo directorio que `index.html`):

- `index.html` (solo markup)
- `styles.css` (mueves todo el `<style>`)
- `app.js` (mueves todo el `<script>`)
- `navidrome.js` (API Subsonic + helpers URL + auth)
- `player.js` (cola + reproducción + mediasession)
- `ui.js` (render de listas/vistas + bindings DOM)
- `storage.js` (get/set de localStorage)
- `constants.js` (keys de storage, defaults, etc.)

> Mantén el mismo comportamiento: primero separa, luego mejoras.

### 2.2 Reglas de import (sin bundler)
Usa módulos nativos:

- En `index.html`:
  - `<link rel="stylesheet" href="./styles.css">`
  - `<script type="module" src="./app.js"></script>`

En `app.js`:
- `import { … } from "./navidrome.js";`
- `import { … } from "./player.js";`
- `import { … } from "./ui.js";`

---

## 3) Fase 2 — “Calidad” manual (transcoding) (impacto alto)

### 3.1 Añadir selector de calidad en UI
En la pantalla del reproductor (header o zona de controles), añade un **toggle**:

- `Baja` → AAC 192 kbps (m4a)
- `Alta` → AAC 256 kbps (m4a)
- (Opcional) `Emergencia` → AAC 128 kbps (m4a)

**Comportamiento UX:**
- El cambio **no reinicia** la canción actual.
- Mensaje: “Se aplicará a la siguiente canción”.

### 3.2 Implementación en URL de stream (Subsonic)
Ahora mismo:
- `streamUrl(server, auth, id)` → `.../rest/stream?...&id=<id>`

Añade params cuando haya transcode:
- `maxBitRate=<kbps>` (p. ej. 192 / 256 / 128)
- `format=m4a` (para AAC)

Ejemplo conceptual:
- `buildRestUrl(server, "stream", { ...baseParams(auth), id, maxBitRate: 192, format: "m4a" })`

**Nota:** esto es estándar Subsonic. En Navidrome suele funcionar con esos parámetros.

### 3.3 Persistencia del ajuste
- Guarda el perfil en `localStorage`:
  - `carplayer.navidrome.quality = "low" | "high" | "emergency"`
- Default: `"low"`.

---

## 4) Fase 3 — Red robusta (evitar “se queda colgado”)

### 4.1 Wrapper de fetch con timeout + abort
En `navidrome.js`, crea `fetchJson(url, { timeoutMs })`:

- `AbortController`
- timeout razonable:
  - listados: 8–12 s
  - stream: no aplica (audio lo gestiona el navegador)

### 4.2 Reintentos con backoff para listados
Para endpoints de biblioteca:
- 2 reintentos (máximo 3 intentos total)
- backoff: 400ms, 900ms

**No reintentar** si:
- 401 (credenciales)
- 404 (endpoint mal)
- errores de validación (respuesta con `error` Subsonic)

### 4.3 Estado de “offline”
- Si falla un fetch, muestra estado:
  - “Sin conexión / servidor no responde”
- Mantén UI operativa (no bloquear botones).

---

## 5) Fase 4 — Reproducción: arranque rápido + rebuffer controlado

Tu MVP ya hace algo esencial: intenta `player.play()` inmediatamente (✅).
Mejoras recomendadas:

### 5.1 Umbral de arranque muy bajo
Objetivo: que la primera canción empiece en ~1–2 s si hay red.

- Inicia en cuanto `canplay` y `bufferedEnd - currentTime >= 1.5s`.

### 5.2 Gestión de “buffering”
Escucha eventos del `<audio>`:
- `waiting` → UI “Buffering…”
- `playing` → quita el estado
- `stalled` → reintento suave (si aplica)
- `error` → mostrar mensaje + saltar a siguiente si procede

### 5.3 Fallback si la pista falla
Si una pista falla 2 veces seguidas:
- saltar a la siguiente
- log en consola y aviso discreto

---

## 6) Fase 5 — UX “coche”: reducir navegación y scroll

### 6.1 “Recientes” (lo más útil)
Añade una vista “Recientes”:
- guarda en `localStorage` los últimos 20 `songId` reproducidos
- render directo
- 1 toque → play

### 6.2 “Favoritos” (opcional)
Si quieres:
- usa endpoints de “star/unstar” (Subsonic) si Navidrome los soporta en tu config.
- si no, haz favorito local (lista de `songId` en storage).

### 6.3 Búsqueda “rápida”
Sin voz de momento:
- barra de búsqueda (debounce 250ms)
- resultados por secciones (Artistas / Álbumes / Canciones)
- máximo 10 por sección para no saturar.

---

## 7) Seguridad mínima (MVP)
Ahora mismo guardas contraseña en `localStorage`:
- `carplayer.navidrome.pass`

**Recomendación MVP (mínima y práctica):**
- Añadir “Recordar credenciales” (checkbox):
  - si **desmarcado** → no persistir password (solo en memoria)
  - si marcado → `localStorage` como ahora

---

## 8) Pruebas manuales (checklist)
Haz estas pruebas con una red mala (tethering + bajar cobertura o limitador):

1. Login correcto / incorrecto (error visible, no se queda colgado).
2. Abrir listas (artistas/álbumes) con timeout.
3. Reproducción: primera canción arranca rápido.
4. Durante reproducción: simular pérdida de red (modo avión 5–10s):
   - entra “Buffering…”
   - recupera al volver la red
5. Cambiar calidad:
   - se aplica al siguiente tema
6. Botones BT:
   - play/pause/next/prev funcionando (Media Session)

---

## 9) Definition of Done del MVP mejorado
- Código separado en ficheros (HTML/CSS/JS) y módulos.
- Selector de calidad manual persistente.
- UI no se bloquea por fallos de red.
- Reproducción arranca rápido y muestra buffering correctamente.
- Recientes disponible (1–2 taps para reproducir).
- Sin necesidad de framework.

---

## 10) Siguiente paso (cuando el MVP esté “fino”)
Cuando esto esté estable:
- convertir a PWA (manifest + SW) y cache de app shell
- IndexedDB para cache de portadas/metadatos
- voz (Android) con fallback Tesla (sin asumir micrófono)
