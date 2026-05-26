-- ============================================================
-- add_housekeeping.sql
-- sp_Housekeeping — limpieza periódica de datos obsoletos en JarvisDB
-- Elimina registros antiguos de tablas de alta rotación.
-- Seguro ejecutar periódicamente (no borra lecciones ni patrones core).
--
-- Ejecutar: sqlcmd -S localhost -d JarvisDB -E -C -i add_housekeeping.sql
-- ============================================================

USE JarvisDB;
GO

IF OBJECT_ID('dbo.sp_Housekeeping', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_Housekeeping;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE PROCEDURE dbo.sp_Housekeeping
  @SystemLogsRetentionDays  INT = 30,   -- SystemLogs: conservar N días
  @TokenMetricsRetentionDays INT = 90,  -- TokenMetrics: conservar N días
  @ReviewCacheRetentionDays INT = 14,   -- ReviewCache: conservar N días
  @PipelineQueueRetentionDays INT = 60, -- PipelineQueue done/skipped: conservar N días
  @MemoryNotesRetentionDays INT = 90,   -- MemoryNotes categoría 'session': conservar N días
  @ErrorHistoryRetentionDays INT = 120, -- ErrorHistory resueltos: conservar N días
  @DryRun BIT = 0                       -- 1 = solo reportar, no borrar
AS
BEGIN
  SET NOCOUNT ON;
  SET QUOTED_IDENTIFIER ON;

  DECLARE @CutoffSystemLogs  DATETIME2 = DATEADD(DAY, -@SystemLogsRetentionDays,  SYSUTCDATETIME());
  DECLARE @CutoffTokenMetrics DATETIME2 = DATEADD(DAY, -@TokenMetricsRetentionDays, SYSUTCDATETIME());
  DECLARE @CutoffReviewCache DATETIME2 = DATEADD(DAY, -@ReviewCacheRetentionDays,  SYSUTCDATETIME());
  DECLARE @CutoffPipeline    DATETIME2 = DATEADD(DAY, -@PipelineQueueRetentionDays, SYSUTCDATETIME());
  DECLARE @CutoffMemoryNotes DATETIME2 = DATEADD(DAY, -@MemoryNotesRetentionDays,  SYSUTCDATETIME());
  DECLARE @CutoffErrorHistory DATETIME2 = DATEADD(DAY, -@ErrorHistoryRetentionDays, SYSUTCDATETIME());

  DECLARE @DeletedSystemLogs  INT = 0;
  DECLARE @DeletedTokenMetrics INT = 0;
  DECLARE @DeletedReviewCache INT = 0;
  DECLARE @DeletedPipeline    INT = 0;
  DECLARE @DeletedMemoryNotes INT = 0;
  DECLARE @DeletedErrorHistory INT = 0;

  -- Contar ANTES (para DryRun y reporte)
  SELECT @DeletedSystemLogs  = COUNT(*) FROM dbo.SystemLogs    WHERE CreatedAt < @CutoffSystemLogs;
  SELECT @DeletedTokenMetrics = COUNT(*) FROM dbo.TokenMetrics  WHERE CreatedAt < @CutoffTokenMetrics;
  SELECT @DeletedPipeline    = COUNT(*) FROM dbo.PipelineQueue WHERE Status IN ('done','skipped','failed') AND CompletedAt < @CutoffPipeline;
  SELECT @DeletedErrorHistory = COUNT(*) FROM dbo.ErrorHistory  WHERE Solution IS NOT NULL AND CreatedAt < @CutoffErrorHistory;

  -- MemoryNotes season-scoped (importancia < 5)
  IF OBJECT_ID('dbo.MemoryNotes') IS NOT NULL
    SELECT @DeletedMemoryNotes = COUNT(*) FROM dbo.MemoryNotes
    WHERE Category = 'session' AND Importance < 5 AND CreatedAt < @CutoffMemoryNotes;

  -- ReviewCache
  IF OBJECT_ID('dbo.ReviewCache') IS NOT NULL
    SELECT @DeletedReviewCache = COUNT(*) FROM dbo.ReviewCache WHERE ReviewedAt < @CutoffReviewCache;

  IF @DryRun = 0
  BEGIN
    -- SystemLogs: logs viejos de nivel debug/info
    DELETE FROM dbo.SystemLogs
    WHERE CreatedAt < @CutoffSystemLogs AND Level IN ('debug','info');

    -- TokenMetrics: métricas históricas compactadas
    DELETE FROM dbo.TokenMetrics WHERE CreatedAt < @CutoffTokenMetrics;

    -- ReviewCache: revisiones obsoletas
    IF OBJECT_ID('dbo.ReviewCache') IS NOT NULL
      DELETE FROM dbo.ReviewCache WHERE ReviewedAt < @CutoffReviewCache;

    -- PipelineQueue: tareas terminadas/fallidas antiguas
    UPDATE dbo.PipelineQueue SET IsDeleted = 1
    WHERE Status IN ('done','skipped','failed')
      AND CompletedAt < @CutoffPipeline;

    -- MemoryNotes de sesión de baja importancia
    IF OBJECT_ID('dbo.MemoryNotes') IS NOT NULL
      DELETE FROM dbo.MemoryNotes
      WHERE Category = 'session' AND Importance < 5 AND CreatedAt < @CutoffMemoryNotes;

    -- ErrorHistory: errores resueltos viejos
    DELETE FROM dbo.ErrorHistory WHERE Solution IS NOT NULL AND CreatedAt < @CutoffErrorHistory;
  END;

  -- Reporte de resultados
  SELECT
    CASE @DryRun WHEN 1 THEN 'DRY_RUN (nada fue eliminado)' ELSE 'EJECUTADO' END AS Modo,
    @DeletedSystemLogs   AS SystemLogs_a_purgar,
    @DeletedTokenMetrics AS TokenMetrics_a_purgar,
    @DeletedReviewCache  AS ReviewCache_a_purgar,
    @DeletedPipeline     AS PipelineQueue_a_marcar_deleted,
    @DeletedMemoryNotes  AS MemoryNotes_session_a_purgar,
    @DeletedErrorHistory AS ErrorHistory_resueltos_a_purgar,
    (@DeletedSystemLogs + @DeletedTokenMetrics + @DeletedReviewCache +
     @DeletedPipeline   + @DeletedMemoryNotes + @DeletedErrorHistory) AS Total_registros;
END;
GO

PRINT 'sp_Housekeeping creado OK';
PRINT 'Uso: EXEC sp_Housekeeping;                     -- purga normal';
PRINT 'Uso: EXEC sp_Housekeeping @DryRun = 1;         -- solo reporte';
PRINT 'Uso: EXEC sp_Housekeeping @SystemLogsRetentionDays = 7;  -- agresivo';
GO

-- Verificar que funciona con DryRun
EXEC dbo.sp_Housekeeping @DryRun = 1;
