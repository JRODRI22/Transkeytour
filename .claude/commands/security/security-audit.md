# /security-audit — Auditoría OWASP Top 10

Ejecuta una revisión de seguridad completa del código del proyecto contra el OWASP Top 10.

## Qué hace este comando

1. Lee el código fuente de Controllers, Services, Program.cs y api.js
2. Evalúa cada ítem del OWASP Top 10 contra el código actual
3. Genera un reporte `docs/SECURITY_AUDIT.md` con hallazgos y acciones requeridas

## Cómo usar

```
/security-audit
/security-audit --scope backend
/security-audit --scope frontend
/security-audit --file Controllers/ClienteController.cs
```

## Checklist OWASP Top 10 (evaluado automáticamente)

| # | Riesgo | Qué revisar en este stack |
|---|--------|--------------------------|
| A01 | Broken Access Control | `[Authorize]` en controllers, roles en endpoints sensibles |
| A02 | Cryptographic Failures | BCrypt en passwords, HTTPS config, JWT secret ≥32 chars |
| A03 | Injection | EF Core (no SQL crudo), inputs validados, XSS en React |
| A04 | Insecure Design | Lógica de negocio en Services (no Controllers) |
| A05 | Security Misconfiguration | CORS no `*`, env vars no hardcodeadas |
| A06 | Vulnerable Components | Versiones de NuGet/npm con CVEs conocidos |
| A07 | Auth Failures | JWT expiry configurado, refresh tokens, logout implementado |
| A08 | Data Integrity Failures | Validación de DTOs con DataAnnotations o FluentValidation |
| A09 | Logging Failures | Logs sin datos sensibles (passwords, tokens) |
| A10 | SSRF | Validación de URLs en llamadas HTTP externas |

## Output esperado

Archivo `docs/SECURITY_AUDIT.md` con:
- Fecha de auditoría
- Estado por ítem: ✅ Cumple / ⚠️ Riesgo medio / 🔴 Riesgo crítico
- Para cada fallo: descripción + archivo + línea + acción correctiva
