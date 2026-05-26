-- ============================================================
-- agentbrain_schema.sql — Schema completo de JarvisDB
-- Motor de auto-aprendizaje y ahorro de tokens para los agentes
--
-- EJECUTAR: sqlcmd -S localhost -E -No -i agentbrain_schema.sql -b
-- IDEMPOTENTE: seguro ejecutar múltiples veces sin duplicar datos
-- ============================================================

-- Necesario para índices filtrados y vistas indexadas
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ARITHABORT ON;

-- Crear BD JarvisDB si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'JarvisDB')
    CREATE DATABASE [JarvisDB];
GO

USE [JarvisDB];
GO

-- ============================================================
-- TABLA 1: Lessons — Bugs resueltos + lecciones aprendidas
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Lessons' AND xtype = 'U')
CREATE TABLE Lessons (
    Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Lessons PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    LessonType      NVARCHAR(20)     NOT NULL CONSTRAINT CHK_Lessons_Type
                        CHECK (LessonType IN ('bugfix', 'antipattern', 'pattern', 'decision')),
    SourceAgent     NVARCHAR(100)    NOT NULL,
    Title           NVARCHAR(200)    NOT NULL,
    Description     NVARCHAR(1000)   NOT NULL,
    RootCause       NVARCHAR(500)    NULL,
    Fix             NVARCHAR(1000)   NULL,
    Severity        NVARCHAR(20)     NOT NULL CONSTRAINT CHK_Lessons_Severity
                        CHECK (Severity IN ('error', 'warning', 'info')),
    Scope           NVARCHAR(20)     NOT NULL CONSTRAINT CHK_Lessons_Scope
                        CHECK (Scope IN ('global', 'stack', 'project')),
    ProjectName     NVARCHAR(200)    NULL,      -- null = lección global
    Stack           NVARCHAR(100)    NULL,       -- 'dotnet', 'react', 'sql', 'azure', etc.
    Tags            NVARCHAR(500)    NULL,       -- CSV: 'jwt,auth,axios'
    AppliesToAgents NVARCHAR(500)    NULL,       -- CSV: 'BackendAgent,IntegrationAgent'
    FilesAffected   NVARCHAR(1000)   NULL,       -- CSV de rutas de archivos
    SkillPath       NVARCHAR(300)    NULL,       -- ruta del .md generado si aplica
    EvolutionScore  DECIMAL(5,2)     NULL,
    IsDeleted       BIT              NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- ============================================================
-- TABLA 2: Patterns — Patrones de código verificados
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Patterns' AND xtype = 'U')
CREATE TABLE Patterns (
    Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Patterns PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    PatternId       NVARCHAR(20)     NOT NULL,   -- 'PAT-001', 'PAT-002'
    Name            NVARCHAR(200)    NOT NULL,
    Description     NVARCHAR(500)    NOT NULL,
    Language        NVARCHAR(50)     NOT NULL,   -- 'csharp', 'javascript', 'sql', 'react', 'any'
    CodeExample     NVARCHAR(MAX)    NULL,
    WhyItWorks      NVARCHAR(500)    NULL,
    WhenToUse       NVARCHAR(500)    NULL,
    WhenNotToUse    NVARCHAR(500)    NULL,
    RelatedAgent    NVARCHAR(200)    NULL,
    UsageCount      INT              NOT NULL DEFAULT 0,
    IsDeleted       BIT              NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Patterns_PatternId UNIQUE (PatternId)
);
GO

-- ============================================================
-- TABLA 3: Decisions — ADRs por proyecto
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Decisions' AND xtype = 'U')
CREATE TABLE Decisions (
    Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Decisions PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    AdrId           NVARCHAR(20)     NOT NULL,    -- 'ADR-001', 'ADR-002'
    Title           NVARCHAR(200)    NOT NULL,
    Context         NVARCHAR(1000)   NOT NULL,
    Decision        NVARCHAR(1000)   NOT NULL,
    Rationale       NVARCHAR(1000)   NULL,
    Alternatives    NVARCHAR(1000)   NULL,
    Consequences    NVARCHAR(500)    NULL,
    Status          NVARCHAR(20)     NOT NULL CONSTRAINT CHK_Decisions_Status
                        CHECK (Status IN ('proposed', 'accepted', 'deprecated', 'superseded')),
    ProjectName     NVARCHAR(200)    NULL,         -- null = decisión global
    SupersededBy    NVARCHAR(20)     NULL,          -- AdrId del ADR sucesor
    IsDeleted       BIT              NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Decisions_AdrId_Project UNIQUE (AdrId, ProjectName)
);
GO

-- ============================================================
-- TABLA 4: AgentHistory — Log de ejecución de agentes
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'AgentHistory' AND xtype = 'U')
CREATE TABLE AgentHistory (
    Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AgentHistory PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    RunId           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),   -- id de sesión/run
    AgentName       NVARCHAR(100)    NOT NULL,
    AgentNumber     TINYINT          NULL,   -- 0-18
    ProjectName     NVARCHAR(200)    NOT NULL,
    TriggerReason   NVARCHAR(500)    NULL,
    Status          NVARCHAR(20)     NOT NULL CONSTRAINT CHK_AgentHistory_Status
                        CHECK (Status IN ('started', 'completed', 'failed', 'gate_pending')),
    Phase           NVARCHAR(50)     NULL,   -- 'architecture', 'database', 'backend', etc.
    FilesGenerated  NVARCHAR(MAX)    NULL,   -- JSON array de rutas
    ErrorMessage    NVARCHAR(2000)   NULL,   -- si status = 'failed'
    DurationSeconds INT              NULL,
    TokensEstimate  INT              NULL,   -- estimado de tokens consumidos
    RetryAttempt    TINYINT          NOT NULL DEFAULT 0,
    StartedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CompletedAt     DATETIME2        NULL
);
GO

