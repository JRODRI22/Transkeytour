-- ═══════════════════════════════════════════════════════════════
-- developer_enhancements.sql
-- Mejoras que solo son posibles con SQL Server Developer Edition
-- 1. Índices de búsqueda en MemoryNotes y Lessons
-- 2. sp_SearchMemory mejorado (multi-tabla, ranked, paginado)
-- 3. Tabla AI_Knowledge + sp_SaveKnowledge + sp_GetKnowledge
-- 4. Seed completo de los 22 agentes en tabla Agents
-- ═══════════════════════════════════════════════════════════════
USE JarvisDB;
GO

-- ─────────────────────────────────────────────────────────────
-- 1. ÍNDICES para búsquedas más rápidas
-- ─────────────────────────────────────────────────────────────
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MemoryNotes_Title_Content' AND object_id = OBJECT_ID('MemoryNotes'))
    CREATE INDEX IX_MemoryNotes_Title_Content
        ON MemoryNotes (IsDeleted, Importance DESC, CreatedAt DESC)
        INCLUDE (Title, Content, Tags, Category, ProjectName);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Lessons_Title_Desc' AND object_id = OBJECT_ID('Lessons'))
    CREATE INDEX IX_Lessons_Title_Desc
        ON Lessons (IsDeleted, CreatedAt DESC)
        INCLUDE (Title, Description, RootCause, Fix, Tags, LessonType, Severity, ProjectName);
GO
PRINT 'Índices de búsqueda OK';
GO

-- ─────────────────────────────────────────────────────────────
-- 2. sp_SearchMemory MEJORADO — multi-tabla, ranked, paginado
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('sp_SearchMemory', 'P') IS NOT NULL
    DROP PROCEDURE sp_SearchMemory;
GO
CREATE PROCEDURE sp_SearchMemory
    @Keywords    VARCHAR(500),
    @Category    VARCHAR(100) = NULL,
    @Top         INT          = 20,
    @ProjectName NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Limpiar keywords en múltiples tokens para relevance scoring
    DECLARE @K NVARCHAR(500) = LTRIM(RTRIM(@Keywords));

    -- RESULTADO 1: MemoryNotes (búsqueda en Title, Content, Tags)
    SELECT TOP (@Top)
        'note'            AS SourceType,
        CAST(Id AS NVARCHAR(50)) AS SourceId,
        Category,
        Title,
        LEFT(Content, 500) AS Snippet,
        Tags,
        Importance        AS Score,
        CreatedAt,
        -- Relevance: título match = mayor peso
        CASE
            WHEN Title   LIKE '%' + @K + '%' THEN 3
            WHEN Tags    LIKE '%' + @K + '%' THEN 2
            WHEN Content LIKE '%' + @K + '%' THEN 1
            ELSE 0
        END AS Relevance
    FROM MemoryNotes
    WHERE IsDeleted = 0
        AND (@Category    IS NULL OR Category    = @Category)
        AND (@ProjectName IS NULL OR ProjectName = @ProjectName)
        AND (
            Title   LIKE '%' + @K + '%' OR
            Tags    LIKE '%' + @K + '%' OR
            Content LIKE '%' + @K + '%'
        )
    ORDER BY Relevance DESC, Importance DESC, CreatedAt DESC;

    -- RESULTADO 2: Lessons (búsqueda en Title, Description, RootCause, Fix, Tags)
    SELECT TOP (@Top)
        'lesson'          AS SourceType,
        CAST(Id AS NVARCHAR(50)) AS SourceId,
        LessonType        AS Category,
        Title,
        LEFT(ISNULL(Description,'') + ' ' + ISNULL(RootCause,''), 500) AS Snippet,
        Tags,
        CAST(EvolutionScore AS INT) AS Score,
        CreatedAt,
        CASE
            WHEN Title       LIKE '%' + @K + '%' THEN 3
            WHEN Tags        LIKE '%' + @K + '%' THEN 2
            WHEN Description LIKE '%' + @K + '%' OR RootCause LIKE '%' + @K + '%' THEN 1
            ELSE 0
        END AS Relevance
    FROM Lessons
    WHERE IsDeleted = 0
        AND (@ProjectName IS NULL OR ProjectName = @ProjectName)
        AND (
            Title       LIKE '%' + @K + '%' OR
            Tags        LIKE '%' + @K + '%' OR
            Description LIKE '%' + @K + '%' OR
            RootCause   LIKE '%' + @K + '%' OR
            Fix         LIKE '%' + @K + '%'
        )
    ORDER BY Relevance DESC, CreatedAt DESC;

    -- RESULTADO 3: AI_Knowledge
    SELECT TOP (@Top)
        'knowledge'       AS SourceType,
        CAST(Id AS NVARCHAR(50)) AS SourceId,
        Category,
        Title,
        LEFT(Content, 500) AS Snippet,
        Tags,
        5                 AS Score,
        CreatedAt,
        CASE
            WHEN Title   LIKE '%' + @K + '%' THEN 3
            WHEN Tags    LIKE '%' + @K + '%' THEN 2
            WHEN Content LIKE '%' + @K + '%' THEN 1
            ELSE 0
        END AS Relevance
    FROM AI_Knowledge
    WHERE (
        Title   LIKE '%' + @K + '%' OR
        Tags    LIKE '%' + @K + '%' OR
        Content LIKE '%' + @K + '%'
    )
    ORDER BY Relevance DESC, CreatedAt DESC;
