# SKILL: AutoMapper → Mapster y auditoría de paquetes NuGet vulnerables
> [SKILL EVOLUCIONADA — generada por EvolutionAgent en 2026-04-03]
> Origen: Vulnerabilidad GHSA-rvv3-g6hj-g44x — Charlotte Fashion

## Cuándo aplicar
Al generar el proyecto backend (BackendAgent). Nunca usar AutoMapper — usar Mapster.
Al ejecutar SecurityAgent — siempre verificar paquetes vulnerables.

## Lo que NO hacer (antipatrones)

```csharp
// ❌ AutoMapper tiene vulnerabilidad High sin parche (todas las versiones 12.x-16.x)
// NO agregar estos paquetes:
dotnet add package AutoMapper
dotnet add package AutoMapper.Extensions.Microsoft.DependencyInjection
```

## Lo que SÍ hacer (patrón correcto)

```bash
# ✅ Usar Mapster — más rápido (~6x), mantenido, sin vulnerabilidades
dotnet add package Mapster --version 10.0.3
dotnet add package Mapster.DependencyInjection --version 10.0.0

# ✅ Auditar vulnerabilidades SIEMPRE después de agregar/actualizar paquetes
dotnet list package --vulnerable --include-transitive
```

```csharp
// ✅ ServiceExtensions.cs — registro de Mapster
using Mapster;
using MapsterMapper;
using System.Reflection;

public static IServiceCollection AddApplicationServices(this IServiceCollection services)
{
    var config = TypeAdapterConfig.GlobalSettings;
    config.Scan(Assembly.GetExecutingAssembly());
    services.AddSingleton(config);
    services.AddScoped<IMapper, ServiceMapper>();
    // ...
}
```

```csharp
// ✅ MappingProfile.cs → implementar IRegister (no Profile)
public class MappingProfile : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        // Sintaxis Mapster: Map(dest => dest.Campo, src => src.Valor)
        config.NewConfig<Cliente, ClienteDto>()
            .Map(dest => dest.NombreCompleto, src => $"{src.Nombre} {src.Apellido}");
    }
}
```

```csharp
// ✅ En servicios: inyectar IMapper (mismo nombre que AutoMapper, drop-in)
public class ClienteService : IClienteService
{
    private readonly IMapper _mapper;
    public ClienteService(IMapper mapper) { _mapper = mapper; }
    
    public ClienteDto ObtenerDto(Cliente cliente) => _mapper.Map<ClienteDto>(cliente);
}
```

## Por qué importa
- AutoMapper GHSA-rvv3-g6hj-g44x: vulnerabilidad High sin parche en ninguna versión activa
- Mapster es un drop-in replacement: misma interfaz `IMapper`, misma inyección de dependencias
- `dotnet list package --vulnerable` debe ejecutarse en cada sprint — no solo al iniciar proyecto

## Aplicable en
- [x] Agent: BackendAgent (03)
- [ ] Agent: FrontendAgent (04)
- [x] Agent: SecurityAgent (08)

## Severity: high | Scope: stack | Type: bugfix
