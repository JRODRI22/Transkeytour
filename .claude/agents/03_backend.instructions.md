---
applyTo: "backend/**,Controllers/**,Models/**,DTOs/**,Services/**,Repositories/**,Data/**"
description: "Fase 2: genera el proyecto ASP.NET Core 8 completo (Controllers, Services, Repositories, DTOs, EF Core, JWT) desde el schema.sql."
---

# BackendAgent — Fase 2

## Activación automática
Se activa cuando `database/schema.sql` existe pero `backend/` **no existe todavía**.
También por keywords: "backend", "API", "controllers", "services", "models".

**Skills auto-cargados:** `systematic-debugging`, `test-driven-development`, `sql-server-best-practices`

---

## Contrato INPUT / OUTPUT (Agent Teams Lite)

### INPUT (recibido del OrchestratorAgent)
```json
{
  "schema_sql": "contenido de database/schema.sql",
  "tasks_md_slice": "filas de docs/TASKS.md con Fase=Backend y Scope=[v1]",
  "PROJECT_MD_sections": "secciones 2 (Entidades) + 4 (Reglas) + 5 (Config)",
  "context": "phases.db == done, backend/ no existe",
  "batch": {
    "enabled": false,
    "batch_number": 1,
    "total_batches": 1,
    "entities_in_batch": []
  },
  "generated_interfaces": {}
}
```

> **Campo `generated_interfaces`:** Mapa acumulativo construido por el OrchestratorAgent.
> Para cada entidad ya procesada en lotes anteriores contiene sus interfaces públicas:
> ```json
> {
>   "Cliente":  { "service": "IClienteService",  "repo": "IClienteRepository",  "dto": "ClienteDto"  },
>   "Producto": { "service": "IProductoService", "repo": "IProductoRepository", "dto": "ProductoDto" }
> }
> ```
> En el lote 1 llega vacío `{}`. En el lote 2 contiene las interfaces del lote 1, etc.
> **Regla crítica:** Para cualquier FK que referencie una entidad de un lote anterior,
> usar EXACTAMENTE los nombres de interfaz del mapa — no inventar nombres.
```

### OUTPUT (retornado al OrchestratorAgent)
```json
{
  "agent": "BackendAgent",
  "status": "done | done_batch | error",
  "files_generated": ["backend/{Project}.API/Controllers/...", "backend/{Project}.API/Services/...", "..."],
  "errors": [],
  "next_suggested": "FrontendAgent",
  "batch_info": {
    "batch_number": 1,
    "total_batches": 1,
    "entities_processed": [],
    "more_batches_pending": false
  },
  "interfaces_generated": {
    "NombreEntidad": { "service": "INombreEntidadService", "repo": "INombreEntidadRepository", "dto": "NombreEntidadDto" }
  },
  "state_updates": {
    "phases.backend": "done",
    "entity_batching.current_batch": 1,
    "entity_batching.batches_done": [1]
  }
}
```

> **Campo `interfaces_generated`:** El Orchestrator ACUMULA este mapa entre lotes:
> al recibir el OUTPUT del lote N, hace `generated_interfaces = merge(generated_interfaces, OUTPUT.interfaces_generated)`
> y lo pasa como INPUT al lote N+1.
```

> **Regla:** Al completar, retorna el OUTPUT JSON al OrchestratorAgent y **DETENTE**.

### Self-Review Checklist (PraisonAI — revisar antes de retornar)
Antes de emitir el OUTPUT final, verificar internamente:
- [ ] ¿El código compilaría sin errores? (`dotnet build` mental review)
- [ ] ¿Todas las interfaces (`IXxxService`, `IXxxRepository`) tienen su implementación registrada en `ServiceExtensions.cs`?
- [ ] ¿Los DTOs usan `record` con validaciones `[Required]`/`[EmailAddress]` donde corresponde?
- [ ] ¿Los controllers no contienen lógica de negocio (solo delegan al service)?
- [ ] ¿El `AppDbContext` tiene `DbSet<T>` para todas las entidades generadas?
- [ ] ¿Los endpoints usan `[Authorize]` por defecto + `[AllowAnonymous]` solo donde se justifica?

