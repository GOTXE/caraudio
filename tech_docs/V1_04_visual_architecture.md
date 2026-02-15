# WEB_updt_MUSIC — Arquitectura Visual & Design System
Versión: 1.0  
Objetivo: Definir una arquitectura visual completa y coherente antes de implementar nueva lógica (Device Auth, Broker, etc.).  
Alcance: Frontend PWA multidispositivo con 2 plantillas base (Car Unit 1280x480 y Desktop 1920x1080). Tablet deriva de Desktop.

---

# 1. Principios de Diseño

## 1.1 Prioridades del producto
1. Usabilidad extrema en Car Unit (pantalla baja + teclado invasivo).
2. Coherencia visual en todos los dispositivos.
3. Alto contraste y legibilidad.
4. Bajo peso y bajo consumo de recursos.
5. Escalabilidad futura (biblioteca, playlists, búsqueda, etc.).

## 1.2 Reglas estratégicas
- Una sola codebase.
- Layout adaptativo basado en 2 plantillas canónicas (Car + Desktop).
- Cero colores hardcodeados.
- Cero tamaños mágicos fuera de la escala definida.
- Estados visuales explícitos (default, hover, active, focus, error, disabled).

---

# 2. Plantillas base

Fuente canónica:
- `tech_docs/V1_99_pencil_webs.pen`
- `Login Car Unit 1280x480`
- `Login Desktop 1920x1080`
- `Player Car Unit 1280x480` (pendiente crear)
- `Player Desktop 1920x1080` (pendiente crear)

## 2.1 Car Unit (Compact)
Activación:
- Altura <= 520px O
- Modo forzado “Coche”

Características:
- Dominancia horizontal.
- Formularios en filas dobles (usuario + contraseña en misma fila).
- Header compacto (máx. 72px).
- Eliminación de elementos secundarios cuando teclado abierto.
- Botones mínimo 40px altura.
- Máximo 2 niveles jerárquicos visibles.

## 2.2 Desktop (Wide base)
- Anchura máxima de contenido (ej: 1200px).
- Componentes centrados.
- Mayor espacio en blanco.
- Soporte de hover real.

## 2.3 Tablet (derivado)
- Reutiliza la plantilla Desktop.
- Ajustes responsive de espaciado y densidad.

---

# 3. Design Tokens

## 3.1 Colores Base

Definir en CSS variables:

--color-bg-primary
--color-bg-surface
--color-bg-elevated
--color-accent
--color-accent-hover
--color-danger
--color-success
--color-text-primary
--color-text-secondary
--color-border

### Reglas
- Modo Car: contraste AA mínimo (ideal AAA).
- Evitar acentos saturados extremos.
- Error siempre perceptible sin depender solo del color (icono o borde).

---

## 3.2 Espaciado (escala fija)

space-1 = 4px  
space-2 = 8px  
space-3 = 12px  
space-4 = 16px  
space-5 = 24px  
space-6 = 32px  
space-7 = 48px  

Regla:
- No usar valores fuera de esta escala.

---

## 3.3 Tipografía

Escala:
- text-xs
- text-sm
- text-base
- text-lg
- text-xl
- text-2xl

Modo Car:
- mínimo 14px reales.
- evitar texto secundario innecesario.

---

# 4. Component Architecture

## 4.1 Button
Estados:
- default
- hover
- active
- focus
- disabled

Tipos:
- primary
- secondary
- danger
- ghost

Modo Car:
- ancho completo por defecto.
- alto mínimo 40px.

---

## 4.2 Input
Estados:
- default
- focus (borde claro)
- error (borde + mensaje)
- disabled

Modo Car:
- label compacto o inline.
- alto mínimo táctil.

---

## 4.3 Card
- padding según perfil.
- elevación ligera en desktop.
- plana en car (menos sombras).

---

## 4.4 Modal
- Fondo con overlay.
- Cierre claro.
- Nunca más de 2 acciones primarias.

---

# 5. Login Screen Architecture

## 5.1 Desktop/Tablet
Columna vertical:
- Header
- Card login
- Footer opcional

## 5.2 Car Unit
- Header compacto.
- Usuario + contraseña en misma fila.
- Botón conectar ancho completo.
- Checkbox recordar compacto.
- Sin texto “Esperando…” permanente.

## 5.3 Teclado abierto
- Ocultar subtítulo.
- Ocultar novedades.
- Garantizar visibilidad inputs + botón.

---

# 6. Motion Guidelines

- Transiciones 150–200ms.
- Nada de animaciones simultáneas complejas.
- Sin animaciones distractoras.
- Evitar delays artificiales.

---

# 7. i18n Impacto en UI

- Todo texto debe soportar expansión 30% mayor.
- Botones deben admitir textos más largos en inglés.
- No usar ancho fijo en botones.

---

# 8. PWA Consideraciones Visuales

- Iconos adaptativos.
- Splash minimalista.
- Sin dependencias visuales externas pesadas.

---

# 9. Accesibilidad

- Contraste mínimo WCAG AA.
- Focus visible siempre.
- Inputs etiquetados correctamente.
- No depender solo del color para estados.

---

# 10. Checklist de Implementación para Codex

- [ ] Implementar tokens de diseño.
- [ ] Refactor CSS actual a variables.
- [ ] Implementar 2 plantillas base (Car + Desktop) y reglas responsive para Tablet.
- [ ] Refactor Login según perfil.
- [ ] Documentar reglas en tech_docs/V1_05_design_system.md.
- [ ] Validar contraste.
- [ ] Validar expansión i18n.
- [ ] Validar comportamiento con teclado.

---

# Definición de Done

- UI consistente en todos los perfiles.
- Modo Car no parece parche.
- Componentes reutilizables.
- No hay colores ni tamaños hardcodeados.
- Documentación técnica completa.
