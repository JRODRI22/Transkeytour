-- ═══════════════════════════════════════════════════════════════
-- add_new_tools.sql — Nuevas SPs para tools MCP adicionales
-- Ejecutar en: localhost > JarvisDB
-- sqlcmd -S localhost -d JarvisDB -E -C -i add_new_tools.sql
-- ═══════════════════════════════════════════════════════════════

USE JarvisDB;
GO

-- ─────────────────────────────────────────────────────────────
-- 1. sp_UpdateQueueStatus — Actualizar estado de ítem en PipelineQueue
-- ─────────────────────────────────────────────────────────────
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
IF OBJECT_ID('sp_UpdateQueueStatus', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateQueueStatus;
GO
CREATE PROCEDURE sp_UpdateQueueStatus
    @QueueId       INT,
    @Status        NVARCHAR(20),   -- running | done | failed | skipped
    @ErrorMessage  NVARCHAR(2000) = NULL,
    @OutputJson    NVARCHAR(MAX)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Now DATETIME2 = SYSUTCDATETIME();

    UPDATE PipelineQueue
    SET
        Status       = @Status,
        StartedAt    = CASE WHEN @Status = 'running'  AND StartedAt IS NULL THEN @Now ELSE StartedAt END,
        CompletedAt  = CASE WHEN @Status IN ('done','failed','skipped') THEN @Now ELSE CompletedAt END,
        ErrorMessage = CASE WHEN @ErrorMessage IS NOT NULL THEN @ErrorMessage ELSE ErrorMessage END,
        OutputJson   = CASE WHEN @OutputJson  IS NOT NULL THEN @OutputJson   ELSE OutputJson   END
    WHERE Id = @QueueId;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO
PRINT 'sp_UpdateQueueStatus OK';
GO

-- ─────────────────────────────────────────────────────────────
-- 2. sp_GetSnippets — Buscar snippets de código en biblioteca
-- ─────────────────────────────────────────────────────────────
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
IF OBJECT_ID('sp_GetSnippets', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetSnippets;
GO
CREATE PROCEDURE sp_GetSnippets
    @Keywords    NVARCHAR(500) = NULL,
    @Language    NVARCHAR(50)  = NULL,
    @SnippetType NVARCHAR(50)  = NULL,
    @Framework   NVARCHAR(100) = NULL,
    @VerifiedOnly BIT          = 0,
    @Top         INT           = 20
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@Top)
        Id,
        SnippetType,
        Name,
        Description,
        Code,
        Language,
        Framework,
        Tags,
        SourceAgent,
        IsVerified,
        UsageCount,
        CreatedAt
    FROM Snippets
    WHERE IsDeleted = 0
        AND (@VerifiedOnly   = 0   OR IsVerified = 1)
        AND (@Language       IS NULL OR Language    = @Language)
        AND (@SnippetType    IS NULL OR SnippetType = @SnippetType)
        AND (@Framework      IS NULL OR Framework   LIKE '%' + @Framework + '%')
        AND (@Keywords       IS NULL OR
             Name        LIKE '%' + @Keywords + '%' OR
             Description LIKE '%' + @Keywords + '%' OR
             Tags        LIKE '%' + @Keywords + '%' OR
             Code        LIKE '%' + @Keywords + '%')
    ORDER BY IsVerified DESC, UsageCount DESC, CreatedAt DESC;
END;
GO
PRINT 'sp_GetSnippets OK';
GO

-- ─────────────────────────────────────────────────────────────
-- 3. sp_SaveSessionSummary — Guardar resumen de sesión (mem_session_summary)
--    Inserta o actualiza en ProjectStates + guarda nota resumen en MemoryNotes
-- ─────────────────────────────────────────────────────────────
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
IF OBJECT_ID('sp_SaveSessionSummary', 'P') IS NOT NULL
    DROP PROCEDURE sp_SaveSessionSummary;
GO
CREATE PROCEDURE sp_SaveSessionSummary
    @ProjectName    NVARCHAR(200),
    @Goal           NVARCHAR(1000),
    @Discoveries    NVARCHAR(2000)  = NULL,  -- JSON array como string
    @Accomplished   NVARCHAR(2000)  = NULL,  -- JSON array como string
    @Files          NVARCHAR(2000)  = NULL,  -- JSON array como string
    @SessionId      NVARCHAR(100)   = NULL,
    @TokensUsed     INT             = NULL,
    @TokensSaved    INT             = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Now DATETIME2 = SYSUTCDATETIME();

    -- 1. Actualizar ProjectStates (tokens saved acumulados)
    UPDATE ProjectStates
    SET
        LastSyncAt  = @Now,
        TokensSaved = ISNULL(TokensSaved, 0) + ISNULL(@TokensSaved, 0)
    WHERE ProjectName = @ProjectName AND IsActive = 1;

    -- 2. Guardar resumen como MemoryNote de alta importancia
    DECLARE @Content NVARCHAR(MAX) = CONCAT(
        '## Session Summary — ', CONVERT(NVARCHAR(20), @Now, 120), CHAR(10),
        '**Goal:** ', @Goal, CHAR(10),
        CASE WHEN @Discoveries IS NOT NULL THEN CONCAT('**Discoveries:** ', @Discoveries, CHAR(10)) ELSE '' END,
        CASE WHEN @Accomplished IS NOT NULL THEN CONCAT('**Accomplished:** ', @Accomplished, CHAR(10)) ELSE '' END,
        CASE WHEN @Files       IS NOT NULL THEN CONCAT('**Files:** ', @Files, CHAR(10)) ELSE '' END,
        CASE WHEN @SessionId   IS NOT NULL THEN CONCAT('**Session:** ', @SessionId, CHAR(10)) ELSE '' END,
        CASE WHEN @TokensUsed  IS NOT NULL THEN CONCAT('**Tokens used:** ', CAST(@TokensUsed AS NVARCHAR(20)), CHAR(10)) ELSE '' END
    );

    INSERT INTO MemoryNotes (ProjectName, Category, Title, Content, Tags, Importance)
    VALUES (@ProjectName, 'session', CONCAT('Session: ', @Goal), @Content, 'session-summary', 9);

    SELECT SCOPE_IDENTITY() AS NewNoteId;
END;
GO
PRINT 'sp_SaveSessionSummary OK';
GO

-- ─────────────────────────────────────────────────────────────
-- 4. sp_GetStatisticsV2 — Estadísticas mejoradas con TokenMetrics
-- ─────────────────────────────────────────────────────────────
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
IF OBJECT_ID('sp_GetStatisticsV2', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetStatisticsV2;
GO
CREATE PROCEDURE sp_GetStatisticsV2
    @ProjectName NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Estadísticas generales
    SELECT
        (SELECT COUNT(*) FROM Lessons       WHERE IsDeleted = 0 AND (@ProjectName IS NULL OR ProjectName = @ProjectName)) AS TotalLessons,
        (SELECT COUNT(*) FROM Patterns      WHERE IsDeleted = 0) AS TotalPatterns,
        (SELECT COUNT(*) FROM Decisions     WHERE IsDeleted = 0 AND (@ProjectName IS NULL OR ProjectName = @ProjectName)) AS TotalDecisions,
        (SELECT COUNT(*) FROM Snippets      WHERE IsDeleted = 0) AS TotalSnippets,
        (SELECT COUNT(*) FROM MemoryNotes   WHERE IsDeleted = 0 AND (@ProjectName IS NULL OR ProjectName = @ProjectName)) AS TotalMemoryNotes,
        (SELECT COUNT(*) FROM ProjectStates WHERE IsActive = 1) AS ActiveProjects,
        (SELECT ISNULL(SUM(TokensSaved), 0) FROM ProjectStates) AS TotalTokensSavedProjects,
        (SELECT COUNT(*) FROM AgentHistory  WHERE Status = 'completed') AS SuccessfulRuns,
        (SELECT COUNT(*) FROM AgentHistory  WHERE Status = 'failed')    AS FailedRuns,
        (SELECT COUNT(*) FROM Skills        WHERE IsActive = 1 AND IsDeleted = 0) AS ActiveSkills,
        (SELECT COUNT(*) FROM EvolvedSkills WHERE IsActive = 1 AND IsDeleted = 0) AS ActiveEvolvedSkills,
        (SELECT TOP 1 Name FROM Patterns    WHERE IsDeleted = 0 ORDER BY UsageCount DESC) AS MostUsedPattern;

    -- TokenMetrics (últimos 30 días)
    SELECT
        COUNT(*)                           AS SessionsTracked,
        ISNULL(SUM(TokensUsed),  0)        AS TotalTokensConsumed,
        ISNULL(SUM(TokensSaved), 0)        AS TotalTokensSavedMetrics,
        ISNULL(AVG(CAST(TokensUsed AS BIGINT)), 0) AS AvgTokensPerSession,
        ISNULL(SUM(CASE WHEN MemoryRetrieval = 1 THEN 1 ELSE 0 END), 0) AS SessionsUsingMemory
    FROM TokenMetrics
    WHERE CreatedAt >= DATEADD(DAY, -30, SYSUTCDATETIME());

    -- Ranking de agentes más activos
    SELECT TOP 10
        AgentName,
        COUNT(*) AS RunCount,
        SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) AS SuccessCount,
        SUM(CASE WHEN Status = 'failed'    THEN 1 ELSE 0 END) AS FailCount,
        AVG(CAST(DurationSeconds AS FLOAT)) AS AvgDurationSec
    FROM AgentHistory
    WHERE AgentName IS NOT NULL
    GROUP BY AgentName
    ORDER BY RunCount DESC;

    -- Lessons por tipo (últimas 30 días)
    SELECT LessonType, COUNT(*) AS Count
    FROM Lessons
    WHERE IsDeleted = 0 AND CreatedAt >= DATEADD(DAY, -30, SYSUTCDATETIME())
    GROUP BY LessonType;
END;
GO
PRINT 'sp_GetStatisticsV2 OK';
GO

-- ─────────────────────────────────────────────────────────────
-- 5. Confirmar que sp_UpdateQueueStatus funciona
-- ─────────────────────────────────────────────────────────────
PRINT '--- Verificación final ---';
SELECT
    OBJECT_NAME(object_id) AS SP_Name,
    create_date,
    modify_date
FROM sys.objects
WHERE type = 'P'
  AND OBJECT_NAME(object_id) IN ('sp_UpdateQueueStatus','sp_GetSnippets','sp_SaveSessionSummary','sp_GetStatisticsV2')
ORDER BY OBJECT_NAME(object_id);
GO
PRINT '✅ add_new_tools.sql completado';
GO