-- ============================================================
-- TABLA 5: ProjectStates — state.json normalizado en DB
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'ProjectStates' AND xtype = 'U')
CREATE TABLE ProjectStates (
    Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ProjectStates PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    ProjectName     NVARCHAR(200)    NOT NULL,
    ProjectPath     NVARCHAR(500)    NULL,
    Stack           NVARCHAR(200)    NULL,
    ActivePhase     NVARCHAR(50)     NULL,
    LastAgent       NVARCHAR(100)    NULL,
    CompletedPhases NVARCHAR(500)    NULL,   -- CSV: 'architecture,database,backend'
    PendingGates    NVARCHAR(500)    NULL,
    StateJson       NVARCHAR(MAX)    NULL,   -- JSON completo del state.json como backup
    TokensSaved     INT              NOT NULL DEFAULT 0,  -- tokens ahorrados en esta sesión
    IsActive        BIT              NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    LastSyncAt      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_ProjectStates_ProjectName UNIQUE (ProjectName)
);
GO

-- ============================================================
-- TABLA 6: Snippets — Biblioteca de código reutilizable
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Snippets' AND xtype = 'U')
CREATE TABLE Snippets (
    Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Snippets PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    SnippetType     NVARCHAR(50)     NOT NULL CONSTRAINT CHK_Snippets_Type
                        CHECK (SnippetType IN ('function', 'component', 'config', 'sql', 'migration', 'test', 'hook', 'other')),
    Name            NVARCHAR(200)    NOT NULL,
    Description     NVARCHAR(500)    NOT NULL,
    Code            NVARCHAR(MAX)    NOT NULL,
    Language        NVARCHAR(50)     NOT NULL,   -- 'csharp', 'javascript', 'typescript', 'sql', 'powershell'
    Framework       NVARCHAR(100)    NULL,       -- 'aspnetcore', 'react', 'ef-core', etc.
    Tags            NVARCHAR(500)    NULL,
    SourceAgent     NVARCHAR(100)    NULL,
    UsageCount      INT              NOT NULL DEFAULT 0,
    IsVerified      BIT              NOT NULL DEFAULT 0,  -- verificado como funcional
    IsDeleted       BIT              NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- ============================================================
-- MIGRACIONES IDEMPOTENTES — Agregan columnas faltantes a tablas existentes
-- Necesario si el DB ya fue creado por una versión anterior del schema.
-- Seguro ejecutar múltiples veces: IF NOT EXISTS previene duplicados.
-- ============================================================

-- Lessons: columnas agregadas en versiones posteriores al schema inicial
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lessons') AND name = 'ProjectName')
    ALTER TABLE Lessons ADD ProjectName NVARCHAR(200) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lessons') AND name = 'Stack')
    ALTER TABLE Lessons ADD Stack NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lessons') AND name = 'Tags')
    ALTER TABLE Lessons ADD Tags NVARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lessons') AND name = 'AppliesToAgents')
    ALTER TABLE Lessons ADD AppliesToAgents NVARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lessons') AND name = 'FilesAffected')
    ALTER TABLE Lessons ADD FilesAffected NVARCHAR(1000) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lessons') AND name = 'SkillPath')
    ALTER TABLE Lessons ADD SkillPath NVARCHAR(300) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lessons') AND name = 'EvolutionScore')
    ALTER TABLE Lessons ADD EvolutionScore DECIMAL(5,2) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lessons') AND name = 'IsDeleted')
    ALTER TABLE Lessons ADD IsDeleted BIT NOT NULL DEFAULT 0;
GO

-- Patterns: columnas de soft-delete
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Patterns') AND name = 'IsDeleted')
    ALTER TABLE Patterns ADD IsDeleted BIT NOT NULL DEFAULT 0;
GO

-- Decisions: columnas de referencia cruzada y soft-delete
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Decisions') AND name = 'ProjectName')
    ALTER TABLE Decisions ADD ProjectName NVARCHAR(200) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Decisions') AND name = 'SupersededBy')
    ALTER TABLE Decisions ADD SupersededBy NVARCHAR(20) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Decisions') AND name = 'IsDeleted')
    ALTER TABLE Decisions ADD IsDeleted BIT NOT NULL DEFAULT 0;
GO

-- ProjectStates: columnas de estado activo
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ProjectStates') AND name = 'IsActive')
    ALTER TABLE ProjectStates ADD IsActive BIT NOT NULL DEFAULT 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ProjectStates') AND name = 'LastSyncAt')
    ALTER TABLE ProjectStates ADD LastSyncAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
GO

-- Snippets: columnas relacionadas
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Snippets') AND name = 'IsDeleted')
    ALTER TABLE Snippets ADD IsDeleted BIT NOT NULL DEFAULT 0;
GO

-- ============================================================
-- TABLA 7: EvolvedSkills — Metadata de skills generadas por EvolutionAgent
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'EvolvedSkills' AND xtype = 'U')
CREATE TABLE EvolvedSkills (
    Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_EvolvedSkills PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    SkillName       NVARCHAR(200)    NOT NULL,
    Version         TINYINT          NOT NULL DEFAULT 1,
    FilePath        NVARCHAR(500)    NOT NULL,           -- ruta al .md en .claude/skills/evolved/
    SourceLessonId  UNIQUEIDENTIFIER NULL CONSTRAINT FK_EvolvedSkills_Lesson
                        REFERENCES Lessons(Id),
    AgentsApplied   NVARCHAR(500)    NULL,               -- CSV de agentes donde se inyectó
    EvolutionDelta  DECIMAL(5,2)     NULL,               -- mejora de score aportada
    UsageCount      INT              NOT NULL DEFAULT 0,
    DecayAt         DATETIME2        NULL,               -- fecha expiración/revisión (30 días)
    IsActive        BIT              NOT NULL DEFAULT 1,
    IsDeleted       BIT              NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_EvolvedSkills_Name_Version UNIQUE (SkillName, Version)
);
GO