END;
GO
PRINT 'sp_SearchMemory mejorado OK';
GO

-- ─────────────────────────────────────────────────────────────
-- 3. sp_SaveKnowledge — Guardar en AI_Knowledge
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('sp_SaveKnowledge', 'P') IS NOT NULL
    DROP PROCEDURE sp_SaveKnowledge;
GO
CREATE PROCEDURE sp_SaveKnowledge
    @Category NVARCHAR(100),  -- architecture | pattern | convention | faq | howto | reference
    @Title    NVARCHAR(300),
    @Content  NVARCHAR(MAX),
    @Tags     NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- UPSERT por título dentro de la misma categoría
    MERGE AI_Knowledge AS target
    USING (SELECT @Category, @Title) AS src(Category, Title)
    ON target.Category = src.Category AND target.Title = src.Title
    WHEN MATCHED THEN
        UPDATE SET Content = @Content, Tags = @Tags
    WHEN NOT MATCHED THEN
        INSERT (Category, Title, Content, Tags, CreatedAt)
        VALUES (@Category, @Title, @Content, @Tags, SYSUTCDATETIME());
    SELECT @@ROWCOUNT AS AffectedRows;
END;
GO
PRINT 'sp_SaveKnowledge OK';
GO

-- ─────────────────────────────────────────────────────────────
-- 4. sp_GetKnowledge — Recuperar de AI_Knowledge
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('sp_GetKnowledge', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetKnowledge;
GO
CREATE PROCEDURE sp_GetKnowledge
    @Category NVARCHAR(100) = NULL,
    @Keywords NVARCHAR(300) = NULL,
    @Top      INT           = 20
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@Top)
        Id, Category, Title, Content, Tags, CreatedAt
    FROM AI_Knowledge
    WHERE
        (@Category IS NULL OR Category = @Category)
        AND (
            @Keywords IS NULL OR
            Title   LIKE '%' + @Keywords + '%' OR
            Content LIKE '%' + @Keywords + '%' OR
            Tags    LIKE '%' + @Keywords + '%'
        )
    ORDER BY
        CASE WHEN @Keywords IS NOT NULL AND Title LIKE '%' + @Keywords + '%' THEN 0 ELSE 1 END,
        CreatedAt DESC;
END;
GO
PRINT 'sp_GetKnowledge OK';
GO

