# rules/dotnet — Convenciones C# / .NET 8 (Clean Architecture)

Aplica a: BackendAgent, DebugAgent, QAAgent, ReviewAgent al revisar código .NET

---

## Entidades y modelos EF Core

- `Id` como `UNIQUEIDENTIFIER` con `DEFAULT NEWSEQUENTIALID()` — no usar int autoincrement
- `IsDeleted BIT NOT NULL DEFAULT 0` — soft delete en TODAS las entidades
- `CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()`
- `UpdatedAt DATETIME2 NULL` — actualizar en `SaveChanges` override en AppDbContext
- Nombres de entidades en PascalCase singular: `Cliente`, `Factura`, `Producto`

## Servicios e interfaces

- Cada servicio tiene SIEMPRE su interfaz: `IClienteService` + `ClienteService`
- Registro de DI en `Extensions/ServiceExtensions.cs` — nunca en Program.cs directamente
- Async/await en toda la cadena — NUNCA `.Result`, `.Wait()`, `.GetAwaiter().GetResult()`
- Un repositorio por entidad: `IClienteRepository` + `ClienteRepository`
- Lógica de negocio en Services, NUNCA en Controllers ni Repositories
- Acceso a datos SOLO en Repositories — Services no llaman DbContext directamente

## DTOs

- DTOs como `record` de C#: `public record LoginRequest(string Email, string Password);`
- Request DTOs con validaciones: `[Required]`, `[EmailAddress]`, `[StringLength(N)]`, `[Range]`
- Response DTOs no expongan campos sensibles (Password, HashedPassword, InternalId)
- Separar DTOs de Request y Response — nunca usar la misma clase para ambos

## Controllers

- `[ApiController]` + `[Route("api/[controller]")]` en todos los controllers
- NUNCA lógica de negocio en controllers — solo delegación al servicio
- Retornar `IActionResult` o `ActionResult<T>` — no tipos concretos directos
- Patrones de respuesta estándar:
  - `Ok(result)` — 200
  - `Created(location, result)` — 201
  - `NotFound()` — 404
  - `BadRequest(ModelState)` — 400
  - `Unauthorized()` — 401

## Auth / JWT

- JWT secret mínimo 32 caracteres — en `appsettings.json` marcado con `[CONFIGURAR]`
- `ExpirationMinutes` máximo 60 (1 hora) en producción — no 43200 (30 días)
- Agregar `RefreshTokenExpirationDays: 7` para refresh tokens
- `[Authorize]` en clase del controller — `[AllowAnonymous]` solo en endpoints públicos
- Verificar `User.FindFirst("Id")` no es null antes de usar en endpoints autenticados

## Estructura de carpetas (Backend)

```
backend/{Project}.API/
├── Controllers/     ← [ApiController] uno por entidad
├── Models/          ← Entidades EF (Id UNIQUEIDENTIFIER, IsDeleted, timestamps)
├── DTOs/            ← Records C# Request/Response
├── Services/
│   └── Interfaces/  ← IXxxService
├── Repositories/
│   └── Interfaces/  ← IXxxRepository
├── Data/
│   ├── AppDbContext.cs
│   └── Configurations/  ← EntityTypeConfiguration<T>
├── Extensions/
│   └── ServiceExtensions.cs  ← registro DI
└── Program.cs
```

## Paquetes estándar

| Paquete | Versión | Uso |
|---|---|---|
| `Microsoft.EntityFrameworkCore.SqlServer` | 8.x | ORM principal |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 8.x | JWT auth |
| `BCrypt.Net-Next` | 4.x | Hashing passwords |
| `Mapster` + `Mapster.DependencyInjection` | 10.x | Mapping (no AutoMapper — vulnerabilidad) |
| `QuestPDF` | 2026.x | Exportación PDF |
| `EPPlus` | 7.x | Exportación Excel |
