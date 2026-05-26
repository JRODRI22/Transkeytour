-- ============================================================
-- JARVIS Memory DB — Schema
-- Base de datos para persistir estado entre sesiones de Jarvis.
-- Ejecutar UNA vez por máquina: sqlcmd -S localhost -i schema.sql
-- ============================================================

-- JarvisDB ya existe en localhost — solo asegurarse de usarla
USE [JarvisDB];
GO

-- ============================================================
-- Tabla: JarvisState
-- Rastrea el estado de cada fase por proyecto.
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JarvisState')
BEGIN
    CREATE TABLE [dbo].[JarvisState] (
        [Id]          UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
        [ProjectId]   NVARCHAR(100)     NOT NULL,
        [Phase]       NVARCHAR(50)      NOT NULL,   -- planning, database, backend, frontend, testing, security, done
        [PhaseOrder]  INT               NOT NULL,   -- 1-7
        [Status]      NVARCHAR(20)      NOT NULL DEFAULT 'pending',  -- pending, in_progress, completed, failed
        [Summary]     NVARCHAR(2000)    NULL,  -- resumen comprimido de decisiones/outputs
        [ErrorInfo]   NVARCHAR(1000)    NULL,  -- si status=failed, descripción del error
        [CreatedAt]   DATETIME2(7)      NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt]   DATETIME2(7)      NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_JarvisState] PRIMARY KEY ([Id]),
        CONSTRAINT [UQ_JarvisState_ProjectPhase] UNIQUE ([ProjectId], [Phase]),
        CONSTRAINT [CHK_JarvisState_Status] CHECK ([Status] IN ('pending','in_progress','completed','failed')),
        CONSTRAINT [CHK_JarvisState_Phase] CHECK ([Phase] IN ('planning','database','backend','frontend','review','devops','testing','security','done'))
    );

    CREATE INDEX [IX_JarvisState_ProjectId] ON [dbo].[JarvisState] ([ProjectId]);
    CREATE INDEX [IX_JarvisState_Status]    ON [dbo].[JarvisState] ([Status]) WHERE [Status] != 'completed';

    PRINT 'Tabla JarvisState creada.';
END
GO

-- ============================================================
-- Tabla: JarvisDecisions
-- Registro de decisiones arquitectónicas (ADR ligeros).
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JarvisDecisions')
BEGIN
    CREATE TABLE [dbo].[JarvisDecisions] (
        [Id]          UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
        [ProjectId]   NVARCHAR(100)     NOT NULL,
        [Phase]       NVARCHAR(50)      NOT NULL,
        [Category]    NVARCHAR(50)      NOT NULL,   -- architecture, pattern, config, security, tech
        [Decision]    NVARCHAR(500)     NOT NULL,
        [Rationale]   NVARCHAR(1000)    NULL,
        [CreatedAt]   DATETIME2(7)      NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_JarvisDecisions] PRIMARY KEY ([Id])
    );

    CREATE INDEX [IX_JarvisDecisions_ProjectId]  ON [dbo].[JarvisDecisions] ([ProjectId]);
    CREATE INDEX [IX_JarvisDecisions_Category]   ON [dbo].[JarvisDecisions] ([Category]);

    PRINT 'Tabla JarvisDecisions creada.';
END
GO

-- ============================================================
-- Tabla: JarvisFiles
-- Registra los archivos generados por Jarvis por proyecto/fase.
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JarvisFiles')
BEGIN
    CREATE TABLE [dbo].[JarvisFiles] (
        [Id]           UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
        [ProjectId]    NVARCHAR(100)     NOT NULL,
        [Phase]        NVARCHAR(50)      NOT NULL,
        [FilePath]     NVARCHAR(500)     NOT NULL,   -- path relativo al proyecto
        [FileSizeKB]   INT               NULL,
        [GeneratedAt]  DATETIME2(7)      NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_JarvisFiles] PRIMARY KEY ([Id]),
        CONSTRAINT [UQ_JarvisFiles_ProjectFile] UNIQUE ([ProjectId], [FilePath])
    );

    CREATE INDEX [IX_JarvisFiles_ProjectId] ON [dbo].[JarvisFiles] ([ProjectId]);
    CREATE INDEX [IX_JarvisFiles_Phase]     ON [dbo].[JarvisFiles] ([Phase]);

    PRINT 'Tabla JarvisFiles creada.';