-- ─────────────────────────────────────────────────────────────
-- 5. SEED completo de los 22 agentes en tabla Agents
-- ─────────────────────────────────────────────────────────────
MERGE dbo.Agents AS target
USING (VALUES
    ('OrchestratorAgent',    'Orchestrator',          'Coordinador central. Lee state.json, decide qué subagente lanzar, nunca genera código.'),
    ('ArchitectAgent',       'Software Architect',     'Diseña la arquitectura del sistema. Elige patrones, define módulos y contratos.'),
    ('DatabaseAgent',        'Database Administrator', 'Diseña tablas, optimiza queries, crea stored procedures y diseña índices.'),
    ('BackendAgent',         'Backend Developer',      'Crea APIs REST en .NET/C#, implementa lógica de negocio, integra BD y auth.'),
    ('FrontendAgent',        'Frontend Developer',     'Genera componentes React/Next.js, implementa UI/UX, gestiona estado y consume APIs.'),
    ('IntegrationAgent',     'Integration Engineer',   'Conecta frontend con backend: Axios, JWT interceptors, auth flow completo.'),
    ('ReviewAgent',          'Code Reviewer',          'Revisa código por calidad MUST/SHOULD/MAY. Retorna ReviewReport con confidence scores.'),
    ('DevOpsAgent',          'DevOps Engineer',        'Compila, genera Dockerfiles, docker-compose y ejecuta migraciones EF.'),
    ('SecurityAgent',        'Security Engineer',      'Audita OWASP Top 10, valida headers, JWT, CORS, SQL injection, XSS.'),
    ('QAAgent',              'QA Engineer',            'Crea pruebas xUnit + Moq, integración y cobertura. Valida lógica de negocio.'),
    ('DebugAgent',           'Debug Specialist',       'Diagnóstica y resuelve errores de build/run/test. Máx 3 reintentos.'),
    ('DocsAgent',            'Documentation Writer',   'Genera README, API docs, DEPLOYMENT_GUIDE y documentación técnica.'),
    ('MemorySyncAgent',      'Memory Synchronizer',    'Actualiza los 4 archivos Memory Bank y sincroniza estado al finalizar fases.'),
    ('CodeSearcherAgent',    'Code Searcher',          'Busca en el codebase usando Chain of Draft. Retorna mapa de ubicaciones.'),
    ('APIDiscoveryAgent',    'API Discovery',          'Recomienda APIs externas del registro api-registry.md para cada feature.'),
    ('SentinelAgent',        'Consistency Guardian',   'Verifica consistencia entre artefactos: routes↔controllers, schema↔models.'),
    ('EvolutionAgent',       'Evolution Engine',       'Auto-mejora del sistema: convierte lecciones en skills evolucionadas.'),
    ('ComponentLibraryAgent','Component Library',      'Instala componentes comunitarios vía claude-code-templates (MCPs, hooks, agents).'),
    ('FeatureDevAgent',      'Feature Developer',      'Agrega funcionalidades a proyectos existentes respetando la arquitectura actual.'),
    ('TestMasterAgent',      'Test Master',            'Testing 4 capas: xUnit unitarios, integración WebApplicationFactory, Playwright E2E, k6 load.'),
    ('DesignStudioAgent',    'Design Studio',          'UI 3D profesional: Three.js/R3F, GSAP, Framer Motion. Anti-AI-generic design system.'),
    ('CIPipelineAgent',      'CI Pipeline Engineer',   'Genera GitHub Actions para CI (build+test) y CD (staging/production) automáticos.')
) AS src(Name, Role, Description)
ON target.Name = src.Name
WHEN MATCHED THEN
    UPDATE SET Role = src.Role, Description = src.Description, UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT (Name, Role, Description, Status, IsEnabled, CreatedAt, UpdatedAt)
    VALUES (src.Name, src.Role, src.Description, 'idle', 1, SYSUTCDATETIME(), SYSUTCDATETIME());
GO
PRINT 'Seed 22 agentes OK';
GO

-- ─────────────────────────────────────────────────────────────
-- 6. Verificación final
-- ─────────────────────────────────────────────────────────────
SELECT COUNT(*) AS TotalAgents FROM Agents WHERE IsEnabled = 1;
SELECT OBJECT_NAME(object_id) AS SP FROM sys.objects WHERE type='P' AND OBJECT_NAME(object_id) IN ('sp_SearchMemory','sp_SaveKnowledge','sp_GetKnowledge') ORDER BY 1;
PRINT '✅ developer_enhancements.sql completado';
GO
