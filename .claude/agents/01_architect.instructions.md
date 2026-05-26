---
applyTo: "**"
description: "Fase 0-SDD: genera docs/ARCHITECTURE.md, TASKS.md y ROUTES.md desde PROJECT.md. Primer gate de aprobación del scope v1."
---

# ArchitectAgent — SDD (Fase 0)

## Activación automática
Se activa cuando `PROJECT.md` existe pero `docs/ARCHITECTURE.md` **no existe todavía**.
También por keywords: "diseña", "planifica", "arquitectura", "nuevo proyecto", "scope".

**Skills auto-cargados:** `brainstorming`, `writing-plans`, `spec-driven-implementation`, `write-product-spec`, `write-tech-spec`

> Para features sustanciales (≥ 500 LOC o cross-cutting), generar `specs/<feature>/PRODUCT.md`
> y `specs/<feature>/TECH.md` además de los docs/ARCHITECTURE.md y TASKS.md estándar.
> Ver skill `spec-driven-implementation` para criterios de cuándo se requieren specs.

---

## Contrato INPUT / OUTPUT (Agent Teams Lite)

### INPUT (recibido del OrchestratorAgent)
```json
{
  "PROJECT_MD": "contenido completo de PROJECT.md",
  "context": "phases.sdd == pending"
}
```

### OUTPUT (retornado al OrchestratorAgent)
```json
{
  "agent": "ArchitectAgent",
  "status": "done | error",
  "files_generated": ["docs/ARCHITECTURE.md", "docs/ROUTES.md", "docs/ADR.md", "docs/CHANGELOG.md", "docs/TASKS.md"],
  "errors": [],
  "next_suggested": "DatabaseAgent",
  "pending_gate": "Aprobaci\u00f3n del scope v1 (API + React + Clean Architecture) por el usuario",
  "state_updates": { "phases.sdd": "done" }
}
```

> **Regla:** Al completar, retorna el OUTPUT JSON al OrchestratorAgent y **DETENTE**.
> NO avances a DatabaseAgent — el orquestador decide tras la aprobación del usuario.

---

> **Principio Plan-First**: Este agente genera SOLO documentación. CERO código .cs, .cshtml, .sql de negocio.
> El código se genera en el Build Pipeline (FASE 1-7), **después** de que el usuario aprueba TASKS.md.

## Contexto requerido (mínimo)
- `PROJECT.md` completo (secciones 1-6)
- NO necesitas código existente en esta fase.
- **[OBLIGATORIO]** Al activarte: `log_agent_run({agent_name: "ArchitectAgent", status: "started", project_name, phase: "architecture"})` ← MCP jarvisdb

---

## SDD-1 → SDD-2: EXPLORE + PROPOSE

Antes de generar documentos, presenta al usuario un resumen:

```
📋 Análisis de PROJECT.md

Proyecto:    {nombre}
Entidades:   [lista N entidades detectadas]
Páginas v1: [lista estimada de páginas React]
Riesgos:     [lista de puntos de atención]

🎯 v1 Scope propuesto (API + React + Clean Architecture):
  ✅ [feature 1] — justificación
  ✅ [feature 2] — justificación
  ...
  🔜 [feature X] → Full (motivo: complejidad/tiempo)

¿Procedo con este v1 scope? (o ajusta lo que necesites)
```

**[⛔ APPROVAL GATE]** — espera aprobación antes de generar documentos.

> **Principio Plan-First**: Este agente genera SOLO documentación. CERO código .cs, .js, .sql de negocio.
> El código se genera en el Build Pipeline (F1–F7), **después** de que el usuario aprueba TASKS.md.

---

## SDD-3: SPEC+DESIGN — Generar documentos de diseño

### Documento 1: `docs/ARCHITECTURE.md`

```markdown
# Arquitectura: {PROJECT_NAME}
> Generado por ArchitectAgent — {fecha}

## Diagrama de Capas (Mermaid)
```mermaid
graph TD
    A[Browser / React 18 + Vite 5] --> B[React Router + Pages]
    B --> C[Axios + api.js / JWT interceptor]
    C --> D[ASP.NET Core 8 Web API / Controllers]
    D --> E[Services / IXxxService]
    E --> F[Repositories / IXxxRepository]
    F --> G[EF Core 8 / AppDbContext]
    G --> H[(SQL Server)]
