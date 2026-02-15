# CLAUDE_MASTER_PROMPT.md
WEB_updt_MUSIC v1.0.0 — Ejecución Controlada por Fases

## Contexto
Debes implementar el plan definido en:
- tech_docs/V1_01_master_plan.md
- tech_docs/V1_04_visual_architecture.md

## Reglas Obligatorias

1. Crear y usar rama:
   develop_device_auth_pwa_v1

2. No trabajar en main.
3. Un commit por hito o subhito.
4. Sin tests no se considera completado.
5. Mantener tech_docs actualizados:
   - V1_02_roadmap.md
   - V1_05_design_system.md
   - V1_07_security.md
   - V1_06_device_auth_flow.md
   - V1_09_test_plan.md
   - V1_10_tech_debt.md (si aplica)
6. No hardcodear colores ni strings visibles.
7. No imprimir credenciales ni tokens en logs.
8. Priorizar rendimiento en car unit.

---

# PASO INICIAL OBLIGATORIO

1. Crear rama develop_device_auth_pwa_v1.
2. Generar tech_docs/V1_02_roadmap.md con checklist Fase 0 → 5.
3. Hacer inventario del repo actual:
   - estructura
   - módulos
   - storage keys
   - login actual
4. Proponer limpieza (ej: eliminar “Esperando…” fijo).

Reportar antes de avanzar.

---

# DEFINICIÓN DE DONE GLOBAL

- Arquitectura visual consolidada
- Layout Compact funcional 1280x480
- i18n ES/EN completo
- PWA instalable
- Device Authorization Flow con broker FastAPI
- Refresh token rotativo y revocable
- Logout y olvidar dispositivo
- Tests backend y frontend pasando
- Documentación técnica completa
