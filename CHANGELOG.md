# Changelog

Formato inspirado en "Keep a Changelog". Este proyecto sigue SemVer en `0.x` con tags `vX.Y.Z-(alpha|beta|rc).N`.

## [Unreleased]
- Nuevo panel de ajustes con tema, posicion de panel y cambio de usuario.
- Tema con tres modos: Dia, Noche y Auto.
- Modo Auto configurable por zona horaria IANA y ciudad opcional de referencia para orto/ocaso.
- Filtro de canciones Favoritas (usuario actual) con accion de marcado desde la reproduccion.
- Filtro de canciones Mas reproducidas (usuario actual) basado en playCount.
- Reproducciones de esta app reportadas a Navidrome via scrobble.
- Portadas optimizadas para carga mas rapida (listas/modales y reproductor).
- Correccion: en colas largas, la cancion activa se mantiene visible con auto-scroll.
- Ajustes de UI: escoba sobre el filtro, tiempos encima de progreso y retirada del boton Salir.
- Rebranding de interfaz a \"Music Skin ND\".
- Migracion de preferencias legacy: al actualizar, se mantienen tema y perfiles del usuario.

## [v0.1.0-alpha.5] - 2026-02-06
- Reorden de controles: Atras, Play/Pause, Adelante, Aleatorio, Reproducir todo.
- Indicador "PAUSA" sobre la caratula cuando esta en pausa.

## [v0.1.0-alpha.4] - 2026-02-06
- Modal "Servidor Navidrome": indicador visual (verde/amarillo/rojo) para comprobar la URL antes de guardarla.
- Deteccion de URL mal escrita: si `ping` devuelve `404` no se permite guardar (evita errores tipicos de subruta/dominio).
- Modal "Novedades": mejoras agrupadas por version/tag.
- Botones de modales con mas feedback al pulsar (sensacion de hundimiento).

## [v0.1.0-alpha.3] - 2026-02-06
- Nuevo modal de novedades para usuario final con apertura automatica una vez por version.
- Titulo en modal: "Mejoras en v..." y contenido explicado en lenguaje de uso.
- Estilo del modal con perimetro de luz difusa y scroll sin barra visible.
- Nuevo boton "Novedades" en cabecera para abrir el modal manualmente.
- Caratula fallback con `music-player.svg` tambien para artistas, generos y listas sin portada.
- Posicion por defecto del layout actualizada: listas a la derecha y reproductor a la izquierda.

## [v0.1.0-alpha.2] - 2026-02-06
- Muestra la version actual en el header y avisa si hay un tag mas nuevo disponible (badge con brillo).
- README: badge con el tag actual.

## [v0.1.0-alpha.1] - 2026-02-06
- Primer tag publico para pruebas.
- Caratula por defecto para evitar icono de imagen rota.