-- ============================================================
-- ÍNDICES para rendimiento
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lessons_Type_Scope_Stack')
    CREATE INDEX IX_Lessons_Type_Scope_Stack ON Lessons (LessonType, Scope, Stack)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lessons_ProjectName')
    CREATE INDEX IX_Lessons_ProjectName ON Lessons (ProjectName)
        WHERE IsDeleted = 0 AND ProjectName IS NOT NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lessons_CreatedAt')
    CREATE INDEX IX_Lessons_CreatedAt ON Lessons (CreatedAt DESC)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Patterns_Language')
    CREATE INDEX IX_Patterns_Language ON Patterns (Language)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Decisions_Status_Project')
    CREATE INDEX IX_Decisions_Status_Project ON Decisions (Status, ProjectName)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AgentHistory_ProjectName_StartedAt')
    CREATE INDEX IX_AgentHistory_ProjectName_StartedAt ON AgentHistory (ProjectName, StartedAt DESC);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Snippets_Language_Type')
    CREATE INDEX IX_Snippets_Language_Type ON Snippets (Language, SnippetType)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EvolvedSkills_Active')
    CREATE INDEX IX_EvolvedSkills_Active ON EvolvedSkills (IsActive, DecayAt)
        WHERE IsActive = 1 AND IsDeleted = 0;
