-- =============================================================================
-- setup_login.sql — Configuración inicial de JarvisDB en SQL Server Express
-- Ejecutar en SSMS conectado con Windows Authentication como JORGE_R\jrodr
-- Ejecutar PRIMERO agentbrain_schema.sql si JarvisDB aún no existe
-- =============================================================================

USE [master];
GO

-- ============================================================
-- PASO 1: Habilitar modo mixto (SQL + Windows Authentication)
-- Necesario para que funcione la cuenta de servicio agentbrain_svc
-- REQUERIDO REINICIAR el servicio SQL Server después de este paso
-- ============================================================
EXEC xp_instance_regwrite
    N'HKLM',
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'LoginMode',
    REG_DWORD,
    2;  -- 1 = Solo Windows Auth | 2 = Modo Mixto (SQL + Windows)
GO
PRINT 'Modo mixto habilitado. REINICIA el servicio SQL Server Express para que tome efecto.';
PRINT 'Services.msc → SQL Server (SQLEXPRESS) → Reiniciar';
GO

-- ============================================================
-- PASO 2: Crear login SQL (ejecutar DESPUÉS de reiniciar)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'agentbrain_svc')
BEGIN
    CREATE LOGIN [agentbrain_svc]
        WITH PASSWORD   = N'AgentBrain2024!',
             CHECK_POLICY     = OFF,
             CHECK_EXPIRATION = OFF;
    PRINT 'Login agentbrain_svc creado.';
END
ELSE
    PRINT 'Login agentbrain_svc ya existe.';
GO

-- ============================================================
-- PASO 3: Crear usuario en JarvisDB y asignar permisos
-- (db_owner para que pueda crear tablas, SPs, etc.)
-- ============================================================
USE [JarvisDB];
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'agentbrain_svc')
BEGIN
    CREATE USER [agentbrain_svc] FOR LOGIN [agentbrain_svc];
    PRINT 'Usuario agentbrain_svc creado en JarvisDB.';
END
ELSE
    PRINT 'Usuario agentbrain_svc ya existe en JarvisDB.';
GO

ALTER ROLE [db_owner] ADD MEMBER [agentbrain_svc];
GO

PRINT '=== Setup completo. El MCP AgentBrain ya puede conectarse a JarvisDB. ===';
GO
