# Design System v1

## Design Tokens

Colores obligatorios:
- `--color-bg-primary`
- `--color-bg-surface`
- `--color-bg-elevated`
- `--color-accent`
- `--color-accent-hover`
- `--color-danger`
- `--color-success`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-border`

Escala de espaciado:
- `--space-1` (4px) hasta `--space-7` (48px)

Escala tipográfica:
- `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`

## Layout Profiles

- Fuente visual canónica: `tech_docs/V1_99_pencil_webs.pen`
- `compact`: plantilla Car Unit 1280x480 (header compacto, login en fila doble, botones >= 40px)
- `wide`: plantilla Desktop 1920x1080 (ancho máximo 1200px)
- `tablet`: derivado responsive de `wide` (no plantilla separada en V1)

## Layout Baseline de Player

- Definir y mantener en Pencil:
- `Player Car Unit 1280x480`
- `Player Desktop 1920x1080`
- Regla: el layout del player no se simplifica en V1; se preserva paridad funcional de `v0.1.0-alpha.6`.

## Branding y Logo por Dispositivo

- Regla de V1:
- `logo B` para `Car Unit` (pantallas compactas).
- `logo A` para `Desktop` y `Tablet`.
- Posición del logo: esquina superior izquierda de cada plantilla.
- El logo se usa en PNG transparente (sin recuadro/fondo visible).
- La versión de la app se muestra centrada en el ancho de la página.
- Sustitución: el logo reemplaza títulos de cabecera (no bloque funcional de player/login).

Implementación aplicada en `tech_docs/V1_99_pencil_webs.pen`:
- `Login Car Unit 1280x480` -> logo `B`.
- `Login Car Unit 1280x480 (Keyboard Open)` -> logo `B`.
- `Player Car Unit 1280x480` -> logo `B`.
- `Login Desktop 1920x1080` -> logo `A`.
- `Player Desktop 1920x1080` -> logo `A`.

## Footer Global (No Player)

- Ventanas afectadas: login, modales y pantallas móviles (excepto player).
- Estructura:
- Línea 1: `GOTXE ❤️ IA 🤖`
- Línea 2 (izquierda): icono GitHub + `https://github.com/gotxe`
- Línea 2 (derecha): `vX.Y.Z` + indicador update + versión update.
- En vistas `Player` la versión/update permanece en cabecera superior.

Assets oficiales GitHub (día/noche):
- Día: `tech_docs/images/github-mark-day.png`
- Noche: `tech_docs/images/github-mark-night.png`

## Componentes

- `Button`: `default`, `hover`, `active`, `focus`, `disabled`
- `Input`: `default`, `focus`, `error`, `disabled`
- `Modal`: overlay con acciones primarias acotadas
- `Card`: contenedor principal de bloques de login/player/link

## Player Lists (Car/Desktop)

- Todos los ítems de listas (canciones, artistas, álbumes, listas) usan tamaño uniforme por vista.
- No se permite ancho/alto dependiente del texto del ítem.
- Scroll permitido funcionalmente, pero barra de scroll no visible en UI final.

## Accesibilidad

- Contraste AA en combinaciones base.
- Focus visible en inputs y botones.
- Estados no dependen solo de color.
- UI preparada para expansión de texto (ES/EN).
