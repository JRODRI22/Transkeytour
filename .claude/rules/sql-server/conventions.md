# rules/sql-server — Convenciones SQL Server 2022

Aplica a: DatabaseAgent, BackendAgent (EF Configurations), DebugAgent al debuggear queries

---

## Naming conventions

- Tablas: PascalCase plural → `Clientes`, `Facturas`, `ProductosInventario`
- Columnas: PascalCase → `ClienteId`, `FechaCreacion`, `IsDeleted`
- Constraints con nombres explícitos:
  - `PK_{Tabla}` — Primary Key
  - `FK_{Tabla}_{TablaReferenciada}` — Foreign Key
  - `IX_{Tabla}_{Columna}` — Índice no-único
  - `UQ_{Tabla}_{Columna}` — Unique constraint
  - `CHK_{Tabla}_{Columna}` — Check constraint
  - `DF_{Tabla}_{Columna}` — Default constraint

## Tipos de datos

- `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()` — IDs primarios (no INT autoincrement)
- `DECIMAL(18,4)` — valores monetarios (`Total`, `Precio`, `ImpuestoMonto`)
- `NVARCHAR(N)` — texto con límite conocido (ej: `NVARCHAR(150)` para nombres)
- `NVARCHAR(MAX)` — solo para descripciones largas, notas, HTML/JSON guardado
- `DATETIME2(0)` — timestamps (no `DATETIME` legacy)
- `BIT NOT NULL DEFAULT 0` — booleanos y soft delete (`IsDeleted`, `IsActive`)
- ENUMs como `NVARCHAR(50) NOT NULL` + CHECK constraint:
  ```sql
  EstadoFactura NVARCHAR(50) NOT NULL,
  CONSTRAINT CHK_Facturas_EstadoFactura CHECK (EstadoFactura IN ('Pendiente','Pagada','Cancelada'))
  ```

## Soft delete — patrón obligatorio

```sql
IsDeleted    BIT          NOT NULL DEFAULT 0,
DeletedAt    DATETIME2    NULL,
DeletedBy    NVARCHAR(100) NULL
```

- Índices filtrados para queries habituales:
  ```sql
  CREATE INDEX IX_Clientes_IsDeleted ON Clientes (IsDeleted) WHERE IsDeleted = 0;
  ```
- Todos los `SELECT` de consulta diaria incluyen `WHERE IsDeleted = 0`
- EF Core: `modelBuilder.Entity<Cliente>().HasQueryFilter(c => !c.IsDeleted)`

## Timestamps estándar

```sql
CreatedAt   DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
UpdatedAt   DATETIME2 NULL
```

## Índices

- Índice por `ClienteId` (FK) en tablas hijo — siempre
- Índice por columnas de filtro frecuente (ej: `Estado`, `Fecha`, `IsDeleted`)
- Índices filtrados con `WHERE IsDeleted = 0` para tablas con soft delete

## Performance

- `SET NOCOUNT ON` al inicio de procedimientos y triggers
- Usar `TOP N` en queries que puedan retornar filas masivas sin paginación
- Evitar `SELECT *` en queries de aplicación — listar columnas explícitamente
- Índices full-text en columnas de búsqueda de texto (`CONTAINS`, `FREETEXT`)
- Analizar plan de ejecución si query supera 100ms en datos reales

## Migraciones EF Core

- Siempre generar migrations con nombre descriptivo: `AddClientesTable`, `AddFacturaTotalIndex`
- Verificar migration generada antes de aplicar — revisar SQL en `Migrations/{timestamp}_*.cs`
- `dotnet ef database update` en desarrollo — script SQL para producción
- Nunca modificar migrations ya aplicadas — crear nueva migration para correcciones

## Conexión

- SQL Server: `JORGE_R\SQL` (desarrollo) / `127.0.0.1:1433` (producción Linux)
- `TrustServerCertificate=True` en desarrollo — configurar certificado real en producción
- Connection string en `appsettings.json` (dev) y variables de entorno (prod)
- Pool de conexiones: `Min Pool Size=5;Max Pool Size=100` para aplicaciones de producción
