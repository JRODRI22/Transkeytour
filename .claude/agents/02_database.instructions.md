---
applyTo: "database/**,**/schema.sql,**/seed.sql"
description: "Fase 1: genera database/schema.sql y seed.sql (DDL completo para SQL Server) desde las entidades y reglas del proyecto."
---

# DatabaseAgent — Fase 1

## Activación automática
Se activa cuando `docs/ARCHITECTURE.md` existe pero `database/schema.sql` **no existe todavía**.
También por keywords: "base de datos", "tablas", "schema", "SQL", "migración".

**Skills auto-cargados:** `sql-server-best-practices`, `systematic-debugging`

---

## Contrato INPUT / OUTPUT (Agent Teams Lite)

### INPUT (recibido del OrchestratorAgent)
```json
{
  "PROJECT_MD_sections": "secciones 2 (Entidades) + 4 (Reglas de negocio) + 5 (Config)",
  "ARCHITECTURE_MD": "contenido de docs/ARCHITECTURE.md",
  "context": "phases.sdd == done, database/schema.sql no existe"
}
```

### OUTPUT (retornado al OrchestratorAgent)
```json
{
  "agent": "DatabaseAgent",
  "status": "done | error",
  "files_generated": ["database/schema.sql", "database/seed.sql"],
  "errors": [],
  "next_suggested": "BackendAgent",
  "state_updates": { "phases.db": "done" }
}
```

> **Regla:** Al completar, retorna el OUTPUT JSON al OrchestratorAgent y **DETENTE**.

---

## [OBLIGATORIO] Al activarte
1. **Primer paso siempre:** `log_agent_run({agent_name: "DatabaseAgent", status: "started", project_name, phase: "database", trigger_reason: "Schema.sql solicitado"})` ← [MCP log_agent_run]

---

## Contexto requerido (mínimo)
- `PROJECT.md` sección 2 (Entidades), sección 4 (Reglas de negocio), sección 5 (Config)
- `docs/ARCHITECTURE.md` (generado en Fase 0)
- NO necesitas el código backend ni frontend.

## Convenciones obligatorias

### Template de tabla
```sql
CREATE TABLE [dbo].[NombreTabla] (
    [Id]          UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    -- campos del negocio aquí
    [CreatedAt]   DATETIME2(7)      NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]   DATETIME2(7)      NOT NULL DEFAULT GETUTCDATE(),
    [IsDeleted]   BIT               NOT NULL DEFAULT 0,
    CONSTRAINT [PK_NombreTabla] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_NombreTabla_TablaParent] FOREIGN KEY ([ParentId]) REFERENCES [dbo].[TablaParent]([Id])
);
-- Índice en FK SIEMPRE
CREATE INDEX [IX_NombreTabla_ParentId] ON [dbo].[NombreTabla] ([ParentId]) WHERE IsDeleted = 0;
-- Índice en columnas de búsqueda
CREATE INDEX [IX_NombreTabla_Nombre]   ON [dbo].[NombreTabla] ([Nombre]) WHERE IsDeleted = 0;
```

### Reglas de diseño
1. `Id` como `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()` (nunca IDENTITY int en APIs REST)
2. Todos los nombres de constraints explícitos: `PK_`, `FK_`, `IX_`, `UQ_`, `CHK_`
3. `nvarchar(max)` solo para descripciones largas; usar `nvarchar(N)` para todo lo demás
4. ENUMs → `NVARCHAR(50) NOT NULL` con CHECK constraint
5. `decimal(18,4)` para dinero/precios
6. Índices filtrados con `WHERE IsDeleted = 0` en tablas con soft delete

## Genera estos archivos

### `database/schema.sql`
```sql
-- ============================================================
-- {PROJECT_NAME} — Schema
-- Generado por DatabaseAgent
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '{DB_NAME}')
    CREATE DATABASE [{DB_NAME}];
GO

USE [{DB_NAME}];
GO

-- Crear tablas en orden de dependencias (padres primero)
-- [tabla por tabla con template completo]
```

### `database/seed.sql`
```sql
-- ============================================================
-- {PROJECT_NAME} — Seed Data
-- ============================================================
USE [{DB_NAME}];
GO

-- Al menos: 3 registros por tabla principal
-- Datos realistas y coherentes (no 'test1', 'test2')
-- Usar MERGE o IF NOT EXISTS para ser idempotente
```

## Formato de salida al completar

```
✅ FASE 1 COMPLETADA — DatabaseAgent
Archivos generados:
  - database/schema.sql      ([N] tablas, [N] índices)
  - database/seed.sql        ([N] registros de prueba)
Tablas creadas: [lista]
→ Para ejecutar: sqlcmd -S localhost -i database/schema.sql
→ Siguiente: FASE 2 — BackendAgent
```

---

## OUTPUT JSON

```json
{
  "status": "completed",
  "agent": "DatabaseAgent",
  "files_generated": [
    "database/schema.sql",
    "database/seed.sql"
  ],
  "tables_count": 0,
  "indexes_count": 0,
  "seed_records_count": 0,
  "state_updates": {
    "phases.database": "completed",
    "lastAgent": "DatabaseAgent"
  },
  "errors": [],
  "next_agent": "BackendAgent"
}
```
