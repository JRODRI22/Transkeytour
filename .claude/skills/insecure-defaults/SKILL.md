---
name: insecure-defaults
description: >
  Detecta vulnerabilidades de seguridad causadas por configuraciones por defecto inseguras.
  Aplica en auditorías de código, revisiones pre-producción, análisis de variables de entorno,
  configuración de autenticación, y revisión de servicios .NET, Node.js, y SQL Server.
  Actívala cuando el usuario pide revisar seguridad, auditar configuración, o detectar credenciales hardcodeadas.
triggers:
  - hardcoded credentials
  - insecure defaults
  - fail-open
  - auditoria de seguridad
  - revisar seguridad
  - .env
  - credenciales
  - JWT secret
  - CORS
  - SQL Server connection
  - Trusted_Connection
  - api key hardcoded
---

# Insecure Defaults Detection

Adaptado de Trail of Bits Skills (CC-BY-SA 4.0) para el stack de este proyecto:
- Node.js (http-server.js, MCP tools)
- .NET (ASP.NET Core APIs)
- SQL Server (mssql / Trusted_Connection)
- React/Vite (visualizador)

## Patrones críticos a detectar

### 1. Hardcoded fallback secrets (CRÍTICO)
```js
// ❌ Vulnerable: secret conocido si .env está ausente
const secret = process.env.JWT_SECRET || 'dev-secret-change-me';

// ✅ Seguro: falla explícitamente si no está configurado
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET environment variable is required');
```

### 2. Default credentials (CRÍTICO)
```js
// ❌ Vulnerable
const user = process.env.DB_USER || 'sa';
const pass = process.env.DB_PASS || 'password';

// ✅ Seguro: sin fallback
const user = process.env.DB_USER;
const pass = process.env.DB_PASS;
if (!user || !pass) throw new Error('DB credentials required');
```

### 3. CORS permisivo (ALTO)
```js
// ❌ Vulnerable
app.use(cors({ origin: '*' }));

// ✅ Seguro: lista explícita
const allowed = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({ origin: allowed }));
```

### 4. Fail-open en autenticación (CRÍTICO)
```js
// ❌ Fail-open: si verify() lanza, el usuario pasa sin verificar
try {
  user = jwt.verify(token, secret);
} catch (e) {
  // silencioso → acceso no autorizado
}

// ✅ Fail-secure: falla explícitamente
let user;
try {
  user = jwt.verify(token, secret);
} catch (e) {
  return res.status(401).json({ error: 'Invalid token' });
}
```

### 5. SQL Server — Trusted_Connection vs credenciales (.NET)
```
// ❌ Riesgo: .env define JARVISDB_USER/PASSWORD pero connection.js usa Trusted_Connection
// → credenciales en .env nunca se usan, falsa sensación de seguridad
// ✅ Decisión explícita: o Trusted_Connection (Windows Auth, OK en dev local)
//    o SQL Auth con credenciales validadas — no ambos
```

### 6. API endpoints sin autenticación en producción (ALTO)
```js
// ❌ http-server.js expone /api/activity, /api/agents sin validación de origen
// ✅ Añadir middleware de validación de IP/token para entornos no-localhost
app.use('/api', (req, res, next) => {
  const origin = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!isAllowedOrigin(origin)) return res.status(403).end();
  next();
});
```

### 7. Weak crypto defaults (MEDIO)
```js
// ❌ MD5 para passwords o tokens
crypto.createHash('md5').update(secret).digest('hex');

// ✅ SHA-256 mínimo, bcrypt/argon2 para passwords
const hash = crypto.createHash('sha256').update(secret).digest('hex');
```

### 8. .env expuesto en repositorio (CRÍTICO)
```
# ✅ Verificar que .gitignore incluye:
.env
.env.local
*.env
# ❌ Si .env está trackeado: git rm --cached .env
```

## Checklist de auditoría para este proyecto

Al revisar cualquier archivo de este workspace:

- [ ] `http-server.js` — CORS solo GET/OPTIONS aunque hay POST endpoints
- [ ] `http-server.js` — /health siempre devuelve ok:true sin verificar DB
- [ ] `connection.js` — Trusted_Connection vs .env JARVISDB_USER/PASSWORD
- [ ] `.env` — ¿está en .gitignore? ¿hay secrets reales expuestos?
- [ ] MCP tools — parámetros sin validación aceptan null/undefined silenciosamente
- [ ] `trigger-evolution` — devuelve 200 incluso en fallo DB (queued:false en body)

## Distinción clave: fail-secure vs fail-open

**Fail-secure (deseado):** La aplicación falla y lo reporta cuando la configuración está incompleta.
**Fail-open (vulnerable):** La aplicación continúa ejecutando con configuración insegura sin advertir.

> Si la aplicación crashea sin configuración → segura.
> Si la aplicación corre con defaults → vulnerable.

## Fuente
Adaptado de [Trail of Bits Skills — insecure-defaults](https://github.com/trailofbits/skills/tree/main/plugins/insecure-defaults)
Licencia original: CC-BY-SA 4.0
