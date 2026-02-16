// Regla de mantenimiento:
// Cada nueva funcionalidad visible para usuario debe quedar registrada aqui por version/tag.
// (Se actualiza normalmente al preparar el PR/release que entra en produccion.)
const WHATS_NEW_BY_VERSION = {
  "v1.0.0": [
    "Nueva versión mayor v1.0.0: rediseño completo de la app con enfoque estable para uso diario.",
    "Nuevo acceso por dispositivo: login adaptado para Car Unit y Desktop.",
    "Vinculación con otro dispositivo: puedes autorizar desde móvil con código sin escribir en pantalla del coche.",
    "Player mejorado en modo coche: controles más claros, mejor distribución y botones más cómodos.",
    "Gestión de usuarios/perfiles: cambio rápido de usuario y acceso directo a perfiles guardados desde login.",
    "Tema visual avanzado: modos Día, Noche y Auto con mejor contraste y legibilidad.",
    "Mejoras de progreso y reproducción: barra de reproducción más visible y comportamiento más consistente.",
    "PWA preparada para instalación: experiencia más cercana a app nativa en pantalla completa.",
    "Base técnica V1 actualizada para estabilidad y evolución futura (incluye broker y estructura modular).",
  ],
  "v0.1.0-alpha.6": [
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
  "v0.1.0-alpha.5": [
    "Controles reordenados: Atras, Play/Pause, Adelante, Aleatorio, Reproducir todo.",
    "Indicador 'PAUSA' mas visible (sobre la caratula) para saber que hay que reanudar.",
  ],
  "v0.1.0-alpha.4": [
    "Nuevo comprobador de URL del servidor: puntito verde/amarillo/rojo para evitar errores al configurar Navidrome.",
    "Bloqueo en caso de URL mal escrita: si el ping devuelve 404, no se guarda la URL.",
    "Modal de Novedades mejorado: ahora muestra las mejoras agrupadas por version/tag.",
    "Botones de modales con mejor feedback al pulsar.",
  ],
  "v0.1.0-alpha.3": [
    "Nuevo selector de posicion de listas: ahora puedes cambiar entre Izq y Der.",
    "Nuevo ajuste de seguridad: 'Recordar credenciales' para decidir si guardar la contrasena.",
    "Nuevo modal de Novedades: aparece una vez por version y tambien se puede abrir manualmente.",
    "Cabecera de version: muestra version actual y avisa si hay una mas nueva disponible.",
    "Caratula por defecto unificada: si artistas, generos o listas no tienen portada, se usa music-player.svg.",
    "Layout por defecto actualizado: listas a la derecha y reproductor a la izquierda.",
  ],
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

export function getWhatsNewForVersion(version) {
  if (!version) return [];
  return WHATS_NEW_BY_VERSION[version] || [];
}

export function getWhatsNewSections(currentVersion) {
  const entries = [];
  for (const [version, items] of Object.entries(WHATS_NEW_BY_VERSION)) {
    const parsed = parseSemVer(version);
    if (!parsed) continue;
    entries.push({ version, parsed, items: Array.isArray(items) ? items : [] });
  }
  entries.sort((a, b) => compareSemVer(b.parsed, a.parsed));

  // Si la version actual no esta registrada, aun mostramos una seccion para no dejar el modal vacio.
  if (currentVersion && !WHATS_NEW_BY_VERSION[currentVersion]) {
    entries.unshift({
      version: currentVersion,
      parsed: null,
      items: ["No hay novedades registradas para esta version."],
    });
  }

  return entries.map(({ version, items }) => ({ version, items }));
}