GO

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- sp_SaveLesson: INSERT o UPDATE idempotente de lección
CREATE OR ALTER PROCEDURE sp_SaveLesson
    @LessonType     NVARCHAR(20),
    @SourceAgent    NVARCHAR(100),
    @Title          NVARCHAR(200),
    @Description    NVARCHAR(1000),
    @RootCause      NVARCHAR(500)  = NULL,
    @Fix            NVARCHAR(1000) = NULL,
    @Severity       NVARCHAR(20),
    @Scope          NVARCHAR(20),
    @ProjectName    NVARCHAR(200)  = NULL,
    @Stack          NVARCHAR(100)  = NULL,
    @Tags           NVARCHAR(500)  = NULL,
    @AppliesToAgents NVARCHAR(500) = NULL,
    @FilesAffected  NVARCHAR(1000) = NULL,
    @SkillPath      NVARCHAR(300)  = NULL,
    @NewId          UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @NewId = NEWID();
    INSERT INTO Lessons
        (Id, LessonType, SourceAgent, Title, Description, RootCause, Fix, Severity, Scope,
         ProjectName, Stack, Tags, AppliesToAgents, FilesAffected, SkillPath)
    VALUES
        (@NewId, @LessonType, @SourceAgent, @Title, @Description, @RootCause, @Fix, @Severity, @Scope,
         @ProjectName, @Stack, @Tags, @AppliesToAgents, @FilesAffected, @SkillPath);
END;
GO

-- sp_GetContext: retorna contexto relevante (máx tokens) para una tarea
-- Prioridad: mismo proyecto > mismo stack > global > recientes 30 días
CREATE OR ALTER PROCEDURE sp_GetContext
    @TaskDescription    NVARCHAR(500),
    @ProjectName        NVARCHAR(200) = NULL,
    @Stack              NVARCHAR(100) = NULL,
    @MaxResults         TINYINT       = 8
AS
BEGIN
    SET NOCOUNT ON;
    -- Lessons relevantes: proyecto + stack + global, ordenadas por pertinencia
    SELECT TOP (@MaxResults)
        'lesson'    AS ResultType,
        l.Id,
        l.LessonType,
        l.Title,
        l.Description,
        l.RootCause,
        l.Fix,
        l.Severity,
        l.Tags,
        l.CreatedAt,
        CASE
            WHEN l.ProjectName = @ProjectName THEN 3
            WHEN l.Stack = @Stack             THEN 2
            WHEN l.Scope = 'global'           THEN 1
            ELSE 0
        END AS Relevance
    FROM Lessons l
    WHERE l.IsDeleted = 0
      AND (
          l.ProjectName = @ProjectName
          OR l.Stack = @Stack
          OR l.Scope = 'global'
          OR l.CreatedAt >= DATEADD(DAY, -30, SYSUTCDATETIME())
      )
    ORDER BY Relevance DESC, l.CreatedAt DESC;

    -- Patterns relevantes
    SELECT TOP 5
        PatternId, Name, Description, Language, WhyItWorks
    FROM Patterns
    WHERE IsDeleted = 0
      AND (Language = @Stack OR Language = 'any')
    ORDER BY UsageCount DESC, CreatedAt DESC;
