# LECCION-008: SQL Server Connection & dotnet-ef Setup
**Versión:** v1  
**Tipo:** bugfix  
**Severidad:** high  
**Agentes que aplican:** BackendAgent, DebugAgent, DatabaseAgent  
**Fuente:** JarvisDB · ERR-002, ERR-006  
**Creado:** por EvolutionAgent desde lecciones acumuladas  

---

## Problema 1 — `SqlException: Cannot open database requested by login`

### Síntoma
```
Microsoft.Data.SqlClient.SqlException: Cannot open database "NombreDB" requested by the login.
The login failed. Login failed for user 'DOMINIO\usuario'.
```

### Causa raíz
La base de datos no existe, el SQL Server no está corriendo, o la connection string es incorrecta.

### Diagnóstico paso a paso
```powershell
# 1. Verificar que SQL Server está corriendo
Get-Service | Where-Object Name -like "*SQL*" | Select-Object Name, Status

# 2. Probar conexión directa con sqlcmd
sqlcmd -S "JORGE_R\SQL" -E -No -Q "SELECT DB_NAME()" 2>&1

# 3. Verificar que la DB existe
sqlcmd -S "JORGE_R\SQL" -E -No -Q "SELECT name FROM sys.databases WHERE name = 'MiDB'"
```

### Solución

#### Connection string correcta para este proyecto
```json
// appsettings.json (local / Windows development)
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=JORGE_R\\SQL;Database=NombreDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}

// appsettings.Development.json (mismo — instancia nombrada local)
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=JORGE_R\\SQL;Database=NombreDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

> ⚠️ **IMPORTANTE:** El servidor es `JORGE_R\SQL` (SQL Server Developer Edition).  
> NO usar `.\SQLEXPRESS` — esa instancia fue migrada y ya no se usa.

#### Si la DB no existe — crear con migrations
```bash
# Desde la carpeta del proyecto backend
dotnet ef database update
```

#### Connection strings por entorno

| Entorno | Server | Auth |
|---------|--------|------|
| Local (Windows) | `JORGE_R\SQL` | Trusted_Connection=True |
| Servidor Linux (prod) | `127.0.0.1,1433` | `User Id=sa;Password=...` |
| Container Docker | `cf_sqlserver,1433` | `User Id=sa;Password=...` |

---

## Problema 2 — `dotnet ef` no reconocido como comando

### Síntoma
```
Unrecognized command or argument 'ef'
No executable found matching command "dotnet-ef"
```

### Causa raíz
Las herramientas de EF Core no están instaladas globalmente.

### Solución
```bash
# Instalar globalmente (una sola vez por máquina)
dotnet tool install --global dotnet-ef

# Verificar instalación
dotnet ef --version

# Si ya está instalada pero desactualizada
dotnet tool update --global dotnet-ef
```

### Comandos EF Core más usados
```bash
# Ver migrations existentes
dotnet ef migrations list

# Crear nueva migration
dotnet ef migrations add NombreMigration

# Aplicar migrations pendientes
dotnet ef database update

# Rollback a migration anterior
dotnet ef database update NombreMigrationAnterior

# Generar script SQL (sin ejecutar)
dotnet ef migrations script --output migration.sql
```

### Si `dotnet ef` falla con "project not found"
```bash
# Especificar el proyecto explícitamente
dotnet ef migrations add Init --project NombreProyecto.csproj --startup-project NombreProyecto.csproj
```

---

## Checklist de setup inicial de base de datos

```
□ SQL Server JORGE_R\SQL corriendo           ← Get-Service *SQL*
□ connection string apunta a JORGE_R\SQL    ← NO .\SQLEXPRESS
□ dotnet-ef instalado                        ← dotnet ef --version
□ Migrations creadas                         ← dotnet ef migrations list
□ DB actualizada                             ← dotnet ef database update
□ Verificar DB existe                        ← sqlcmd -S "JORGE_R\SQL" -E -No -Q "SELECT DB_NAME()"
```
