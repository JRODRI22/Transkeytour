# SKILL: EF Core — Errores comunes de configuración y migración
> [SKILL EVOLUCIONADA — generada por EvolutionAgent en 2026-04-03]
> Origen: 4 lecciones de proyectos reales (EF Core migrations, DI, entidades)

## Cuándo aplicar
Al generar entidades, DbContext, migrations o el registro de DI en BackendAgent.
Al depurar errores de startup en DebugAgent.

## Lo que NO hacer (antipatrones)

```csharp
// ❌ Entidad sin Id reconocible por EF → "requires a primary key"
public class Cliente {
    public Guid ClienteId { get; set; }  // sin [Key] → EF no lo reconoce
}

// ❌ GUID sin DatabaseGenerated → INSERT con valor vacío (00000000-...)
public class Pedido {
    public Guid Id { get; set; }  // sin atributo → EF intenta insertar Guid.Empty
}

// ❌ Servicio no registrado → InvalidOperationException al arrancar
// ServiceExtensions.cs vacío, Program.cs no llama AddApplicationServices()
```

## Lo que SÍ hacer (patrón correcto)

```csharp
// ✅ Entidad con PK correcta — EF reconoce "Id" automáticamente
public class Cliente
{
    public Guid Id { get; set; }  // convención: EF lo reconoce sin [Key]
    public string Nombre { get; set; } = string.Empty;
    public bool IsDeleted { get; set; } = false;
}

// ✅ Si el nombre NO es "Id", usar [Key] explícito
public class Paquete
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid PaqueteId { get; set; }
}

// ✅ ServiceExtensions.cs — registrar todos los servicios
public static class ServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IClienteService, ClienteService>();
        services.AddScoped<IClienteRepository, ClienteRepository>();
        // ... resto de servicios
        return services;
    }
}

// ✅ Program.cs — llamar al registro
builder.Services.AddApplicationServices();
```

```bash
# ✅ Migration ya aplicada — marcar sin re-ejecutar
dotnet ef database update [NombreDeMigrationAnterior]

# ✅ Si tabla ya existe y migration quiere crearla de nuevo
# Opción: remover la migration problemática y crear una nueva vacía
dotnet ef migrations remove
dotnet ef migrations add FixConflict --output-dir Data/Migrations

# ✅ EF Tools no instaladas
dotnet tool install --global dotnet-ef
dotnet ef --version  # verificar
```

## Por qué importa
- Sin `[DatabaseGenerated]` en Guid → SqlException "Cannot insert NULL" o GUID vacío en tabla
- Nombre `Id` → EF reconoce automáticamente como PK (convención sobre configuración)
- `AddApplicationServices()` no llamado → el primer request lanza `InvalidOperationException: No service registered` y el app no arranca

## Aplicable en
- [x] Agent: BackendAgent (03)
- [x] Agent: DatabaseAgent (02)
- [ ] Agent: FrontendAgent (04)
- [x] Agent: DebugAgent (10)

## Severity: high | Scope: stack | Type: pattern