Si alguna verificación falla → corregir ANTES de retornar el OUTPUT.

### Suggested next agent
Al finalizar exitosamente, incluir al final del OUTPUT:
```
### Suggested next agent
Agent: ReviewAgent
Reason: Backend generado — código listo para revisión de calidad
```
Si se detectaron errores de compilación durante la generación:
```
### Suggested next agent
Agent: DebugAgent
Reason: Errores de compilación detectados en BackendAgent
```
> Si `status == "done_batch"` (lote parcial) → el OrchestratorAgent lanza BackendAgent de nuevo con el siguiente lote.
> Si `status == "done"` (todos los lotes procesados) → el OrchestratorAgent continúa con el pipeline.

---

## ⚙️ Protocolo de Batching (proyectos con 15+ entidades)

Cuando `state.json.entity_batching.enabled == true`:

```
1. Leer state.json.entity_batching:
   - total_entities, batch_size, current_batch, batches_done
2. Calcular entities del lote actual:
   - start = (current_batch - 1) * batch_size
   - end   = min(start + batch_size, total_entities)
   - entities_in_batch = state.json.entities[start..end]
3. Generar SOLO Controllers/Services/Repositories/DTOs para esas entidades
4. Si es batch 1: también generar los archivos de infraestructura:
   - Program.cs, GlobalUsings.cs, appsettings.json, AppDbContext.cs,
     ServiceExtensions.cs, GlobalExceptionMiddleware.cs
5. Retornar:
   - status: "done_batch" si quedan más lotes
   - status: "done" si este fue el último lote
6. state_updates incluye: entity_batching.current_batch y entity_batching.batches_done
```

> **El OrchestratorAgent es responsable de re-lanzar BackendAgent por lote.**  
> BackendAgent no se auto-relanza — espera cada nuevo payload del orquestador.

> Al terminar, actualiza el estado de cada tarea a `✅ Done`.

## Antes de iniciar
1. **[OBLIGATORIO]** Llamar `log_agent_run({agent_name: "BackendAgent", status: "started", project_name, phase: "backend"})` ← MCP jarvisdb
2. Lee `docs/TASKS.md` — filtra las filas con Fase = `Backend` y Estado = `⬜ Pending` y Scope = `[v1]`.
2. Confirma que FASE 1 (DatabaseAgent) está `done` en state.json antes de empezar.
3. Si no existe `docs/TASKS.md`, DETENER y notificar: "Falta el plan. Ejecuta ArchitectAgent primero."

## Al terminar FASE 2
- Actualiza `docs/TASKS.md`: marca cada tarea Backend completada con `✅ Done`.
- El estado se persiste automáticamente vía `state_updates` en el OUTPUT JSON: `{ "phases.backend": "done" }`.
- Output: ver Formato de salida al final.

> **Contexto de entrada requerido:**  
> `docs/ARCHITECTURE.md`, `docs/ROUTES.md`, `PROJECT.md` sección 2 (Entidades), 4 (Reglas), 5 (Config), `database/schema.sql`  
> Construye **solo las features marcadas [v1]** en docs/TASKS.md.

## Estructura a generar

```
backend/{ProjectName}.API/
├── {ProjectName}.API.csproj
├── Program.cs
├── GlobalUsings.cs
├── appsettings.json
├── appsettings.Development.json
├── Controllers/
│   ├── {Entidad}Controller.cs         ← [ApiController] + [Route("api/[controller]")]
│   └── StatusController.cs            ← GET /api/status/agents (para Agent Visualizer)
├── Models/
│   └── {Entidad}.cs                   ← uno por entidad (EF Core)
├── DTOs/
│   ├── {Entidad}Request.cs            ← input del cliente
│   └── {Entidad}Response.cs           ← output al cliente
├── Services/
│   ├── I{Entidad}Service.cs
│   └── {Entidad}Service.cs
├── Repositories/
│   ├── I{Entidad}Repository.cs
│   └── {Entidad}Repository.cs
├── Data/
│   └── AppDbContext.cs
├── Middleware/
│   └── GlobalExceptionMiddleware.cs
└── Extensions/
    └── ServiceExtensions.cs           ← Registro centralizado DI
```

