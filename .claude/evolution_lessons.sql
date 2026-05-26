-- ============================================================
-- evolution_lessons.sql — Lecciones aprendidas por el sistema de agentes
-- Generado automáticamente por EvolutionAgent (16)
-- Ejecutar con: sqlcmd -S localhost -E -i evolution_lessons.sql -b
--
-- CÓMO USAR:
--   1. EvolutionAgent ejecuta este script automáticamente (Windows Auth)
--   2. Cada vez que EvolutionAgent procesa nuevas lecciones, agrega más INSERTs aquí
--   3. Para reportes: SELECT * FROM Jarvis..AgentLessons ORDER BY CreatedAt DESC
--   4. Para filtrar: WHERE LessonType = 'bugfix' AND Scope = 'global'
-- ============================================================

-- Crear BD Jarvis si no existe (idempotente)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'Jarvis')
    CREATE DATABASE [Jarvis];
GO

USE [Jarvis];
GO

-- Crear tabla si no existe (idempotente — seguro ejecutar múltiples veces)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'AgentLessons' AND xtype = 'U')
CREATE TABLE AgentLessons (
    Id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AgentLessons PRIMARY KEY DEFAULT NEWID(),
    LessonType        NVARCHAR(50)     NOT NULL,   -- bugfix | antipattern | pattern | decision
    SourceAgent       NVARCHAR(100)    NOT NULL,
    Description       NVARCHAR(500)    NOT NULL,
    RootCause         NVARCHAR(500)    NULL,
    Fix               NVARCHAR(500)    NULL,
    Severity          NVARCHAR(20)     NOT NULL    CONSTRAINT CHK_AgentLessons_Severity CHECK (Severity IN ('error', 'warning', 'info')),
    Scope             NVARCHAR(20)     NOT NULL    CONSTRAINT CHK_AgentLessons_Scope    CHECK (Scope    IN ('global', 'stack', 'project')),
    CreatedAt         DATETIME2        NOT NULL,
    AppliesToAgents   NVARCHAR(500)    NULL,       -- nombres de agentes separados por coma
    EvolutionScore    DECIMAL(5,2)     NULL,       -- delta de evolution_score al procesar esta lección
    SkillPath         NVARCHAR(300)    NULL,       -- ruta de la skill generada (si aplica)
    CONSTRAINT CHK_AgentLessons_Type CHECK (LessonType IN ('bugfix', 'antipattern', 'pattern', 'decision'))
);
GO

-- Índices para consultas frecuentes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AgentLessons_Type_Scope')
    CREATE INDEX IX_AgentLessons_Type_Scope ON AgentLessons (LessonType, Scope) WHERE LessonType IS NOT NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AgentLessons_CreatedAt')
    CREATE INDEX IX_AgentLessons_CreatedAt ON AgentLessons (CreatedAt DESC);
GO

-- ============================================================
-- INSERTs generados por EvolutionAgent (se agregan automáticamente abajo)
-- ============================================================

-- Seed inicial: 7 lecciones reales extraídas de proyectos reales del sistema
-- Ejecutar una sola vez para activar auto-aprendizaje desde el inicio

INSERT INTO AgentLessons (Id, LessonType, SourceAgent, Description, RootCause, Fix, Severity, Scope, CreatedAt, AppliesToAgents)
VALUES
(NEWID(), 'bugfix', 'DevOpsAgent',
 'ClosedXML.dll en servidor Linux era versión antigua (<0.100) que usa System.Drawing.Common — incompatible con .NET 8 Linux',
 'Publicación con --no-build usó DLL vieja del bin/. ClosedXML <0.100 depende de System.Drawing.Common, que falla en .NET 8 Linux.',
 'Siempre publicar con -r linux-x64 sin --no-build. Verificar tamaño ClosedXML.dll: ~1.6MB (correcto) vs ~4.4MB (versión vieja).',
 'error', 'stack', '2026-03-21T00:00:00Z', 'BackendAgent,DevOpsAgent'),

(NEWID(), 'bugfix', 'BackendAgent',
 'SqlException: Cannot insert NULL into column Permisos al crear usuario Administrador',
 'Input hidden dentro de div CSS-hidden puede entregarse como null en ASP.NET Core model binding bajo condiciones borde.',
 'Agregar ??= string.Empty en controller antes de CrearAsync. Mover inputs hidden fuera de divs CSS-hidden.',
 'error', 'stack', '2026-03-28T00:00:00Z', 'BackendAgent,FrontendAgent'),

(NEWID(), 'bugfix', 'DebugAgent',
 'Balance descuadrado por CuentaPadre incorrecto: montos de cuenta hija aparecen en rama equivocada del catálogo',
 'Servicio de Balance propaga montos hacia arriba por cadena CuentaPadre. Un CuentaPadre incorrecto contamina toda la rama.',
 'Verificar integridad: CodigoCuenta NOT LIKE CuentaPadre + %.%. Ejecutar fix SQL antes de procesar balances.',
 'error', 'stack', '2026-03-30T00:00:00Z', 'DatabaseAgent,BackendAgent'),

(NEWID(), 'bugfix', 'SecurityAgent',
 'JWT con expiración de 30 días — ventana de compromiso inaceptable para producción',
 'Valor por defecto en appsettings.json era ExpirationMinutes: 43200 (30 días). Sin revisión en code review inicial.',
 'JWT access token máximo 60 minutos. Agregar RefreshTokenExpirationDays: 7 separado. Revisar en SecurityAgent checklist.',
 'error', 'global', '2026-03-21T00:00:00Z', 'BackendAgent,SecurityAgent,IntegrationAgent'),

(NEWID(), 'antipattern', 'SecurityAgent',
 'CORS configurado con * (wildcard) en producción — permite peticiones desde cualquier origen',
 'Configuración por defecto o copia de ejemplo de desarrollo. Nunca ajustado para producción.',
 'CORS debe listar orígenes específicos en producción. Usar variable de entorno ALLOWED_ORIGINS. Nunca * en producción.',
 'error', 'global', '2026-03-21T00:00:00Z', 'BackendAgent,SecurityAgent'),

(NEWID(), 'bugfix', 'DevOpsAgent',
 'Rutas recursivas en carpeta Publicacion exceden límite de 260 caracteres de Windows — MSB3030 durante dotnet publish',
 'Interrupciones previas del script de publicación dejaron estructura anidada recursivamente.',
 'Usar robocopy /MIR con carpeta vacía antes de publicar. Nunca Remove-Item -Recurse con rutas muy profundas.',
 'warning', 'stack', '2026-03-19T00:00:00Z', 'DevOpsAgent'),

(NEWID(), 'bugfix', 'BackendAgent',
 'AutoMapper sin mantenimiento activo tiene vulnerabilidad High GHSA-rvv3-g6hj-g44x en todas las versiones 12.x-16.x',
 'AutoMapper dejó de recibir parches de seguridad. La vulnerabilidad afecta todas las versiones disponibles.',
 'Reemplazar AutoMapper con Mapster (10.x). Mapster es 6x más rápido, mantenido activamente, sin vulnerabilidades conocidas.',
 'error', 'stack', '2026-03-21T00:00:00Z', 'BackendAgent');
GO

