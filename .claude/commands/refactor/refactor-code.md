# /refactor-code — Refactorización Guiada

Refactoriza código existente siguiendo las convenciones del proyecto sin cambiar el comportamiento.

## Qué hace este comando

1. Lee el archivo o bloque de código especificado
2. Identifica oportunidades de mejora según las convenciones del proyecto
3. Produce la versión refactorizada con explicación de cambios

## Cómo usar

```
/refactor-code Controllers/ClienteController.cs
/refactor-code --extract-service Controllers/ClienteController.cs
/refactor-code --to-records DTOs/ClienteDTO.cs
/refactor-code --add-async Services/ClienteService.cs
```

## Tipos de refactorización disponibles

| Tipo | Flag | Descripción |
|------|------|-------------|
| Extraer a Service | `--extract-service` | Mueve lógica de negocio del controller al service |
| Convertir a Records | `--to-records` | Convierte clases DTO a C# records |
| Agregar async/await | `--add-async` | Convierte métodos síncronos a asíncronos |
| Soft delete | `--add-soft-delete` | Agrega patrón IsDeleted a entidad EF |
| Repository pattern | `--extract-repository` | Extrae acceso a datos a un repositorio |
| Interfaces | `--add-interface` | Genera interface para una clase de servicio |
| Limpieza React | `--react-cleanup` | Extrae lógica a custom hooks, separa services |

## Reglas que aplica automáticamente

- DTOs como C# `record` (inmutables)
- Interfaces en `Services/Interfaces/` y `Repositories/Interfaces/`
- Registro de DI en `ServiceExtensions.cs`
- Async en toda la cadena (nunca `.Result` o `.Wait()`)
- `[Authorize]` por defecto en controllers
- Service por módulo en React (`clientesService.js`)

## Output esperado

```
Archivo: Controllers/ClienteController.cs
Cambios:
  - Extraída lógica de negocio a ClienteService (líneas 45-89)
  - Inyectado IClienteService via constructor
  - Eliminada dependencia directa en AppDbContext

[código refactorizado]
```
