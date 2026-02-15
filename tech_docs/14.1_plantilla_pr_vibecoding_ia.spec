# 14.1 Plantilla de Pull Request (IA)
# Plantilla oficial para generar resúmenes estructurados de PR con IA en Vibe Coding

id: 14.1_plantilla_pr_vibecoding
objetivo: Generar descripciones de PR consistentes y auditables usando IA sin cambiar la estructura.
uso: Copia este archivo al prompt junto con el diff o los commits antes de abrir un PR.

reglas:
- No modifiques títulos, numeración ni orden.
- No añadas ni elimines secciones.
- No uses emojis.
- No inventes nada fuera del diff/commits.
- Resumen ejecutivo máximo 4 líneas.
- Si algo no aplica, escribe `No aplica`.
- Marca áreas según archivos modificados.

areas:
- Core / lógica
- Core / seguridad
- Core / validación
- Core / configuración
- Core / logging
- Web / templates
- Web / API
- Web / UI
- CLI / herramientas internas
- Base de datos / migraciones
- Infra / CI-CD
- Tests
- Documentación

plantilla_pr:

### 0. Resumen ejecutivo
(Descripción breve del propósito principal del PR. Máximo 4 líneas.)

---

### 1. Tipo de cambio
- [ ] Nueva funcionalidad
- [ ] Mejora de funcionalidad existente
- [ ] Bugfix
- [ ] Endurecimiento de seguridad / validación
- [ ] Refactor interno
- [ ] Documentación

(Marca los que apliquen.)

---

### 2. Alcance del PR
Áreas afectadas:
- [ ] Core / lógica
- [ ] Core / seguridad
- [ ] Core / validación
- [ ] Core / configuración
- [ ] Core / logging
- [ ] Web / templates
- [ ] Web / API
- [ ] Web / UI
- [ ] CLI
- [ ] Base de datos / migraciones
- [ ] Infra / CI-CD
- [ ] Tests
- [ ] Documentación

Indica de forma concisa el alcance general del cambio.

---

### 3. Cambios principales (por área)

#### 3.x Área relevante 1
(Listado de cambios concretos y verificables. Sin especulación.)

#### 3.x Área relevante 2
(Listado de cambios concretos.)

(Añadir tantas subsecciones como áreas marcadas en la sección 2.)

---

### 4. Impacto y compatibilidad
(Explicar si afecta API pública, flujos, migraciones, comportamiento previo, etc.)

---

### 5. Cómo probarlo
(Pasos claros y reproducibles para el revisor.)

1.
2.
3.

---

### 6. Riesgos y puntos a revisar
(Lista de riesgos reales derivados del diff. No inventar riesgos inexistentes.)

-
-

---

### 7. Notas adicionales
(Cualquier información relevante para mantenimiento futuro, integración o auditoría.)

---
