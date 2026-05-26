---
applyTo: "**/*.cs,**/*.csproj,**/*.sln"
---

# Convenciones .NET 8 — Stack del Proyecto

> Cargado automáticamente al editar archivos C# o proyectos .NET.
> Incluye lecciones aprendidas de proyectos reales del sistema.

---

## Identidad de Entidades EF Core

```csharp
// ✅ CORRECTO — EF reconoce "Id" automáticamente sin [Key]
public class Cliente {
    public Guid Id { get; set; }               // EF lo reconoce por convención
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid EmpresaId { get; set; }
}

// ❌ INCORRECTO — ClienteId sin [Key] → EF no lo reconoce → excepción en runtime
public class Cliente {
    public Guid ClienteId { get; set; }   // error: no primary key
}

// ❌ INCORRECTO — Guid sin DatabaseGenerated → INSERT con Guid.Empty
public class Pedido {
    public Guid Id { get; set; }   // sin [DatabaseGenerated] → valor vacío al insertar
}
```

**Regla:** Siempre `Id` (no `ClienteId`). En Configuration usar `HasDefaultValueSql("NEWSEQUENTIALID()")`.

---

## Mapster — NO AutoMapper

```bash
# ✅ Correcto
dotnet add package Mapster --version 10.0.3
dotnet add package Mapster.DependencyInjection --version 10.0.0

# ❌ NUNCA — AutoMapper tiene vulnerabilidad High sin parche (todas las versiones 12.x-16.x)
# dotnet add package AutoMapper
```

```csharp
// ✅ Registro en ServiceExtensions.cs
services.AddMapster();
TypeAdapterConfig.GlobalSettings.Scan(Assembly.GetExecutingAssembly());

// ✅ Uso en Services
var dto = entity.Adapt<ClienteDto>();
var entity = dto.Adapt<Cliente>();
```

---

## Passwords — BCrypt OBLIGATORIO

```csharp
// ✅ Hash al crear usuario
string hash = BCrypt.Net.BCrypt.HashPassword(request.Password);

// ✅ Verificar al login
bool valid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

// ❌ NUNCA SHA256, MD5, SHA1 — no tienen salt → vulnerables a rainbow tables
```

---

## Async/Await — NUNCA .Result ni .Wait()

```csharp
// ✅ Correcto — toda la cadena async
public async Task<ClienteDto?> GetByIdAsync(Guid id) {
    var entity = await _repository.GetByIdAsync(id);
    return entity?.Adapt<ClienteDto>();
}

// ❌ NUNCA — deadlock en ASP.NET
var result = GetByIdAsync(id).Result;
Task.Run(() => DoWork()).Wait();
```

---

## Registro DI — Extensions/ServiceExtensions.cs

```csharp
// ✅ NUNCA en Program.cs directamente — siempre en ServiceExtensions
public static IServiceCollection AddApplicationServices(this IServiceCollection services) {
    services.AddScoped<IClienteService, ClienteService>();
    services.AddScoped<IClienteRepository, ClienteRepository>();
    // ...
    return services;
}

// Program.cs solo llama:
builder.Services.AddApplicationServices();
```

---

## Controllers — Sin lógica de negocio

```csharp
// ✅ Controller delega 100% al service
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientesController : ControllerBase {
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id) {
        var result = await _clienteService.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }
}

// ❌ NUNCA lógica de negocio, queries EF, ni validaciones complejas en controllers
```

---

## SQL Server Connection String

```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=JORGE_R\\SQL;Database=MiDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

**Si aparece:** `Cannot open database "X" requested by the login.`
→ Verificar: `Get-Service | Where-Object Name -like "*SQL*"` — debe estar Running.
→ Verificar: el nombre de la DB en la connection string coincide exactamente con la DB creada.

---

## Middleware Order (Program.cs)

```csharp
// ✅ ORDEN OBLIGATORIO — cambiar el orden causa comportamientos inesperados
app.UseHttpsRedirection();
app.UseStaticFiles();     // antes de routing
app.UseRouting();
app.UseCors();            // después de routing, antes de auth
app.UseAuthentication();  // antes de authorization
app.UseAuthorization();   // después de authentication
app.MapControllers();
```

---

## Auditoría de paquetes (después de add/update)

```bash
dotnet list package --vulnerable --include-transitive
```

Ejecutar siempre después de `dotnet add package`.

---

## Soft Delete — QueryFilter global en AppDbContext

```csharp
// AppDbContext.cs
protected override void OnModelCreating(ModelBuilder builder) {
    // QueryFilter global para todas las entidades con IsDeleted
    builder.Entity<Cliente>().HasQueryFilter(c => !c.IsDeleted);
    // ... todas las entidades
}
```