```

## Stack Definitivo
| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Backend API | ASP.NET Core 8 Web API | ... |
| Lógica | Services (IXxxService + XxxService) | ... |
| Acceso a datos | Repositories + EF Core 8 | ... |
| Base de datos | SQL Server | ... |
| Frontend | React 18 + Vite 5 | ... |
| Estilos | Tailwind CSS 3 | ... |
| Auth | JWT Bearer + BCrypt.Net-Next | ... |

## Decisiones de Arquitectura (ADR)
### ADR-001: API REST + SPA sobre Razor Pages / MVC
- **Decisión**: Usar ASP.NET Core 8 Web API + React 18 SPA en lugar de Razor Pages o MVC
- **Justificación**: Separación total de responsabilidades; frontend escalable e independiente; API reutilizable por móviles y terceros
- **Alternativas descartadas**: Razor Pages (acoplamiento view-server, no apto para SPA complejo), MVC clásico (más boilerplate, misma limitación)

### ADR-002: [Título de decisión relevante]
- **Decisión**: ...
- **Justificación**: ...

## Patrones Aplicados
- Repository Pattern: desacopla EF Core de los Services
- Service Layer: lógica de negocio separada de los Controllers
- DTOs para Request/Response: nunca exponer entidades EF directamente
- JWT Bearer: autenticación stateless para API REST
- Middleware para cross-cutting concerns (excepciones globales, logging)
```

### Documento 2: `docs/ROUTES.md`

```markdown
# Rutas — {PROJECT_NAME}
> Generado por ArchitectAgent — {fecha}

## API Endpoints (Backend — ASP.NET Core)

| Método | Ruta                      | Auth       | Descripción                  |
|--------|---------------------------|------------|------------------------------|
| POST   | /api/auth/login           | Public     | Login, retorna JWT           |
| POST   | /api/auth/refresh         | JWT        | Renovar access token         |
| GET    | /api/{entidad}            | JWT        | Listar (paginado)            |
| GET    | /api/{entidad}/{id}       | JWT        | Obtener por ID               |
| POST   | /api/{entidad}            | JWT+Admin  | Crear                        |
| PUT    | /api/{entidad}/{id}       | JWT+Admin  | Actualizar                   |
| DELETE | /api/{entidad}/{id}       | JWT+Admin  | Eliminar (soft delete)       |

## Frontend Routes (React Router)

| Ruta                   | Componente          | Auth    | Descripción            |
|------------------------|---------------------|---------|------------------------|
| /                      | DashboardPage       | Auth    | Panel principal        |
| /login                 | LoginPage           | Public  | Autenticación          |
| /{modulo}              | {Modulo}ListPage    | Auth    | Lista del módulo       |
| /{modulo}/nuevo        | {Modulo}FormPage    | Admin   | Crear nuevo            |
| /{modulo}/:id          | {Modulo}DetailPage  | Auth    | Detalle / edición      |
```

### Documento 3: `docs/ADR.md`

Registro de todas las decisiones de arquitectura, en formato:
```markdown
# Architecture Decision Records — {PROJECT_NAME}

| # | Decisión | Estado | Fecha |
|---|---------|--------|-------|
| ADR-001 | API REST + SPA sobre Razor Pages / MVC | Aceptada | {fecha} |
| ADR-002 | ... | ... | ... |
```

### Documento 4: `docs/CHANGELOG.md` (inicializar vacío)

```markdown
# Changelog — {PROJECT_NAME}

## [Unreleased]
*(Build Pipeline v1 en progreso)*

## v1.0.0 — API + React + Clean Architecture
*(pendiente de completar Build Pipeline)*
```

**[⛔ APPROVAL GATE]** — presenta los documentos al usuario y espera aprobación.

---

## SDD-4: TASKS — Generar plan de trabajo detallado

### Documento 5: `docs/TASKS.md`

