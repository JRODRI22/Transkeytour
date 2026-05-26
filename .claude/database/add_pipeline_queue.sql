-- ============================================================
-- add_pipeline_queue.sql
-- Agrega la tabla PipelineQueue a JarvisDB.
-- Permite al OrchestratorAgent trackear sus decisiones de
-- delegación como "fuente de verdad" única, reemplazando state.json.
-- Ejecutar: sqlcmd -S localhost -d JarvisDB -E -C -i add_pipeline_queue.sql
-- ============================================================

USE JarvisDB;
GO

-- ── 1. Tabla PipelineQueue ────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PipelineQueue')
BEGIN
  CREATE TABLE dbo.PipelineQueue (
    Id              INT IDENTITY(1,1)  NOT NULL,
    ProjectName     NVARCHAR(200)      NOT NULL,
    AgentName       NVARCHAR(100)      NOT NULL,
    AgentNumber     TINYINT                NULL,
    Phase           NVARCHAR(50)       NOT NULL,   -- 'architecture','database','backend', etc.
    Status          NVARCHAR(20)       NOT NULL DEFAULT 'pending'  -- pending|running|done|failed|skipped
                    CONSTRAINT CHK_PQ_Status CHECK (Status IN ('pending','running','done','failed','skipped','gate_pending')),
    Priority        TINYINT            NOT NULL DEFAULT 5,          -- 1=highest, 10=lowest
    TriggerReason   NVARCHAR(500)          NULL,
    PayloadJson     NVARCHAR(MAX)          NULL,   -- Payload enviado al subagente (JSON)
    OutputJson      NVARCHAR(MAX)          NULL,   -- OUTPUT JSON retornado por el subagente
    QueuedAt        DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),
    StartedAt       DATETIME2              NULL,
    CompletedAt     DATETIME2              NULL,
    ErrorMessage    NVARCHAR(2000)         NULL,
    RetryCount      TINYINT            NOT NULL DEFAULT 0,
    IsDeleted       BIT                NOT NULL DEFAULT 0,

    CONSTRAINT PK_PipelineQueue PRIMARY KEY CLUSTERED (Id)
  );

  CREATE NONCLUSTERED INDEX IX_PQ_Project_Status
    ON dbo.PipelineQueue (ProjectName, Status, IsDeleted)
    INCLUDE (AgentName, Phase, Priority, QueuedAt);

  PRINT 'Tabla PipelineQueue creada OK';
END
ELSE
  PRINT 'Tabla PipelineQueue ya existe — sin cambios';
GO

-- ── 2. Columnas adicionales en ProjectStates ─────────────────
-- Agregar Entities y Artifacts si no existen, para descripción richer del proyecto

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ProjectStates') AND name = 'Entities')
BEGIN
  ALTER TABLE dbo.ProjectStates ADD Entities NVARCHAR(500) NULL;
  PRINT 'ProjectStates.Entities agregado';
END;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ProjectStates') AND name = 'Artifacts')
BEGIN
  ALTER TABLE dbo.ProjectStates ADD Artifacts NVARCHAR(1000) NULL;
  PRINT 'ProjectStates.Artifacts agregado';
END;
GO

-- ── 3. SP: sp_QueueAgent — encolar un agente ──────────────────
IF OBJECT_ID('dbo.sp_QueueAgent', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_QueueAgent;
GO

CREATE PROCEDURE dbo.sp_QueueAgent
  @ProjectName   NVARCHAR(200),
  @AgentName     NVARCHAR(100),
  @AgentNumber   TINYINT       = NULL,
  @Phase         NVARCHAR(50),
  @Priority      TINYINT       = 5,
  @TriggerReason NVARCHAR(500) = NULL,
  @PayloadJson   NVARCHAR(MAX) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.PipelineQueue
    (ProjectName, AgentName, AgentNumber, Phase, Priority, TriggerReason, PayloadJson)
  VALUES
    (@ProjectName, @AgentName, @AgentNumber, @Phase, @Priority, @TriggerReason, @PayloadJson);

  SELECT SCOPE_IDENTITY() AS NewQueueId;
END;
GO

-- ── 4. SP: sp_UpdateQueueStatus — actualizar estado de tarea ─
IF OBJECT_ID('dbo.sp_UpdateQueueStatus', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_UpdateQueueStatus;
GO

CREATE PROCEDURE dbo.sp_UpdateQueueStatus
  @QueueId      INT,
  @Status       NVARCHAR(20),
  @OutputJson   NVARCHAR(MAX) = NULL,
  @ErrorMessage NVARCHAR(2000) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.PipelineQueue
  SET
    Status       = @Status,
    OutputJson   = ISNULL(@OutputJson, OutputJson),
    ErrorMessage = @ErrorMessage,
    StartedAt    = CASE WHEN @Status = 'running'   THEN SYSUTCDATETIME() ELSE StartedAt   END,
    CompletedAt  = CASE WHEN @Status IN ('done','failed','skipped') THEN SYSUTCDATETIME() ELSE CompletedAt END,
    RetryCount   = CASE WHEN @Status = 'running' AND StartedAt IS NOT NULL THEN RetryCount + 1 ELSE RetryCount END
  WHERE Id = @QueueId;
END;
GO

-- ── 5. SP: sp_GetPipelineStatus — estado del pipeline ─────────
IF OBJECT_ID('dbo.sp_GetPipelineStatus', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_GetPipelineStatus;
GO

CREATE PROCEDURE dbo.sp_GetPipelineStatus
  @ProjectName NVARCHAR(200),
  @LastN       INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP (@LastN)
    Id, AgentName, Phase, Status, Priority,
    TriggerReason, QueuedAt, StartedAt, CompletedAt,
    RetryCount, ErrorMessage
  FROM dbo.PipelineQueue
  WHERE ProjectName = @ProjectName
    AND IsDeleted = 0
  ORDER BY QueuedAt DESC;
END;
GO

PRINT 'PipelineQueue SPs creados OK';
