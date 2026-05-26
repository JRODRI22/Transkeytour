---
applyTo: "README.md,docs/**"
description: "On-demand: genera README.md, API_DOCUMENTATION.md y DEPLOYMENT_GUIDE.md con créditos de JR Digital Solutions."
---

# DocsAgent — On-demand

## Activación
No se activa automáticamente. On-demand por keywords:
"README", "documentación", "API docs", "guía de instalación", "doc".

**Skills auto-cargados:** `doc-coauthoring`

---

## Contrato INPUT / OUTPUT (Agent Teams Lite)

### INPUT (recibido del OrchestratorAgent)
```json
{
  "PROJECT_MD": "contenido completo de PROJECT.md",
  "routes_md": "contenido de docs/ROUTES.md",
  "architecture_md": "contenido de docs/ARCHITECTURE.md",
  "context": "on-demand: usuario solicit\u00f3 documentaci\u00f3n"
}
```

### OUTPUT (retornado al OrchestratorAgent)
```json
{
  "agent": "DocsAgent",
  "status": "done | error",
  "files_generated": ["README.md", "docs/API_DOCUMENTATION.md", "docs/DEPLOYMENT_GUIDE.md"],
  "errors": [],
  "next_suggested": null,
  "state_updates": {}
}
```

> **Regla:** Al completar, retorna el OUTPUT JSON al OrchestratorAgent y **DETENTE**.

---

## [OBLIGATORIO] Al activarte
1. **Primer paso siempre:** `log_agent_run({agent_name: "DocsAgent", status: "started", project_name, phase: "docs", trigger_reason: "Documentación solicitada"})` ← [MCP log_agent_run]

---

## Contexto requerido (mínimo)
- `PROJECT.md` — descripción y stack
- `docs/ARCHITECTURE.md` — decisiones de diseño
- `docs/ROUTES.md` — endpoints y rutas

---

## Documentos a generar

### `README.md` — guía principal del proyecto

```markdown
# {PROJECT_NAME}

> {descripción breve de una línea}

## Stack
| Capa | Tecnología |
|------|-----------|
| Backend | ASP.NET Core 8 Web API |
| Frontend | React 18 + Vite 5 |
| Base de datos | SQL Server |
| Auth | JWT Bearer |

## Requisitos previos
- .NET 8 SDK
- Node.js 20+
- SQL Server (Express o superior)
- Git

## Inicio rápido

### 1. Clonar
```bash
git clone {repo-url}
cd {project-name}
```

### 2. Base de datos
```sql
-- En SQL Server Management Studio:
-- Ejecutar database/schema.sql
-- Ejecutar database/seed.sql
```

### 3. Backend
```bash
cd backend/{ProjectName}.API
# Configurar appsettings.Development.json con tu connection string y JWT secret
dotnet ef database update
dotnet run
# API disponible en: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### 4. Frontend
```bash
cd frontend/{project}-web
npm install
# Configurar .env.development con VITE_API_URL
npm run dev
# App disponible en: http://localhost:5173
```

## Estructura del proyecto
{diagrama de árbol de carpetas principales}

## Documentación adicional
- [Arquitectura](docs/ARCHITECTURE.md) — decisiones de diseño
- [Rutas y endpoints](docs/ROUTES.md) — API completa
- [Tareas](docs/TASKS.md) — estado del backlog
- [Seguridad](docs/SECURITY.md) — checklist OWASP
```

---

### `API_DOCUMENTATION.md` — referencia completa de la API

```markdown
# API Documentation — {PROJECT_NAME}

Base URL: `http://localhost:5000/api`

## Autenticación

Todos los endpoints (excepto `/auth/login`) requieren header:
```
Authorization: Bearer {jwt-token}
```

### POST /auth/login
Obtiene un JWT.

**Request:**
```json
{ "email": "admin@ejemplo.com", "password": "password123" }
```

**Response 200:**
```json
{ "token": "eyJ...", "user": { "id": "...", "email": "...", "role": "Admin" } }
```

**Response 401:**
```json
{ "message": "Credenciales inválidas" }
```

---

## {Entidad}

### GET /api/{entidad}
Lista paginada.

**Query params:** `page` (default: 1), `pageSize` (default: 20, max: 100)

**Response 200:**
```json
{
  "items": [...],
  "totalCount": 50,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

{repetir para cada entidad del proyecto}
```

---

### `DEPLOYMENT_GUIDE.md` — guía de despliegue

```markdown
# Deployment Guide — {PROJECT_NAME}

## Docker (recomendado)

```bash
docker-compose up -d
```

Los servicios:
- `backend`: puerto 5000
- `frontend`: puerto 80
- `db` (opcional): SQL Server 2022

## Variables de entorno (producción)

| Variable | Descripción |
|----------|-------------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__Default` | Connection string SQL Server |
| `Jwt__Secret` | Secreto JWT (min 32 chars) |
| `Jwt__Issuer` | Dominio del backend |
| `Jwt__Audience` | Dominio del frontend |
| `CORS__AllowedOrigins` | URL del frontend (sin wildcard) |

## Build manual

### Backend
```bash
dotnet publish -c Release -o publish/backend
```

### Frontend
```bash
npm run build   # genera dist/
```
```

---

## Developer Branding en README.md (OBLIGATORIO)

> **Regla:** Todo README generado debe incluir la sección de créditos del desarrollador al final.
> Ver CLAUDE.md §15 para datos completos.

Agregar esta sección al final del README.md generado:

```markdown
---

## Desarrollado por

<p align="center">
  <img src="assets/logo-developer.png" alt="JR Digital Solutions" width="200" />
</p>

<p align="center">
  <strong>Jorge Rodríguez</strong> — JR Digital Solutions<br/>
  <em>Impulsando empresas en la era digital</em>
</p>

<p align="center">
  📱 <a href="https://wa.me/50661969427">+506 6196-9427</a> ·
  ✉️ jrodri1493@gmail.com<br/>
  📍 San Carlos, Alajuela – Costa Rica
</p>
```

---

## Formato de salida al completar

```
✅ DocsAgent completado
Archivos generados:
  - README.md
  - API_DOCUMENTATION.md
  - DEPLOYMENT_GUIDE.md
```
---

## OUTPUT JSON

```json
{
  "status": "completed",
  "agent": "DocsAgent",
  "files_generated": [
    "README.md",
    "API_DOCUMENTATION.md",
    "DEPLOYMENT_GUIDE.md"
  ],
  "state_updates": {
    "lastAgent": "DocsAgent"
  },
  "errors": [],
  "next_agent": null
}
```