END;
GO

-- sp_SyncProjectState: UPSERT del estado del proyecto
CREATE OR ALTER PROCEDURE sp_SyncProjectState
    @ProjectName        NVARCHAR(200),
    @ProjectPath        NVARCHAR(500) = NULL,
    @Stack              NVARCHAR(200) = NULL,
    @ActivePhase        NVARCHAR(50)  = NULL,
    @LastAgent          NVARCHAR(100) = NULL,
    @CompletedPhases    NVARCHAR(500) = NULL,
    @PendingGates       NVARCHAR(500) = NULL,
    @StateJson          NVARCHAR(MAX) = NULL,
    @TokensSavedDelta   INT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM ProjectStates WHERE ProjectName = @ProjectName)
        UPDATE ProjectStates SET
            ProjectPath    = COALESCE(@ProjectPath, ProjectPath),
            Stack          = COALESCE(@Stack, Stack),
            ActivePhase    = COALESCE(@ActivePhase, ActivePhase),
            LastAgent      = COALESCE(@LastAgent, LastAgent),
            CompletedPhases = COALESCE(@CompletedPhases, CompletedPhases),
            PendingGates   = COALESCE(@PendingGates, PendingGates),
            StateJson      = COALESCE(@StateJson, StateJson),
            TokensSaved    = TokensSaved + @TokensSavedDelta,
            LastSyncAt     = SYSUTCDATETIME()
        WHERE ProjectName = @ProjectName;
    ELSE
        INSERT INTO ProjectStates
            (ProjectName, ProjectPath, Stack, ActivePhase, LastAgent, CompletedPhases, PendingGates, StateJson, TokensSaved)
        VALUES
            (@ProjectName, @ProjectPath, @Stack, @ActivePhase, @LastAgent, @CompletedPhases, @PendingGates, @StateJson, @TokensSavedDelta);
END;
GO

-- sp_IncrementPatternUsage
CREATE OR ALTER PROCEDURE sp_IncrementPatternUsage
    @PatternId NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Patterns SET UsageCount = UsageCount + 1, UpdatedAt = SYSUTCDATETIME()
    WHERE PatternId = @PatternId AND IsDeleted = 0;
END;
GO

-- ============================================================
-- VISTAS para dashboard y consultas rápidas
-- ============================================================

CREATE OR ALTER VIEW vw_RecentLessons AS
    SELECT TOP (50)
        LessonType, Title, Description, Fix, Severity, Scope, Stack, ProjectName, Tags, CreatedAt
    FROM Lessons
    WHERE IsDeleted = 0
    ORDER BY CreatedAt DESC;
GO

CREATE OR ALTER VIEW vw_ProjectSummary AS
    SELECT
        ps.ProjectName,
        ps.Stack,
        ps.ActivePhase,
        ps.LastAgent,
        ps.LastSyncAt,
        ps.TokensSaved,
        COUNT(DISTINCT l.Id)  AS LessonCount,
        COUNT(DISTINCT d.Id)  AS DecisionCount,
        COUNT(DISTINCT h.Id)  AS AgentRuns
    FROM ProjectStates ps
    LEFT JOIN Lessons   l ON l.ProjectName = ps.ProjectName AND l.IsDeleted = 0
    LEFT JOIN Decisions d ON d.ProjectName = ps.ProjectName AND d.IsDeleted = 0
    LEFT JOIN AgentHistory h ON h.ProjectName = ps.ProjectName
    WHERE ps.IsActive = 1
    GROUP BY ps.ProjectName, ps.Stack, ps.ActivePhase, ps.LastAgent, ps.LastSyncAt, ps.TokensSaved;
GO

CREATE OR ALTER VIEW vw_TopPatterns AS
    SELECT PatternId, Name, Language, Description, UsageCount, UpdatedAt
    FROM Patterns
    WHERE IsDeleted = 0;
GO