END
GO

-- ============================================================
-- Tabla: ReviewCache
-- Cache de code review por hash de archivo.
-- ReviewAgent la consulta antes de revisar — si hash coincide y pasó, salta el archivo.
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReviewCache')
BEGIN
    CREATE TABLE [dbo].[ReviewCache] (
        [Id]          UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
        [ProjectId]   NVARCHAR(100)     NOT NULL,
        [FilePath]    NVARCHAR(500)     NOT NULL,
        [FileHash]    NVARCHAR(64)      NOT NULL,   -- SHA-256 del contenido del archivo
        [Status]      NVARCHAR(10)      NOT NULL,   -- 'passed' | 'failed'
        [FailedRules] NVARCHAR(2000)    NULL,        -- lista de reglas fallidas (JSON o texto)
        [ReviewedAt]  DATETIME2(7)      NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_ReviewCache] PRIMARY KEY ([Id]),
        CONSTRAINT [UQ_ReviewCache_ProjectFile] UNIQUE ([ProjectId], [FilePath]),
        CONSTRAINT [CHK_ReviewCache_Status] CHECK ([Status] IN ('passed','failed'))
    );

    CREATE INDEX [IX_ReviewCache_ProjectId] ON [dbo].[ReviewCache] ([ProjectId]);
    CREATE INDEX [IX_ReviewCache_FileHash]  ON [dbo].[ReviewCache] ([FileHash]);

    PRINT 'Tabla ReviewCache creada.';
END
GO

-- ============================================================
-- Tabla: JarvisProjects
-- Metadata de proyectos gestionados por Jarvis.
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JarvisProjects')
BEGIN
    CREATE TABLE [dbo].[JarvisProjects] (
        [Id]            UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
        [ProjectId]     NVARCHAR(100)     NOT NULL,   -- slug: 'tienda-artesanal'
        [DisplayName]   NVARCHAR(200)     NOT NULL,   -- 'Tienda Artesanal'
        [Stack]         NVARCHAR(200)     NULL,        -- '.NET 8 + Next.js 15 + SQL Server'
        [ProjectPath]   NVARCHAR(500)     NULL,        -- path en disco
        [CurrentPhase]  NVARCHAR(50)      NOT NULL DEFAULT 'planning',
        [IsCompleted]   BIT               NOT NULL DEFAULT 0,
        [CreatedAt]     DATETIME2(7)      NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt]     DATETIME2(7)      NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_JarvisProjects] PRIMARY KEY ([Id]),
        CONSTRAINT [UQ_JarvisProjects_ProjectId] UNIQUE ([ProjectId])
    );

    PRINT 'Tabla JarvisProjects creada.';
END
GO

-- ============================================================
-- View: vw_ProjectStatus
-- Resumen rápido del estado de todos los proyectos.
-- ============================================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ProjectStatus')
    DROP VIEW [dbo].[vw_ProjectStatus];
GO

CREATE VIEW [dbo].[vw_ProjectStatus] AS
SELECT
    p.ProjectId,
    p.DisplayName,
    p.Stack,
    p.CurrentPhase,
    p.IsCompleted,
    ISNULL(done.CompletedCount, 0)  AS PhasesCompleted,
    ISNULL(total.TotalCount, 0)     AS PhasesTotal,
    CAST(
        CASE WHEN ISNULL(total.TotalCount, 0) = 0 THEN 0
             ELSE (CAST(ISNULL(done.CompletedCount, 0) AS FLOAT) / total.TotalCount) * 100
        END AS DECIMAL(5,1)
    ) AS ProgressPct,
    p.CreatedAt,
    p.UpdatedAt
FROM [dbo].[JarvisProjects] p
LEFT JOIN (
    SELECT ProjectId, COUNT(*) AS CompletedCount
    FROM [dbo].[JarvisState]
    WHERE Status = 'completed'
    GROUP BY ProjectId
) done ON done.ProjectId = p.ProjectId
LEFT JOIN (
    SELECT ProjectId, COUNT(*) AS TotalCount
    FROM [dbo].[JarvisState]
    GROUP BY ProjectId
) total ON total.ProjectId = p.ProjectId;
GO

