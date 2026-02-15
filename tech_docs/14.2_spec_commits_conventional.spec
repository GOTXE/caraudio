# 14.2 Spec de Commits (Conventional)
# Especificacion reutilizable de mensajes de commit para proyectos open source

id: 14.2_spec_commits_conventional
objetivo: Mensajes de commit consistentes, auditables y mapeables a SemVer/CHANGELOG.
uso: Aplica a todos los commits en ramas y PRs.

formato:
- <type>(<scope>): <resumen>
- Resumen en imperativo, sin punto final, max 72 caracteres.
- Idioma: ES (preferido) o EN, pero consistente dentro del PR.

types_permitidos:
- feat: nueva funcionalidad (user-facing)
- fix: correccion de bug (user-facing)
- perf: mejora de rendimiento (user-facing o interna)
- refactor: refactor interno sin cambio funcional
- docs: documentacion
- test: tests
- build: build/deps/tooling
- ci: pipelines
- chore: mantenimiento (no user-facing)
- revert: revert de commit

scopes_permitidos (orientativo, adapta segun evolucione el repo):
- web
- ui
- player
- navidrome
- storage
- assets
- docs
- tech_docs

breaking_changes:
- Si rompe compatibilidad, usar footer:
  BREAKING CHANGE: <detalle>
- En fase 0.x, breaking => bump MINOR (ver tech_docs/14.5versionado_semver.md).

reglas:
- No emojis.
- No "WIP" en commits a main.
- Un commit = un tema (evitar mezclar refactor + feature en el mismo commit).
- Si un cambio es user-facing:
  - actualizar CHANGELOG.md (seccion [Unreleased])
  - actualizar assets/js/modules/whats-new.js (novedades por version)

ejemplos_validos:
- feat(ui): add whats-new modal
- fix(player): fallback cover when missing art
- refactor(storage): centralize localStorage keys
- docs(tech_docs): document commit convention
- chore(assets): move static files into assets folder

ejemplos_invalidos:
- "update"
- "fix stuff"
- "WIP: trying things"
