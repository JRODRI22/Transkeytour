---
name: sql-server-best-practices
description: SQL Server best practices for schema design, query optimization, indexing, and T-SQL patterns. Use when designing schemas, writing DDL, T-SQL procedures, or reviewing SQL Server code.
triggers:
  - SQL Server
  - T-SQL
  - MSSQL
  - schema design
  - DDL
  - indexes
  - stored procedures
  - query optimization
---

# SQL Server Best Practices

## Schema Design

### Primary Keys
```sql
-- ALWAYS use UNIQUEIDENTIFIER with NEWSEQUENTIALID() for new entities
-- NEWSEQUENTIALID() is clustered-index friendly (sequential, no fragmentation)
Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_{Table} PRIMARY KEY DEFAULT NEWSEQUENTIALID()

-- NEVER use NEWID() as default — causes index fragmentation
-- NEVER use INT IDENTITY unless explicitly integrating with legacy systems
```

### Data Types
```sql
-- Money / Prices: ALWAYS decimal(18,4) — never float or money type
Price       DECIMAL(18,4)   NOT NULL DEFAULT 0,
Tax         DECIMAL(18,4)   NOT NULL DEFAULT 0,

-- Text with limits: nvarchar(N) — N must be specified per business rule
Name        NVARCHAR(200)   NOT NULL,  -- names, titles
Email       NVARCHAR(256)   NOT NULL,  -- RFC 5321 max
Description NVARCHAR(1000)  NULL,      -- medium text
Notes       NVARCHAR(MAX)   NULL,      -- only for long-form content

-- Dates: DATETIME2 (8 bytes, precision to 100ns) — NEVER datetime
CreatedAt   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
UpdatedAt   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

-- Flags: BIT, always with explicit default
IsDeleted   BIT             NOT NULL DEFAULT 0,
IsActive    BIT             NOT NULL DEFAULT 1,

-- Enums: nvarchar(50) + CHECK constraint — never separate lookup table for small sets
Status      NVARCHAR(50)    NOT NULL CONSTRAINT CHK_{Table}_Status CHECK (Status IN ('Active','Inactive','Pending'))
```

### Soft Delete Pattern
```sql
-- Every entity table MUST have soft delete columns
IsDeleted   BIT             NOT NULL DEFAULT 0,
DeletedAt   DATETIME2       NULL,
DeletedBy   NVARCHAR(200)   NULL,

-- Filtered index for soft delete — critical for query performance
CREATE INDEX IX_{Table}_Active ON {Table}(CreatedAt DESC) WHERE IsDeleted = 0;
```

### Constraint Naming (always explicit)
```sql
-- Pattern: {Type}_{Table}_{Column}
CONSTRAINT PK_{Table}         PRIMARY KEY (Id)
CONSTRAINT FK_{Table}_{Ref}   FOREIGN KEY ({Column}) REFERENCES {RefTable}(Id)
CONSTRAINT UQ_{Table}_{Col}   UNIQUE ({Column})
CONSTRAINT CHK_{Table}_{Rule} CHECK ({condition})
CONSTRAINT IX_{Table}_{Col}   -- for indexes (CREATE INDEX syntax)
```

### Indexes
```sql
-- Include frequently filtered/joined columns
CREATE INDEX IX_{Table}_{Column} ON {Table}({Column}) WHERE IsDeleted = 0;

-- Covering index for common queries (include non-key columns)
CREATE INDEX IX_{Table}_Search ON {Table}(LastName, FirstName) 
    INCLUDE (Email, Phone) WHERE IsDeleted = 0;

-- Unique index instead of unique constraint when partial/filtered
CREATE UNIQUE INDEX UQ_{Table}_{Col}_Active ON {Table}({Col}) WHERE IsDeleted = 0;

-- NEVER create indexes on bit columns alone (low selectivity)
-- ALWAYS filter with WHERE IsDeleted = 0 for every index on soft-delete tables
```

## T-SQL Patterns

### Idempotent DDL (safe to run multiple times)
```sql
-- Table creation
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = '{Table}' AND xtype = 'U')
CREATE TABLE {Table} ( ... );
GO

-- Column addition  
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('{Table}') AND name = '{Column}')
    ALTER TABLE {Table} ADD {Column} NVARCHAR(200) NULL;
GO

-- Index creation
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('{Table}') AND name = 'IX_{Name}')
    CREATE INDEX IX_{Name} ON {Table}({Column}) WHERE IsDeleted = 0;
GO
```