## Convenciones C# obligatorias

### DTOs como records de C# (nunca exponer entidades EF)
```csharp
// Request
public record ProductoRequest(
    [Required, MaxLength(200)] string Nombre,
    [Required, Range(0.01, double.MaxValue)] decimal Precio,
    [Required, Range(0, int.MaxValue)] int Stock,
    [Required] Guid CategoriaId
);

// Response
public record ProductoResponse(
    Guid Id,
    string Nombre,
    decimal Precio,
    int Stock,
    string CategoriaNombre,
    DateTime CreatedAt
);
```

### Controller REST estándar
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductosController(IProductoService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductoResponse>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
        => Ok(await service.GetAllAsync(page, pageSize, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductoResponse>> GetById(Guid id, CancellationToken ct = default)
    {
        var item = await service.GetByIdAsync(id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProductoResponse>> Create(ProductoRequest dto, CancellationToken ct = default)
    {
        var created = await service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, ProductoRequest dto, CancellationToken ct = default)
    {
        await service.UpdateAsync(id, dto, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        await service.DeleteAsync(id, ct);
        return NoContent();
    }
}
```
    public Guid CategoriaId { get; set; }

    public IEnumerable<SelectListItem> Categorias { get; set; } = [];
}
```

### Service con interfaz
```csharp
public interface IProductoService
{
    Task<PagedResult<ProductoResponse>> GetAllAsync(int page, int pageSize, CancellationToken ct = default);
    Task<ProductoResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ProductoResponse> CreateAsync(ProductoRequest dto, CancellationToken ct = default);
    Task UpdateAsync(Guid id, ProductoRequest dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
```

### Repository con AsNoTracking
```csharp
public async Task<IEnumerable<Producto>> GetAllActiveAsync(CancellationToken ct = default)
    => await _db.Productos
        .AsNoTracking()
        .Where(p => !p.IsDeleted)
        .OrderBy(p => p.Nombre)
        .ToListAsync(ct);
```

### Paginación reutilizable
```csharp
public class PagedResult<T>
{
    public IEnumerable<T> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}
```

### Auth: JWT Bearer
```csharp
// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };
    });

builder.Services.AddAuthorization();
```

### Program.cs (Web API)
```csharp
var builder = WebApplication.CreateBuilder(args);

// Serilog — structured logging obligatorio en todos los proyectos
builder.Host.UseSerilog((ctx, lc) => lc
    .WriteTo.Console()
    .WriteTo.File("logs/app-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7)
    .ReadFrom.Configuration(ctx.Configuration));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddApplicationServices(builder.Configuration);

// HealthChecks — obligatorio para Docker/deploy health probe
builder.Services.AddHealthChecks()
    .AddSqlServer(builder.Configuration.GetConnectionString("Default")!);

// Rate limiting — protección básica contra abuso
builder.Services.AddRateLimiter(options => {
    options.AddFixedWindowLimiter("default", o => {
        o.PermitLimit = 100;
        o.Window = TimeSpan.FromMinutes(1);
    });
});

var app = builder.Build();
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.UseMiddleware<GlobalExceptionMiddleware>();   // siempre primero
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.MapHealthChecks("/health");
app.Run();
```

### appsettings.json
```json
{
  "ConnectionStrings": { "Default": "" },
  "Jwt": { "Secret": "", "Issuer": "", "Audience": "", "ExpiryMinutes": 60 },
  "Logging": { "LogLevel": { "Default": "Information" } },
  "Serilog": { "MinimumLevel": { "Default": "Information", "Override": { "Microsoft": "Warning", "System": "Warning" } } }
}
```
Los valores reales en `appsettings.Development.json` (gitignored).

## .csproj requerido
```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.*" />
<PackageReference Include="BCrypt.Net-Next" Version="4.*" />
<!-- Obligatorios en TODOS los proyectos -->
<PackageReference Include="Serilog.AspNetCore" Version="8.*" />
<PackageReference Include="Serilog.Sinks.File" Version="5.*" />
<PackageReference Include="AspNetCore.HealthChecks.SqlServer" Version="8.*" />
```

## StatusController — Agent Visualizer

Siempre generar `Controllers/StatusController.cs`. Lee `state.json` desde el directorio raíz
y lo expone para el Agent Visualizer en `http://localhost:{PORT}/api/status/agents`.

```csharp
[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class StatusController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public StatusController(IWebHostEnvironment env) => _env = env;

    [HttpGet("agents")]
    public IActionResult GetAgentStatus()
    {
        var statePath = Path.Combine(_env.ContentRootPath, "..", ".claude", "state.json");
        if (!System.IO.File.Exists(statePath))
            return Ok(new { agents = Array.Empty<object>(), pipeline = (object?)null });

        var json = System.IO.File.ReadAllText(statePath);
        using var doc = JsonDocument.Parse(json);
        return Ok(new
        {
            agents   = MapAgentsFromState(doc.RootElement),
            pipeline = MapPipelineFromState(doc.RootElement),
        });
    }

    private static object[] MapAgentsFromState(JsonElement root)
    {
        // Returns minimal agent status array compatible with agentStateService.js
        var phases = root.TryGetProperty("phases", out var p) ? p : default;
        return new[]
        {
            new { id = "01", status = GetPhaseStatus(phases, "architect"),    progress = 100 },
            new { id = "02", status = GetPhaseStatus(phases, "database"),     progress = 100 },
            new { id = "03", status = GetPhaseStatus(phases, "backend"),      progress = 75  },
            new { id = "04", status = GetPhaseStatus(phases, "frontend"),     progress = 0   },
            new { id = "07", status = GetPhaseStatus(phases, "devops"),       progress = 0   },
            new { id = "08", status = GetPhaseStatus(phases, "security"),     progress = 0   },
        };
    }

    private static object MapPipelineFromState(JsonElement root)
    {
        var project = root.TryGetProperty("project", out var p) ? p.GetString() : "Proyecto";
        return new { project, phaseIndex = 2, overallProgress = 38, phasesCount = 8 };
    }

    private static string GetPhaseStatus(JsonElement phases, string key)
    {
        if (phases.ValueKind == JsonValueKind.Undefined) return "idle";
        return phases.TryGetProperty(key, out var v) && v.GetString() == "completed" ? "done" : "idle";
    }
}
```



```
✅ FASE 2 COMPLETADA — BackendAgent
Scope: v1 (API + React + Clean Architecture)
Archivos generados:
  - Program.cs
  - [N] Models (EF Core)
  - [N] DTOs (Request + Response por entidad)
  - [N] Controllers (uno por entidad)
  - [N] Services + Interfaces
  - [N] Repositories + Interfaces
  - Data/AppDbContext.cs
  - Middleware/GlobalExceptionMiddleware.cs
API disponible en: http://localhost:{PORT}/api
Swagger UI: http://localhost:{PORT}/swagger
→ Siguiente: FASE 3 — FrontendAgent
```

---

## OUTPUT JSON

```json
{
  "status": "completed",
  "agent": "BackendAgent",
  "scope": "v1",
  "files_generated": [
    "backend/{Project}.API/Program.cs",
    "backend/{Project}.API/Data/AppDbContext.cs",
    "backend/{Project}.API/Middleware/GlobalExceptionMiddleware.cs"
  ],
  "models_count": 0,
  "dtos_count": 0,
  "controllers_count": 0,
  "services_count": 0,
  "repositories_count": 0,
  "api_port": 0,
  "state_updates": {
    "phases.backend": "completed",
    "lastAgent": "BackendAgent"
  },
  "errors": [],
  "next_agent": "FrontendAgent"
}
```
