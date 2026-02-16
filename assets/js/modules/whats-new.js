// Regla de mantenimiento:
// Cada nueva funcionalidad visible para usuario debe quedar registrada aqui por version/tag.
// (Se actualiza normalmente al preparar el PR/release que entra en produccion.)
const WHATS_NEW_BY_VERSION = {
  "v1.0.0": {
    es: [
      "Nueva versión mayor v1.0.0: rediseño completo de la app con enfoque estable para uso diario.",
      "Nuevo acceso por dispositivo: login adaptado para Car Unit y Desktop/Tablet.",
      "Vinculación con otro dispositivo: puedes autorizar desde móvil con código sin escribir en pantalla del coche.",
      "Player mejorado en modo coche: controles más claros, mejor distribución y botones más cómodos.",
      "Gestión de usuarios/perfiles: cambio rápido de usuario y acceso directo a perfiles guardados desde login.",
      "Tema visual avanzado: modos Día, Noche y Auto con mejor contraste y legibilidad.",
      "Mejoras de progreso y reproducción: barra de reproducción más visible y comportamiento más consistente.",
      "PWA preparada para instalación: experiencia más cercana a app nativa en pantalla completa.",
      "Base técnica V1 renovada para mayor estabilidad y futuras mejoras.",
      "Nuevo botón “Ocultar teclado” en Car Unit para evitar que el teclado tape la UI.",
      "Validación real del servidor: solo se acepta si responde como Navidrome/Subsonic (ping correcto).",
      "Campos de contraseña con opción Mostrar/Ocultar.",
    ],
    en: [
      "Major v1.0.0 release: complete redesign focused on stable daily use.",
      "Device-based access: login adapted for Car Unit and Desktop/Tablet.",
      "Link another device: authorize from mobile with a code, without typing on the car screen.",
      "Improved car player: clearer controls, better layout, and more comfortable buttons.",
      "User profiles: quick user switching and direct access to saved profiles from login.",
      "Advanced theme system: Day, Night, and Auto with better contrast and readability.",
      "Playback and progress improvements: more visible progress bar and steadier behavior.",
      "PWA ready for installation: closer to a native full-screen app.",
      "V1 base renewed for stability and future improvements.",
      "New “Hide keyboard” button in Car Unit to prevent the keyboard from covering the UI.",
      "Real server validation: only accepted if it responds as Navidrome/Subsonic (correct ping).",
      "Password fields with Show/Hide option.",
    ],
  },
  "v0.1.0-alpha.6": {
    es: [
      "Nueva cabecera de Music Skin ND con acceso directo a Novedades.",
      "Nuevo menu hamburguesa con Tema, lado de listas y cambio de usuario.",
      "Tema con 3 modos: Dia, Noche y Auto.",
      "Modo Auto simplificado: zona horaria + hora de Dia y Noche (sin ciudad).",
      "Al actualizar la web, se conservan las preferencias del usuario (tema y perfiles).",
      "En la pantalla de login ya no aparece el menu de ajustes.",
      "Mas reproducidas y Favoritas se han movido al panel de reproduccion.",
      "Al pulsar Mas reproducidas o Favoritas, la musica empieza en modo aleatorio.",
      "Nuevo boton de favorita: solo corazon, junto a la portada, relleno cuando esta activa.",
      "Mas reproducidas y Favoritas ya no cambian el listado lateral.",
      "Portadas mas rapidas en listas y modales.",
      "Si una portada falla al inicio, se reintenta y se muestra portada por defecto de la UI.",
      "Corregido el seguimiento de la cancion activa en listas largas.",
    ],
    en: [
      "New Music Skin ND header with direct access to What's New.",
      "New hamburger menu with Theme, list side, and user switch.",
      "Theme with 3 modes: Day, Night, and Auto.",
      "Simplified Auto mode: time zone + Day/Night time (no city).",
      "On update, user preferences are preserved (theme and profiles).",
      "Login screen no longer shows the settings menu.",
      "Most played and Favorites moved to the playback panel.",
      "Pressing Most played or Favorites starts music in shuffle mode.",
      "New favorite button: heart-only, next to the cover, filled when active.",
      "Most played and Favorites no longer change the side list.",
      "Faster covers in lists and modals.",
      "If a cover fails initially, it retries and shows the UI default cover.",
      "Fixed tracking of the active song in long lists.",
    ],
  },
  "v0.1.0-alpha.5": {
    es: [
      "Controles reordenados: Atras, Play/Pause, Adelante, Aleatorio, Reproducir todo.",
      "Indicador 'PAUSA' mas visible (sobre la caratula) para saber que hay que reanudar.",
    ],
    en: [
      "Controls reordered: Previous, Play/Pause, Next, Shuffle, Play all.",
      "More visible 'PAUSE' indicator (over the cover) so you know playback is stopped.",
    ],
  },
  "v0.1.0-alpha.4": {
    es: [
      "Nuevo comprobador de URL del servidor: puntito verde/amarillo/rojo para evitar errores al configurar Navidrome.",
      "Bloqueo en caso de URL mal escrita: si el ping devuelve 404, no se guarda la URL.",
      "Modal de Novedades mejorado: ahora muestra las mejoras agrupadas por version/tag.",
      "Botones de modales con mejor feedback al pulsar.",
    ],
    en: [
      "New server URL checker: green/yellow/red dot to avoid mistakes when configuring Navidrome.",
      "Block on wrong URL: if ping returns 404, the URL is not saved.",
      "Improved What's New modal: shows changes grouped by version/tag.",
      "Modal buttons with better press feedback.",
    ],
  },
  "v0.1.0-alpha.3": {
    es: [
      "Nuevo selector de posicion de listas: ahora puedes cambiar entre Izq y Der.",
      "Nuevo ajuste de seguridad: 'Recordar credenciales' para decidir si guardar la contrasena.",
      "Nuevo modal de Novedades: aparece una vez por version y tambien se puede abrir manualmente.",
      "Cabecera de version: muestra version actual y avisa si hay una mas nueva disponible.",
      "Caratula por defecto unificada: si artistas, generos o listas no tienen portada, se usa music-player.svg.",
      "Layout por defecto actualizado: listas a la derecha y reproductor a la izquierda.",
    ],
    en: [
      "New list position selector: switch between Left and Right.",
      "New security setting: 'Remember credentials' to decide if password is saved.",
      "New What's New modal: appears once per version and can also be opened manually.",
      "Version header: shows current version and alerts if a newer one is available.",
      "Unified default cover: if artists/genres/lists have no cover, use music-player.svg.",
      "Updated default layout: lists on the right and player on the left.",
    ],
  },
};