-- ============================================================
-- TABLA 8: ReviewCache — Evita re-revisar archivos sin cambios
-- Permite al ReviewAgent saltar archivos cuyo SHA-256 no cambió
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'ReviewCache' AND xtype = 'U')
CREATE TABLE ReviewCache (
    Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ReviewCache PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    ProjectName     NVARCHAR(200)    NOT NULL,
    FilePath        NVARCHAR(500)    NOT NULL,
    Sha256          NVARCHAR(64)     NOT NULL,   -- hash del contenido del archivo
    ReviewedAt      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    ReviewScore     TINYINT          NULL,        -- 0-100 (null = no score emitido)
    IssuesFound     INT              NOT NULL DEFAULT 0,
    MustFix         INT              NOT NULL DEFAULT 0,
    ShouldFix       INT              NOT NULL DEFAULT 0,
    SkippedReason   NVARCHAR(200)    NULL,        -- 'hash_match' | 'excluded_pattern' | null
    AgentVersion    NVARCHAR(20)     NULL,        -- versión del ReviewAgent que lo revisó
    IsDeleted       BIT              NOT NULL DEFAULT 0,
    CONSTRAINT UQ_ReviewCache_Project_File UNIQUE (ProjectName, FilePath)
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ReviewCache_Project_File')
    CREATE INDEX IX_ReviewCache_Project_File ON ReviewCache (ProjectName, FilePath)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ReviewCache_ReviewedAt')
    CREATE INDEX IX_ReviewCache_ReviewedAt ON ReviewCache (ReviewedAt DESC)
        WHERE IsDeleted = 0;
GO

-- sp_CheckReviewCache: devuelve si un archivo puede ser saltado
CREATE OR ALTER PROCEDURE sp_CheckReviewCache
    @ProjectName    NVARCHAR(200),
    @FilePath       NVARCHAR(500),
    @Sha256         NVARCHAR(64),
    @CanSkip        BIT OUTPUT,
    @PreviousScore  TINYINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @CanSkip = 0;
    SET @PreviousScore = NULL;
    SELECT @CanSkip = CASE WHEN Sha256 = @Sha256 THEN 1 ELSE 0 END,
           @PreviousScore = ReviewScore
    FROM ReviewCache
    WHERE ProjectName = @ProjectName AND FilePath = @FilePath AND IsDeleted = 0;
END;
GO

-- sp_UpsertReviewCache: guarda o actualiza el hash de revisión
CREATE OR ALTER PROCEDURE sp_UpsertReviewCache
    @ProjectName    NVARCHAR(200),
    @FilePath       NVARCHAR(500),
    @Sha256         NVARCHAR(64),
    @ReviewScore    TINYINT  = NULL,
    @IssuesFound    INT      = 0,
    @MustFix        INT      = 0,
    @ShouldFix      INT      = 0,
    @AgentVersion   NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM ReviewCache WHERE ProjectName = @ProjectName AND FilePath = @FilePath AND IsDeleted = 0)
        UPDATE ReviewCache SET
            Sha256       = @Sha256,
            ReviewedAt   = SYSUTCDATETIME(),
            ReviewScore  = COALESCE(@ReviewScore, ReviewScore),
            IssuesFound  = @IssuesFound,
            MustFix      = @MustFix,
            ShouldFix    = @ShouldFix,
            AgentVersion = COALESCE(@AgentVersion, AgentVersion)
        WHERE ProjectName = @ProjectName AND FilePath = @FilePath AND IsDeleted = 0;
    ELSE
        INSERT INTO ReviewCache (ProjectName, FilePath, Sha256, ReviewScore, IssuesFound, MustFix, ShouldFix, AgentVersion)
        VALUES (@ProjectName, @FilePath, @Sha256, @ReviewScore, @IssuesFound, @MustFix, @ShouldFix, @AgentVersion);
END;
GO