### CTEs for hierarchical / complex queries
```sql
-- Use CTEs for readability — SQL Server optimizes them well
WITH ActiveClients AS (
    SELECT Id, Name, Email
    FROM Clients
    WHERE IsDeleted = 0 AND IsActive = 1
),
RecentOrders AS (
    SELECT ClientId, COUNT(*) AS OrderCount, SUM(Total) AS TotalAmount
    FROM Orders
    WHERE IsDeleted = 0 AND CreatedAt >= DATEADD(DAY, -30, SYSUTCDATETIME())
    GROUP BY ClientId
)
SELECT c.Name, c.Email, COALESCE(ro.OrderCount, 0) AS RecentOrders
FROM ActiveClients c
LEFT JOIN RecentOrders ro ON ro.ClientId = c.Id;
```

### Pagination (EF Core / manual)
```sql
-- SQL Server pagination — use OFFSET/FETCH (not ROW_NUMBER in most cases)
SELECT Id, Name, CreatedAt
FROM Clients
WHERE IsDeleted = 0
ORDER BY CreatedAt DESC
OFFSET (@Page * @PageSize) ROWS
FETCH NEXT @PageSize ROWS ONLY;
```

### MERGE for upsert
```sql
-- Use MERGE for atomic insert-or-update
MERGE {Table} AS target
USING (VALUES (@Id, @Name, @Value)) AS source (Id, Name, Value)
ON target.Id = source.Id
WHEN MATCHED THEN 
    UPDATE SET Name = source.Name, Value = source.Value, UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN 
    INSERT (Id, Name, Value, CreatedAt, UpdatedAt) 
    VALUES (source.Id, source.Name, source.Value, SYSUTCDATETIME(), SYSUTCDATETIME());
```

### Transactions
```sql
-- Always use SET XACT_ABORT ON with explicit transactions
SET XACT_ABORT ON;
BEGIN TRANSACTION;
    -- operations
    UPDATE ...
    INSERT ...
COMMIT TRANSACTION;
-- No need for TRY/CATCH with XACT_ABORT ON — it auto-rollbacks on error
```

## Performance Anti-Patterns to Avoid

```sql
-- ❌ NEVER: SELECT * in production queries
SELECT * FROM Clients  -- loads all columns, causes over-fetching

-- ✅ ALWAYS: Select only needed columns
SELECT Id, Name, Email FROM Clients WHERE IsDeleted = 0

-- ❌ NEVER: Functions on indexed columns in WHERE clause (kills index usage)
WHERE YEAR(CreatedAt) = 2026  -- prevents index seek

-- ✅ ALWAYS: Range filters on indexed columns
WHERE CreatedAt >= '2026-01-01' AND CreatedAt < '2027-01-01'

-- ❌ NEVER: NOLOCK hints in business logic (dirty reads)
SELECT * FROM Orders WITH (NOLOCK)  -- can return uncommitted/phantom data

-- ❌ NEVER: Cursor for set-based operations — use set operations
-- ✅ Use UPDATE...FROM, INSERT...SELECT, CTE-based batch updates

-- ❌ NEVER: Dynamic SQL concatenation with user input (SQL injection)
SET @sql = 'SELECT * FROM ' + @tableName  -- EXTREMELY DANGEROUS

-- ✅ ALWAYS: Parameterized queries (EF Core handles this automatically)
```

## EF Core 8 Integration

### Model configuration (Fluent API preferred over annotations)
```csharp
// In EntityTypeConfiguration<T>:
builder.HasKey(e => e.Id);
builder.Property(e => e.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
builder.Property(e => e.Price).HasColumnType("decimal(18,4)");
builder.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
builder.HasQueryFilter(e => !e.IsDeleted);  // global soft-delete filter

// Index with filter
builder.HasIndex(e => e.CreatedAt)
    .HasFilter("IsDeleted = 0")
    .HasDatabaseName("IX_{Table}_Active");
```

### Migration naming
```
dotnet ef migrations add Add_{Entity}_{Feature}
-- Examples:
dotnet ef migrations add Add_Client_SoftDeleteColumn
dotnet ef migrations add Add_Order_FilteredIndex
```

## Security

```sql
-- Minimum privilege per service account
-- Read-only service: SELECT only on needed tables
GRANT SELECT ON dbo.Clients TO [app_readonly];

-- App service: DML only (no DDL, no direct table drops)
GRANT SELECT, INSERT, UPDATE ON dbo.Clients TO [app_service];
DENY DELETE ON dbo.Clients TO [app_service];  -- use soft delete via UPDATE

-- Schema changes: only via controlled EF migrations, never manual
```

## Seed Data Pattern
```sql
-- Idempotent seed using MERGE
MERGE INTO CatalogItems AS target
USING (VALUES 
    ('1', 'Category A'),
    ('2', 'Category B')
) AS source (Code, Name)
ON target.Code = source.Code
WHEN NOT MATCHED THEN INSERT (Code, Name) VALUES (source.Code, source.Name);
GO
```
