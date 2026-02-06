// Regla de mantenimiento:
// Cada nueva funcionalidad visible para usuario debe quedar registrada aqui por version.
const WHATS_NEW_BY_VERSION = {
  "v0.1.0-alpha.2": [
    "Nuevo selector de posicion de listas: ahora puedes cambiar entre Izq y Der.",
    "Nuevo ajuste de seguridad: 'Recordar credenciales' para decidir si guardar la contrasena.",
    "Cabecera de version mejorada: muestra version actual y aviso de nueva version cuando existe.",
    "Nuevo boton 'Novedades' junto a la version para abrir este modal manualmente cuando quieras.",
    "Caratula por defecto unificada: si artistas, generos o listas no tienen portada, se usa music-player.svg.",
    "Layout por defecto actualizado: listas a la derecha y reproductor a la izquierda.",
  ],
};

export function getWhatsNewForVersion(version) {
  if (!version) return [];
  return WHATS_NEW_BY_VERSION[version] || [];
}