-- ============================================================
-- TABLA 9: CIRunHistory — Historial de pipelines CI/CD
-- Permite al CIPipelineAgent y OrchestratorAgent ver tendencias
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'CIRunHistory' AND xtype = 'U')
CREATE TABLE CIRunHistory (
    Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CIRunHistory PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    ProjectName     NVARCHAR(200)    NOT NULL,
    RunId           NVARCHAR(100)    NULL,        -- ID externo del pipeline (GitHub Actions run_id)
    Platform        NVARCHAR(50)     NOT NULL CONSTRAINT CHK_CI_Platform
                        CHECK (Platform IN ('github_actions', 'azure_devops', 'gitlab_ci', 'jenkins', 'local')),
    Branch          NVARCHAR(200)    NULL,
    CommitSha       NVARCHAR(40)     NULL,
    CommitMessage   NVARCHAR(500)    NULL,
    TriggerEvent    NVARCHAR(50)     NULL,        -- 'push', 'pull_request', 'manual', 'schedule'
    Stage           NVARCHAR(50)     NOT NULL CONSTRAINT CHK_CI_Stage
                        CHECK (Stage IN ('build', 'test', 'security', 'deploy_staging', 'deploy_production', 'all')),
    Status          NVARCHAR(20)     NOT NULL CONSTRAINT CHK_CI_Status
                        CHECK (Status IN ('queued', 'running', 'passed', 'failed', 'cancelled', 'skipped')),
    TestsPassed     INT              NULL,
    TestsFailed     INT              NULL,
    TestsCoverage   DECIMAL(5,2)     NULL,        -- porcentaje (0-100)
    BuildDurationSec INT             NULL,
    SecurityIssues  INT              NULL,
    DeployedTo      NVARCHAR(100)    NULL,        -- 'staging.myapp.com' | 'myapp.com' | null
    ErrorSummary    NVARCHAR(1000)   NULL,
    ArtifactUrl     NVARCHAR(500)    NULL,
    TriggeredBy     NVARCHAR(200)    NULL,        -- nombre del agente o usuario
    StartedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CompletedAt     DATETIME2        NULL,
    IsDeleted       BIT              NOT NULL DEFAULT 0
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CIRunHistory_Project_StartedAt')
    CREATE INDEX IX_CIRunHistory_Project_StartedAt ON CIRunHistory (ProjectName, StartedAt DESC)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CIRunHistory_Status')
    CREATE INDEX IX_CIRunHistory_Status ON CIRunHistory (Status, StartedAt DESC)
        WHERE IsDeleted = 0;
GO

-- sp_GetCISummary: tendencia de los últimos N runs de un proyecto
CREATE OR ALTER PROCEDURE sp_GetCISummary
    @ProjectName    NVARCHAR(200),
    @LastN          TINYINT = 10
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@LastN)
        Stage, Status, Branch, CommitSha, TestsPassed, TestsFailed,
        TestsCoverage, BuildDurationSec, SecurityIssues, ErrorSummary, StartedAt
    FROM CIRunHistory
    WHERE ProjectName = @ProjectName AND IsDeleted = 0
    ORDER BY StartedAt DESC;

    -- Resumen estadístico
    SELECT
        COUNT(*)                                                         AS TotalRuns,
        SUM(CASE WHEN Status = 'passed'  THEN 1 ELSE 0 END)            AS Passed,
        SUM(CASE WHEN Status = 'failed'  THEN 1 ELSE 0 END)            AS Failed,
        CAST(100.0 * SUM(CASE WHEN Status = 'passed' THEN 1 ELSE 0 END)
             / NULLIF(COUNT(*), 0) AS DECIMAL(5,2))                     AS PassRate,
        AVG(TestsCoverage)                                               AS AvgCoverage,
        AVG(CAST(BuildDurationSec AS FLOAT))                            AS AvgBuildSec
    FROM CIRunHistory
    WHERE ProjectName = @ProjectName AND IsDeleted = 0;
END;
GO


PRINT 'Tablas: Lessons, Patterns, Decisions, AgentHistory, ProjectStates, Snippets, EvolvedSkills, ReviewCache, CIRunHistory';
PRINT 'Stored Procedures: sp_SaveLesson, sp_GetContext, sp_SyncProjectState, sp_IncrementPatternUsage';
PRINT 'Vistas: vw_RecentLessons, vw_ProjectSummary, vw_TopPatterns';
GO
