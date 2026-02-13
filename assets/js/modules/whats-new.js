// Regla de mantenimiento:
// Cada nueva funcionalidad visible para usuario debe quedar registrada aqui por version/tag.
// (Se actualiza normalmente al preparar el PR/release que entra en produccion.)
const WHATS_NEW_BY_VERSION = {
  "v0.1.0-alpha.6": [
    "Interfaz: rebranding a Music Skin ND y cabecera renovada con acceso a Novedades.",
    "Ajustes: menu hamburguesa con tema (Dia, Noche, Auto), panel de listas y cambio de usuario.",
    "Tema Auto: configuracion simplificada por zona horaria y horario Dia/Noche (sin ciudad), con migracion de ajustes antiguos.",
    "Login: el menu de ajustes ya no se muestra en la pantalla de acceso.",
    "Reproduccion: acciones rapidas de Mas reproducidas y Favoritas en el panel del reproductor.",
    "Reproduccion: Favoritas y Mas reproducidas arrancan siempre en aleatorio.",
    "Favorita actual: nuevo boton de corazon flotante junto a la portada (relleno cuando es favorita).",
    "Listados: las acciones rapidas ya no alteran el contenido del panel lateral (solo mandan en reproduccion).",
    "Portadas: carga optimizada, fallback propio de la UI y reintentos automaticos si la portada tarda en aparecer.",
    "Rendimiento: cache en memoria para portadas y mejora de tiempos en listas/modales.",
    "Cola: correccion de resaltado/auto-scroll para mantener visible la cancion en listas largas.",
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
