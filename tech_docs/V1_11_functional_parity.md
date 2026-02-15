# V1 Functional Parity (Baseline v0.1.0-alpha.6)

## Objetivo

Evitar regresiones funcionales al migrar a V1.

Regla:
- El dominio de login/auth puede cambiar.
- El dominio de player debe conservar comportamiento funcional equivalente al baseline `v0.1.0-alpha.6`.

## Alcance

Incluye:
- Tema y personalización visual en runtime.
- Gestión de perfiles y sesión local.
- Navegación musical y reproducción.
- Acciones sobre canciones (favoritas/most played/scrobble).
- Disposición visual operativa del player.

No incluye:
- Mantener implementación interna exacta (solo comportamiento observable).

## Referencias

- Baseline funcional: app actual `v0.1.0-alpha.6`.
- Plan V1: `tech_docs/V1_01_master_plan.md`.
- Arquitectura V1: `tech_docs/V1_03_architecture.md`.
- Test plan V1: `tech_docs/V1_09_test_plan.md`.

## Checklist de Paridad (obligatorio)

### 1) Tema y ajustes

- [ ] Tema `día` funciona.
- [ ] Tema `noche` funciona.
- [ ] Tema `auto` funciona por zona horaria y tramos configurables.
- [ ] Persistencia de `themeMode` y configuración auto.
- [ ] Menú de ajustes accesible desde player.

### 2) Perfiles y sesión local

- [ ] Cambio de usuario/perfil operativo.
- [ ] Perfil activo persistente.
- [ ] Autoconexión cuando hay credenciales recordadas.
- [ ] Migración/compatibilidad de claves legacy de perfiles.

### 3) Catálogo y navegación

- [ ] Vistas de Artistas/Géneros/Álbumes/Listas operativas.
- [ ] Filtro por texto operativo en vistas.
- [ ] Apertura de álbumes y listas desde catálogo.

### 4) Reproducción y cola

- [ ] `play/pause`, `prev/next`, `seek` operativos.
- [ ] Cola de reproducción operativa.
- [ ] `shuffle/aleatorio` operativo.
- [ ] `reproducir todo` operativo.
- [ ] Modal de canciones de cola operativo.

### 5) Funciones musicales

- [ ] Favoritas (`star/unstar`) operativas y reflejadas en UI.
- [ ] Más reproducidas operativo (incluye cache local).
- [ ] Scrobble now-playing y submission operativos.

### 6) Disposición y UX del player

- [ ] Disposición del player usable en Car Unit.
- [ ] Disposición del player usable en Desktop.
- [ ] Conmutación de lado de panel de listas operativa.
- [ ] Modales de player (álbumes/canciones/ajustes/novedades) operativos.

### 7) Medios y fallbacks

- [ ] Portadas cargan correctamente en listas y now playing.
- [ ] Fallback de portada (`music-player.svg`) operativo en errores.

## Criterio de aprobación

- Solo se considera V1 lista si todos los puntos marcados arriba están validados.
- Cualquier regresión obliga rollback del cambio o fix antes de avanzar de fase.
