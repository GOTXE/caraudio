# CLAUDE_SECURITY_CHECKLIST.md
WEB_updt_MUSIC v1 — Security Audit Checklist (Obligatorio antes de cerrar Fase 4 y 5)

---

# OBJETIVO

Forzar una revisión de seguridad estructurada antes de:

- Dar por finalizada la Fase 4 (Broker FastAPI)
- Integrar completamente en Fase 5
- Considerar el sistema listo para uso real

Sin este checklist completo, NO se puede considerar Done.

---

# 1. DEVICE AUTH FLOW — VALIDACIÓN CRÍTICA

## 1.1 user_code

- [ ] Formato XXXX-XXXX
- [ ] Alfabeto sin caracteres ambiguos (0/O, 1/I, etc.)
- [ ] TTL exactamente 5 minutos
- [ ] One-time use (no reutilizable)
- [ ] Almacenado como hash (nunca en claro)
- [ ] Eliminado automáticamente tras expiración o uso
- [ ] Rate limit en verify (anti brute-force)

Test obligatorio:
- Intentar usar mismo code 2 veces → debe fallar.
- Intentar code expirado → debe fallar.
- Intentar múltiples códigos erróneos → bloqueado temporalmente.

---

# 2. POLLING (CAR UNIT)

- [ ] Backoff implementado (no polling agresivo constante)
- [ ] Límite de frecuencia por device_code
- [ ] No revela información sensible en estado pending
- [ ] device_code no visible en frontend

Test:
- Simular polling continuo → verificar límite aplicado.

---

# 3. TOKENS

## 3.1 Access Token

- [ ] TTL corto (ej. 15 min)
- [ ] No almacenado en logs
- [ ] No expuesto en errores

## 3.2 Refresh Token

- [ ] Rotación obligatoria en cada uso
- [ ] Hash almacenado (no texto plano)
- [ ] Asociado a dispositivo
- [ ] Revocable individualmente
- [ ] Revocado elimina acceso inmediatamente

Test:
- Usar refresh antiguo tras rotación → debe fallar.
- Revocar token → acceso bloqueado.

---

# 4. CORS Y ORIGEN

- [ ] CORS limitado al propio dominio
- [ ] No usar '*' en producción
- [ ] Métodos permitidos explícitos

---

# 5. RATE LIMITING

- [ ] Límite en verify
- [ ] Límite en start device
- [ ] Límite en polling
- [ ] Respuesta clara sin filtrar detalles internos

---

# 6. FRONTEND STORAGE

- [ ] No imprimir tokens en consola
- [ ] Logout limpia completamente storage
- [ ] Olvidar dispositivo llama a revoke backend
- [ ] No hay strings sensibles en localStorage innecesarios

Test manual:
- Inspeccionar localStorage tras logout → vacío relevante.

---

# 7. LOGGING

- [ ] No loggear passwords
- [ ] No loggear refresh tokens
- [ ] No loggear access tokens
- [ ] Logs solo informativos (auth success, revoked, expired)

---

# 8. ERRORES Y MENSAJES

- [ ] Errores no revelan si usuario existe
- [ ] Mensajes genéricos en verify
- [ ] No stack traces expuestos en producción

---

# 9. PRUEBAS DE CAOS

Simular:

- [ ] Red interrumpida durante polling
- [ ] Cambio de hora del sistema
- [ ] Reinicio backend durante proceso
- [ ] Ataque brute-force simple

Documentar resultados en:
tech_docs/security_test_report.md

---

# 10. DEFINICIÓN DE APROBACIÓN FINAL

Solo se puede marcar Fase 4 y 5 como completas si:

- Todos los tests automatizados pasan
- Todos los ítems del checklist están marcados
- security_test_report.md existe
- No hay tokens ni credenciales visibles en logs

---

FIN DEL DOCUMENTO