PRINT 'View vw_ProjectStatus creada.';
GO

-- ============================================================
-- SP: sp_GetProjectStatus
-- Llamado por Jarvis al inicio de cada sesión.
-- Uso: EXEC sp_GetProjectStatus 'tienda-artesanal'
-- ============================================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetProjectStatus')
    DROP PROCEDURE [dbo].[sp_GetProjectStatus];
GO

CREATE PROCEDURE [dbo].[sp_GetProjectStatus]
    @ProjectId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- Info del proyecto
    SELECT ProjectId, DisplayName, Stack, CurrentPhase, IsCompleted, ProgressPct
    FROM [dbo].[vw_ProjectStatus]
    WHERE ProjectId = @ProjectId;

    -- Estado por fase
    SELECT Phase, PhaseOrder, Status, Summary, UpdatedAt
    FROM [dbo].[JarvisState]
    WHERE ProjectId = @ProjectId
    ORDER BY PhaseOrder;

    -- Próxima fase pendiente
    SELECT TOP 1 Phase, PhaseOrder
    FROM [dbo].[JarvisState]
    WHERE ProjectId = @ProjectId AND Status = 'pending'
    ORDER BY PhaseOrder;
END
GO

PRINT 'SP sp_GetProjectStatus creado.';
GO

-- ============================================================
-- SP: sp_UpsertPhaseStatus
-- Marcar una fase como completada/fallida.
-- Uso: EXEC sp_UpsertPhaseStatus 'tienda-artesanal', 'database', 'completed', 'Schema creado: 7 tablas, 12 índices'
-- ============================================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_UpsertPhaseStatus')
    DROP PROCEDURE [dbo].[sp_UpsertPhaseStatus];
GO

CREATE PROCEDURE [dbo].[sp_UpsertPhaseStatus]
    @ProjectId  NVARCHAR(100),
    @Phase      NVARCHAR(50),
    @Status     NVARCHAR(20),
    @Summary    NVARCHAR(2000) = NULL,
    @ErrorInfo  NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @PhaseOrder INT = CASE @Phase
        WHEN 'planning'  THEN 1
        WHEN 'database'  THEN 2
        WHEN 'backend'   THEN 3
        WHEN 'frontend'  THEN 4
        WHEN 'review'    THEN 5
        WHEN 'devops'    THEN 6
        WHEN 'testing'   THEN 7
        WHEN 'security'  THEN 8
        WHEN 'done'      THEN 9
        ELSE 99
    END;

    MERGE [dbo].[JarvisState] AS target
    USING (VALUES (@ProjectId, @Phase, @PhaseOrder, @Status, @Summary, @ErrorInfo, GETUTCDATE()))
        AS source (ProjectId, Phase, PhaseOrder, Status, Summary, ErrorInfo, UpdatedAt)
    ON target.ProjectId = source.ProjectId AND target.Phase = source.Phase
    WHEN MATCHED THEN
        UPDATE SET
            Status    = source.Status,
            Summary   = source.Summary,
            ErrorInfo = source.ErrorInfo,
            UpdatedAt = source.UpdatedAt
    WHEN NOT MATCHED THEN
        INSERT (ProjectId, Phase, PhaseOrder, Status, Summary, ErrorInfo)
        VALUES (source.ProjectId, source.Phase, source.PhaseOrder, source.Status, source.Summary, source.ErrorInfo);

    -- Actualizar CurrentPhase en JarvisProjects si está completada
    IF @Status = 'completed'
    BEGIN
        UPDATE [dbo].[JarvisProjects]
        SET CurrentPhase = @Phase, UpdatedAt = GETUTCDATE()
        WHERE ProjectId = @ProjectId;
    END
END
GO

PRINT 'SP sp_UpsertPhaseStatus creado.';
PRINT '================================================';
PRINT 'JarvisDB configurada correctamente.';
PRINT 'Verificar: SELECT * FROM vw_ProjectStatus;';
PRINT '================================================';
GO
