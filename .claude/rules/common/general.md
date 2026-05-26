# rules/common — Reglas Generales del Proyecto

Estas reglas aplican a TODOS los agentes y a todos los proyectos del sistema.

---

## Seguridad (OWASP Top 10 — siempre)

- **Passwords**: BCrypt exclusivamente — NUNCA MD5, SHA1, SHA256 plano, o cualquier hash sin salt
- **JWT secret**: mínimo 32 caracteres en `appsettings.json` o variable de entorno — nunca hardcodeado en código
- **CORS**: orígenes específicos en producción (`charlottefashion.duckdns.org`) — NUNCA `"*"` en prod
- **Authorization default**: `[Authorize]` en todos los controllers/endpoints por defecto; acceso público requiere `[AllowAnonymous]` explícito y documentado
- **SQL injection**: EF Core siempre; NUNCA SQL concatenado con inputs del usuario
- **Credenciales en código**: NUNCA hardcodear strings como `password=`, `api_key=`, `token=` en archivos de código fuente
- **Headers de seguridad**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, CSP y HSTS activos en producción

## Git workflow

- Siempre verificar `git status` antes de hacer commit
- `.env` NUNCA se agrega al staging — mantener en `.gitignore`
- Mensajes de commit en formato: `tipo(scope): descripción breve` — NUNCA vacíos
- No usar `git push --force` en rama `main` o `master` sin aprobación explícita del usuario

## Calidad de código

- No agregar `console.log` / `console.debug` en código de producción (JS/TS)
- No crear helpers o abstracciones para operaciones de un solo uso
- No agregar docstrings/comentarios a código que no se modifica en la tarea actual
- No agregar features no solicitadas — scope estricto a lo pedido

## Token optimization (RTK)

- Siempre usar `rtk` como prefijo en comandos shell: `rtk git status`, `rtk git log -10`
- `rtk gain` para ver dashboard de ahorro acumulado
- `rtk discover` si no se usó rtk en los últimos comandos
