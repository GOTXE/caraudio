// Regla de mantenimiento:
// Cada nueva funcionalidad visible para usuario debe quedar registrada aqui por version.
const WHATS_NEW_BY_VERSION = {
  "v0.1.0-alpha.3": [
    "Nuevo selector de posicion de listas: ahora puedes cambiar entre Izq y Der.",
    "Nuevo ajuste de seguridad: 'Recordar credenciales' para decidir si guardar la contrasena.",
    "Nuevo modal de Novedades: aparece una vez por version y tambien se puede abrir manualmente.",
    "Cabecera de version: muestra version actual y avisa si hay una mas nueva disponible.",
    "Caratula por defecto unificada: si artistas, generos o listas no tienen portada, se usa music-player.svg.",
    "Layout por defecto actualizado: listas a la derecha y reproductor a la izquierda.",
  ],
};

export function getWhatsNewForVersion(version) {
  if (!version) return [];
  return WHATS_NEW_BY_VERSION[version] || [];
}