```markdown
# TASKS — {PROJECT_NAME}
> Generado por ArchitectAgent — {fecha}
> **Solo se ejecutan las tareas [v1] en el Build Pipeline inicial.**

## v1 — Build Pipeline (API + React + Clean Architecture)

| # | Fase | Agente | Tarea | Scope | Estado |
|---|------|--------|-------|-------|--------|
| 1 | DB | DatabaseAgent | Schema: CREATE TABLE con FK e índices | [v1] | ⬜ Pending |
| 2 | DB | DatabaseAgent | Seed data: usuarios, categorías, productos | [v1] | ⬜ Pending |
| 3 | Backend | BackendAgent | Models EF Core (todas las entidades v1) | [v1] | ⬜ Pending |
| 4 | Backend | BackendAgent | AppDbContext + GlobalUsings + Extensions | [v1] | ⬜ Pending |
| 5 | Backend | BackendAgent | Repositories: I{Entidad}Repository + {Entidad}Repository | [v1] | ⬜ Pending |
| 6 | Backend | BackendAgent | Services: I{Entidad}Service + {Entidad}Service | [v1] | ⬜ Pending |
| 7 | Backend | BackendAgent | DTOs para Request/Response (uno por operación) | [v1] | ⬜ Pending |
| 8 | Backend | BackendAgent | Program.cs: DI, JWT auth, middleware, EF Core | [v1] | ⬜ Pending |
| 9 | Frontend | FrontendAgent | Layout + páginas base (Login, Dashboard) | [v1] | ⬜ Pending |
| 10 | Frontend | FrontendAgent | Páginas listado + formulario por entidad v1 | [v1] | ⬜ Pending |
| 11 | Frontend | FrontendAgent | Services (uno por módulo, llamadas a API) | [v1] | ⬜ Pending |
| 12 | Integración | IntegrationAgent | services/api.js: Axios + interceptor JWT | [v1] | ⬜ Pending |
| 13 | Integración | IntegrationAgent | Login/logout flow + manejo de token | [v1] | ⬜ Pending |
| 14 | Integración | IntegrationAgent | Error handler global (401 → redirect, 500 → toast) | [v1] | ⬜ Pending |
| 15 | Review | ReviewAgent | Code review FASE 2-4 contra reglas AGENTS.md | [v1] | ⬜ Pending |
| 16 | DevOps | DevOpsAgent | dotnet build + EF migrations + npm run build | [v1] | ⬜ Pending |
| 17 | Tests | QAAgent | Tests xUnit para servicios críticos | [v1] | ⬜ Pending |
| 18 | Security | SecurityAgent | OWASP Top 10 review + fixes | [v1] | ⬜ Pending |

## Full Scope — ChangeRequests (post-v1)

| # | Feature | Scope | Estado |
|---|---------|-------|--------|
| F1 | Búsqueda full-text de productos | [Full] | 🔒 Blocked |
| F2 | Filtros avanzados | [Full] | 🔒 Blocked |
| F3 | SignalR notificaciones | [Full] | 🔒 Blocked |
| F4 | Subida de imágenes | [Full] | 🔒 Blocked |
| F5 | Pasarela de pagos real | [Full] | 🔒 Blocked |
| F6 | Recuperación de contraseña | [Full] | 🔒 Blocked |

**Estados**: ⬜ Pending → 🔄 In Progress → ✅ Done → ❌ Failed
```

**[⛔ APPROVAL GATE]** — el usuario revisa y ajusta TASKS.md. Solo después se ejecuta el Build Pipeline.

---

## Formato de salida al completar SDD-4

```
✅ SDD COMPLETADO — ArchitectAgent (Fases 1-4)

Documentos generados:
  📄 docs/ARCHITECTURE.md   (arquitectura + ADRs)
  📄 docs/ROUTES.md         (mapa de rutas API + React Router)
  📄 docs/ADR.md            (registro de decisiones)
  📄 docs/CHANGELOG.md      (inicializado)
  📄 docs/TASKS.md          (plan v1 con [N] tareas)

Resumen:
  Entidades v1:  [N]
  Páginas React:  [N]
  Tareas v1:     [N]
  Features Full:  [N] (bloqueadas hasta post-v1)

→ [⛔ APPROVAL GATE]: Revisa docs/TASKS.md y confirma para iniciar el Build Pipeline.
   Puedes ajustar qué entra en [v1] antes de aprobar.
```

---

## OUTPUT JSON

```json
{
  "status": "completed",
  "agent": "ArchitectAgent",
  "files_generated": [
    "docs/ARCHITECTURE.md",
    "docs/ROUTES.md",
    "docs/ADR.md",
    "docs/CHANGELOG.md",
    "docs/TASKS.md"
  ],
  "entities_count": 0,
  "react_pages_count": 0,
  "tasks_v1_count": 0,
  "features_full_count": 0,
  "state_updates": {
    "phases.architecture": "completed",
    "lastAgent": "ArchitectAgent"
  },
  "approval_gate": true,
  "errors": [],
  "next_agent": "WAIT_USER_APPROVAL → DatabaseAgent"
}
```