function parseSemVer(raw) {
  const value = String(raw || "").trim();
  const match = /^v(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(value);
  if (!match) return null;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  const prerelease = match[4] || "";
  let preRank = 4;
  let preNum = 0;
  if (prerelease) {
    const preMatch = /^(alpha|beta|rc)(?:\.(\d+))?$/.exec(prerelease);
    if (!preMatch) return null;
    preRank = preMatch[1] === "alpha" ? 1 : preMatch[1] === "beta" ? 2 : 3;
    preNum = preMatch[2] ? Number(preMatch[2]) : 0;
  }
  return { raw: value, major, minor, patch, preRank, preNum };
}

function compareSemVer(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  if (a.preRank !== b.preRank) return a.preRank - b.preRank;
  return a.preNum - b.preNum;
}

export function getWhatsNewForVersion(version, language = "es") {
  if (!version) return [];
  const entry = WHATS_NEW_BY_VERSION[version];
  if (!entry) return [];
  if (Array.isArray(entry)) return entry;
  const lang = language === "en" ? "en" : "es";
  return entry[lang] || entry.es || entry.en || [];
}

export function getWhatsNewSections(currentVersion, language = "es") {
  const lang = language === "en" ? "en" : "es";
  const entries = [];
  for (const [version, items] of Object.entries(WHATS_NEW_BY_VERSION)) {
    const parsed = parseSemVer(version);
    if (!parsed) continue;
    let list = [];
    if (Array.isArray(items)) {
      list = items;
    } else if (items && typeof items === "object") {
      list = items[lang] || items.es || items.en || [];
    }
    entries.push({ version, parsed, items: Array.isArray(list) ? list : [] });
  }
  entries.sort((a, b) => compareSemVer(b.parsed, a.parsed));

  // Si la version actual no esta registrada, aun mostramos una seccion para no dejar el modal vacio.
  if (currentVersion && !WHATS_NEW_BY_VERSION[currentVersion]) {
    entries.unshift({
      version: currentVersion,
      parsed: null,
      items: [
        lang === "en"
          ? "No updates registered for this version."
          : "No hay novedades registradas para esta version.",
      ],
    });
  }

  return entries.map(({ version, items }) => ({ version, items }));
}
