-- cleanup_orphan_tables.sql
-- Eliminar tablas sin SP, sin tool MCP y sin uso activo en JarvisDB
-- Ejecutar en: localhost / JarvisDB
-- Fecha: 2026-04-03
--
-- CONSERVADAS (vacías pero con SPs activos):
--   AgentHistory, AI_Knowledge, CIRunHistory, EvolvedSkills,
--   Patterns, PipelineQueue, ProjectStates, ReviewCache, Snippets
-- ──────────────────────────────────────────────────────────────────

SET NOCOUNT ON;

PRINT '=== JarvisDB — Limpieza de tablas huérfanas ===';
PRINT '';

-- ── 1. ChatMessages / ChatSessions ────────────────────────────────
-- Sesiones de prueba del 2026-03-13, sin SP ni tool activa hoy.
IF OBJECT_ID('ChatMessages', 'U') IS NOT NULL BEGIN
    DROP TABLE ChatMessages;
    PRINT '✅ ChatMessages eliminada';
END ELSE PRINT '-- ChatMessages: ya no existe';

IF OBJECT_ID('ChatSessions', 'U') IS NOT NULL BEGIN
    DROP TABLE ChatSessions;
    PRINT '✅ ChatSessions eliminada';
END ELSE PRINT '-- ChatSessions: ya no existe';

-- ── 2. CodePatterns ───────────────────────────────────────────────
-- Duplicada con la tabla [Patterns] que sí tiene SPs activos.
-- Los 4 registros (Repository Pattern, Clean API Controller, etc.)
-- serán migrados a [Patterns] si se necesitan en el futuro.
IF OBJECT_ID('CodePatterns', 'U') IS NOT NULL BEGIN
    DROP TABLE CodePatterns;
    PRINT '✅ CodePatterns eliminada';
END ELSE PRINT '-- CodePatterns: ya no existe';

-- ── 3. PipelineStages ─────────────────────────────────────────────
-- 30 filas = historial de ejecución de Chimbox (proyecto terminado).
-- Sin SP ni tool activa. El estado de pipelines activos
-- se maneja en PipelineQueue (sí conservada).
IF OBJECT_ID('PipelineStages', 'U') IS NOT NULL BEGIN
    DROP TABLE PipelineStages;
    PRINT '✅ PipelineStages eliminada (historial Chimbox)';
END ELSE PRINT '-- PipelineStages: ya no existe';

-- ── 4. __EFMigrationsHistory ──────────────────────────────────────
-- Artefacto de Entity Framework — el sistema usa SPs directos,
-- ya no hay migraciones EF gestionadas desde código.
IF OBJECT_ID('__EFMigrationsHistory', 'U') IS NOT NULL BEGIN
    DROP TABLE __EFMigrationsHistory;
    PRINT '✅ __EFMigrationsHistory eliminada (artefacto EF)';
END ELSE PRINT '-- __EFMigrationsHistory: ya no existe';

-- ── 5. AI_Projects ────────────────────────────────────────────────
-- Nunca tuvo SP ni tool. Los proyectos se manejan en [Projects].
IF OBJECT_ID('AI_Projects', 'U') IS NOT NULL BEGIN
    DROP TABLE AI_Projects;
    PRINT '✅ AI_Projects eliminada';
END ELSE PRINT '-- AI_Projects: ya no existe';

-- ── 6. ChangeRequests ─────────────────────────────────────────────
-- Sin SP ni tool. Nunca fue implementada.
IF OBJECT_ID('ChangeRequests', 'U') IS NOT NULL BEGIN
    DROP TABLE ChangeRequests;
    PRINT '✅ ChangeRequests eliminada';
END ELSE PRINT '-- ChangeRequests: ya no existe';

-- ── 7. ProjectContext ─────────────────────────────────────────────
-- Sin SP ni tool. El contexto de proyecto se persiste
-- en [ProjectStates] (conservada, tiene sp_SyncProjectState).
IF OBJECT_ID('ProjectContext', 'U') IS NOT NULL BEGIN
    DROP TABLE ProjectContext;
    PRINT '✅ ProjectContext eliminada';
END ELSE PRINT '-- ProjectContext: ya no existe';

PRINT '';
PRINT '=== Verificación post-limpieza ===';
SELECT
    t.name                                    AS Tabla,
    p.rows                                    AS Filas,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM sys.sql_expression_dependencies d
            JOIN sys.objects o ON d.referencing_id = o.object_id AND o.type = 'P'
            WHERE d.referenced_id = t.object_id
        ) THEN 'Sí'
        ELSE 'Sin SP'
    END                                       AS Tiene_SP
FROM sys.tables t
JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
WHERE t.name NOT LIKE 'sys%'
GROUP BY t.name, t.object_id, p.rows
ORDER BY p.rows DESC, t.name;

PRINT '';
PRINT '✅ Limpieza completada';
