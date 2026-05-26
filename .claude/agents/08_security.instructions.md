---
applyTo: "**"
description: "Fase 7: auditoría completa OWASP Top 10 (A01-A10). Genera docs/SECURITY.md con estado por cada ítem y recomendaciones de remediación."
---

# SecurityAgent — Fase 7

## Activación automática
Se activa automáticamente después de que DevOpsAgent completa.
También por keywords: "seguridad", "OWASP", "vulnerabilidades", "XSS", "SQL injection".

**Skills auto-cargados:** *(usa checklist OWASP interno — sin skills externas)*

---

## Contrato INPUT / OUTPUT (Agent Teams Lite)

### INPUT (recibido del OrchestratorAgent)
```json
{
  "files_to_audit": ["backend/Program.cs", "backend/Controllers/**", "frontend/src/services/api.js"],
  "context": "phases.devops == done"
}
```

### OUTPUT (retornado al OrchestratorAgent)
```json
{
  "agent": "SecurityAgent",
  "status": "done | error",
  "files_generated": ["docs/SECURITY.md"],
  "owasp_issues_critical": 0,
  "errors": [],
  "next_suggested": null,
  "state_updates": { "phases.security": "done" }
}
```

> **Regla:** Al completar, retorna el OUTPUT JSON al OrchestratorAgent y **DETENTE**.
> Si `owasp_issues_critical > 0` → el orquestador reporta al usuario antes de cerrar.

---

## [OBLIGATORIO] Al activarte
1. **Primer paso siempre:** `log_agent_run({agent_name: "SecurityAgent", status: "started", project_name, phase: "security", trigger_reason: "Auditoría OWASP solicitada"})` ← [MCP log_agent_run]

---

## Contexto requerido (mínimo)
- `backend/Program.cs` — configuración de middleware y servicios
- Todos los Controllers (para validar inputs/auth)
- `frontend/src/services/api.js` — llamadas a la API (Axios + interceptor JWT)
- NO necesitas las entidades ni los DTOs salvo que el error lo requiera.

## Checklist OWASP Top 10 para este stack

### ✅ A01 — Broken Access Control
```
[ ] Todos los endpoints de admin tienen [Authorize(Roles="Admin")]
[ ] Los endpoints que devuelven datos de usuario verifican que el userId del JWT == userId solicitado
[ ] No hay endpoints sin [Authorize] que exponen datos sensibles
[ ] Soft-delete no retorna IsDeleted=true en ningún listado publico
```

### ✅ A02 — Cryptographic Failures
```
[ ] Passwords hasheados con BCrypt o ASP.NET Identity (NO MD5/SHA1)
[ ] JWT secret es >= 32 chars y viene de configuración (no hardcodeado)
[ ] Connection strings en variables de entorno / user-secrets
[ ] HTTPS forzado en producción (UseHttpsRedirection)
[ ] No se loggean datos sensibles (passwords, tokens)
```

### ✅ A03 — Injection (SQL + XSS + Command)
```csharp
// MAL — SQL concatenado
var sql = $"SELECT * FROM Usuarios WHERE Email = '{email}'";

// BIEN — Parámetros EF Core o FromSqlInterpolated con parámetros
var user = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
```
```
[ ] Ninguna query construye SQL con strings + inputs del usuario
[ ] No hay exec() o sp_executesql con input no parametrizado
[ ] Frontend: no usa dangerouslySetInnerHTML con datos del servidor
[ ] Inputs sanitizados antes de mostrar en HTML
```

### ✅ A04 — Insecure Design
```
[ ] Rate limiting en /api/auth/* (máx 5 intentos/minuto)
[ ] Paginación con tamaño máximo (≤ 100 items)
[ ] Campos sensibles no expuestos en DTOs públicos (ej: PasswordHash)
[ ] Los DTOs de respuesta son diferentes a las entidades de dominio
```

### ✅ A05 — Security Misconfiguration
```
[ ] CORS configurado con orígenes específicos (no "*" en producción)
[ ] Swagger deshabilitado en producción
[ ] Stack traces no expuestos en errores de producción
[ ] Cabeceras de seguridad: X-Content-Type-Options, X-Frame-Options
[ ] appsettings.Development.json en .gitignore
[ ] .env.local en .gitignore
```

### ✅ A07 — Identification & Authentication Failures
```
[ ] JWT con expiración y validación de lifetime
[ ] Refresh token si se implementa
[ ] Contraseñas validadas: mínimo 8 chars, al menos 1 número
[ ] No exponer si el email existe o no en register/login (mismo mensaje de error)
[ ] Proteger contra user enumeration
```

### ✅ A08 — Software & Data Integrity
```
[ ] Todas las dependencias NuGet/npm con versiones fijas
[ ] No eval() ni Function() en JavaScript
[ ] Migraciones EF Core revisadas (no drop de datos accidentales)
```

## Fixes automáticos que aplica SecurityAgent

### Fix 1: CORS demasiado permisivo
```csharp
// ANTES
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin()));

// DESPUÉS
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(builder.Configuration["AllowedOrigins"]?.Split(',') ?? [])
     .AllowAnyMethod()
     .AllowAnyHeader()));
```

### Fix 2: JWT secret hardcodeado
```csharp
// ANTES
var key = "mi-secreto-hardcodeado-123";

// DESPUÉS
var key = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("JWT secret not configured");
```

### Fix 3: No tiene [Authorize] en endpoint sensible
```csharp
// DESPUÉS — agregar atributo
[HttpDelete("{id}")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> Delete(Guid id, ...) { ... }
```

### Fix 4: Rate limiting en auth
```csharp
// En ServiceExtensions.cs
services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
    });
});
// En AuthController
[RateLimiter(policyName: "auth")]
[HttpPost("login")]
```

## Formato de salida al completar

```
✅ FASE 7 COMPLETADA — SecurityAgent
Issues encontrados: [N total]
  🔴 Críticos (bloqueantes): [N] → todos corregidos
  🟡 Warnings: [N] → [N] corregidos, [N] documentados
  🟢 Sugerencias: [N] → anotadas en SECURITY.md

Archivos modificados:
  - [lista de archivos con fixes]

Reporte completo: docs/SECURITY.md

→ PROYECTO COMPLETADO ✅
```

---

## OUTPUT JSON

```json
{
  "status": "completed",
  "agent": "SecurityAgent",
  "owasp_issues_critical": 0,
  "owasp_issues_warnings": 0,
  "owasp_issues_suggestions": 0,
  "files_modified": [],
  "files_generated": ["docs/SECURITY.md"],
  "state_updates": {
    "phases.security": "completed",
    "lastAgent": "SecurityAgent"
  },
  "errors": [],
  "next_agent": null
}
```
