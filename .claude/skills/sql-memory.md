---
applyTo: "**"
---

# SQL Memory — Jarvis State Persistence

## Propósito
Jarvis guarda el estado de cada fase en SQL Server para:
1. **Evitar regenerar** lo que ya está hecho (tokens = $$$)
2. **Retomar sesiones** — si el chat se cierra, el estado persiste
3. **Auditoría** — historial de decisiones tomadas
4. **Diagnóstico** — si algo falló, queda registrado

---

## Uso en el chat

### Ver estado actual del proyecto
```sql
USE JarvisDB;
SELECT Phase, Status, Summary, UpdatedAt
FROM JarvisState
WHERE ProjectId = '{PROJECT_KEY}'
ORDER BY PhaseOrder;
```

### Registrar fase completada (Jarvis lo llama automáticamente)
```sql
MERGE JarvisState AS target
USING (VALUES ('{PROJECT_KEY}', '{PHASE}', {ORDER}, 'completed', '{SUMMARY}', GETUTCDATE()))
    AS source (ProjectId, Phase, PhaseOrder, Status, Summary, UpdatedAt)
ON target.ProjectId = source.ProjectId AND target.Phase = source.Phase
WHEN MATCHED THEN UPDATE SET
    Status = source.Status,
    Summary = source.Summary,
    UpdatedAt = source.UpdatedAt
WHEN NOT MATCHED THEN INSERT
    (ProjectId, Phase, PhaseOrder, Status, Summary, UpdatedAt)
    VALUES (source.ProjectId, source.Phase, source.PhaseOrder, source.Status, source.Summary, source.UpdatedAt);
```

### Retomar desde donde se quedó
```sql
-- Jarvis consulta esto al inicio de cada sesión
SELECT TOP 1 Phase, PhaseOrder
FROM JarvisState
WHERE ProjectId = '{PROJECT_KEY}' AND Status != 'completed'
ORDER BY PhaseOrder;
-- Si retorna NULL, todas las fases están completadas
```

### Guardar una decisión de arquitectura
```sql
INSERT INTO JarvisDecisions (ProjectId, Category, Decision, Rationale, CreatedAt)
VALUES ('{PROJECT_KEY}', 'architecture', '{DECISION}', '{RATIONALE}', GETUTCDATE());
```

### Ver todas las decisiones tomadas
```sql
SELECT Category, Decision, Rationale, CreatedAt
FROM JarvisDecisions
WHERE ProjectId = '{PROJECT_KEY}'
ORDER BY CreatedAt;
```

### Registrar un archivo generado
```sql
INSERT INTO JarvisFiles (ProjectId, FilePath, Phase, GeneratedAt)
VALUES ('{PROJECT_KEY}', '{FILE_PATH}', '{PHASE}', GETUTCDATE());
```

### Ver archivos generados por fase
```sql
SELECT Phase, FilePath, GeneratedAt
FROM JarvisFiles
WHERE ProjectId = '{PROJECT_KEY}'
ORDER BY GeneratedAt;
```

### Ver estado de code review (ReviewCache)
```sql
-- Archivos revisados y su estado
SELECT FilePath, Status, FailedRules, ReviewedAt
FROM ReviewCache
WHERE ProjectId = '{PROJECT_KEY}'
ORDER BY ReviewedAt DESC;

-- Contar archivos que pasaron vs fallaron
SELECT Status, COUNT(*) AS Total
FROM ReviewCache
WHERE ProjectId = '{PROJECT_KEY}'
GROUP BY Status;
```

---

## Fases y su PhaseOrder

| Phase | PhaseOrder | Agente | Status Values |
|-------|-----------|--------|---------------|
| `planning` | 1 | ArchitectAgent | `pending`, `in_progress`, `completed`, `failed` |
| `database` | 2 | DatabaseAgent | ídem |
| `backend` | 3 | BackendAgent | ídem |
| `frontend` | 4 | FrontendAgent | ídem |
| `review` | 5 | ReviewAgent | ídem |
| `devops` | 6 | DevOpsAgent | ídem |
| `testing` | 7 | QAAgent | ídem |
| `security` | 8 | SecurityAgent | ídem |
| `done` | 9 | — | `completed` |

---

## ProjectId Convention

El `ProjectId` se deriva del nombre del proyecto en `PROJECT.md` sección 6:
```
project_name: TiendaArtesanal  →  ProjectId = 'tienda-artesanal'
project_name: BlogPersonal      →  ProjectId = 'blog-personal'
```
Siempre lowercase, guiones en lugar de espacios, sin caracteres especiales.
