-- ============================================================
-- add_skills_table.sql
-- Agrega la tabla Skills a JarvisDB para indexar las 120+ skills
-- del sistema. Permite a los agentes consultar sus skills via MCP.
-- Ejecutar contra JarvisDB en localhost
-- ============================================================

USE JarvisDB;
GO

-- ── 1. Tabla Skills ──────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Skills')
BEGIN
  CREATE TABLE dbo.Skills (
    Id          INT IDENTITY(1,1)    NOT NULL,
    SkillName   NVARCHAR(100)        NOT NULL,    -- carpeta/slug: 'systematic-debugging'
    Description NVARCHAR(1000)       NOT NULL,    -- primera línea de description en SKILL.md
    FilePath    NVARCHAR(500)        NOT NULL,    -- ruta absoluta al SKILL.md
    AgentsCsv   NVARCHAR(500)            NULL,    -- CSV de agentes que usan esta skill
    Category    NVARCHAR(50)         NOT NULL DEFAULT 'general',  -- backend, frontend, db, qa, devops, design, general
    IsActive    BIT                  NOT NULL DEFAULT 1,
    IsDeleted   BIT                  NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2            NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2            NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_Skills              PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_Skills_SkillName    UNIQUE (SkillName),
  );

  -- Índice para búsqueda por agente
  CREATE NONCLUSTERED INDEX IX_Skills_AgentsCsv
    ON dbo.Skills (IsDeleted, IsActive)
    INCLUDE (SkillName, Description, FilePath, AgentsCsv, Category);

  PRINT 'Tabla Skills creada OK';
END
ELSE
  PRINT 'Tabla Skills ya existe — sin cambios';
GO

-- ── 2. Stored Procedure: sp_GetSkillsForAgent ────────────────
IF OBJECT_ID('dbo.sp_GetSkillsForAgent', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_GetSkillsForAgent;
GO

CREATE PROCEDURE dbo.sp_GetSkillsForAgent
  @AgentName  NVARCHAR(100) = NULL,   -- NULL = todas las skills
  @Category   NVARCHAR(50)  = NULL,   -- NULL = todas las categorías
  @ActiveOnly BIT           = 1
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    Id, SkillName, Description, FilePath, AgentsCsv, Category, IsActive, UpdatedAt
  FROM dbo.Skills
  WHERE IsDeleted = 0
    AND (@ActiveOnly = 0 OR IsActive = 1)
    AND (@AgentName IS NULL
         OR AgentsCsv LIKE N'%' + @AgentName + N'%'
         OR AgentsCsv IS NULL)       -- NULL AgentsCsv = skill universal
    AND (@Category IS NULL OR Category = @Category)
  ORDER BY SkillName;
END;
GO

PRINT 'sp_GetSkillsForAgent creado OK';
