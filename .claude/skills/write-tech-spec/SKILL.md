---
name: write-tech-spec
description: Write a TECH.md spec describing the architecture, implementation approach, and testing plan for a feature before coding begins. Use when a feature spans multiple layers (DB/Backend/Frontend), has meaningful architecture trade-offs, or when the implementation plan would benefit reviewers more than the raw code. Stack: .NET 8 / EF Core / SQL Server / React 18 / Axios.
---

# write-tech-spec

Escribe el `TECH.md` que describe la arquitectura, enfoque de implementación y plan de
testing de una feature antes de escribir código.

## Overview

El tech spec complementa el `PRODUCT.md` — define **cómo** se construye. Es la fuente
de verdad para arquitectura y secuenciación durante la implementación.

Ubicación: `specs/<nombre-feature>/TECH.md`
Ejemplo: `specs/T12-modulo-pagos/TECH.md`

## Cuándo escribir TECH.md

Preferir tech spec cuando:
- La implementación abarca múltiples subsistemas (DB + Backend + Frontend)
- La arquitectura o extensibilidad importan
- Hay trade-offs significativos a documentar
- Los reviewers se beneficiarían de revisar el plan antes que el código crudo
- El feature tiene riesgos de migración de DB o de datos

Omitir cuando:
- El feature es solo backend o solo UI sin cambios de DB
- La implementación es directa y no tiene ambigüedad técnica
- PRODUCT.md solo ya provee suficiente guía

## Estructura de TECH.md

```markdown
# TECH.md — [Nombre del Feature]

## Referencia
- Ticket TASKS.md: [T-XX]
- PRODUCT.md: specs/[feature]/PRODUCT.md
- Fecha: [YYYY-MM-DD]

## 1. Stack de implementación
[Qué capas toca este feature y con qué tecnologías]

| Capa | Archivos nuevos | Archivos modificados |
|------|----------------|---------------------|
| DB (SQL Server + EF Core) | [nuevas migrations, tablas] | [entidades modificadas] |
| Backend (.NET 8) | [nuevos services/controllers] | [servicios existentes] |
| Frontend (React 18) | [nuevas páginas/componentes] | [componentes existentes] |

## 2. Modelo de datos

### Cambios a la DB
```sql
-- Nueva tabla / columna / índice
ALTER TABLE ... ADD ...;
```

### Entidades EF Core nuevas o modificadas
```csharp
public class NuevaEntidad
{
    public Guid Id { get; set; }         // UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()
    public bool IsDeleted { get; set; }  // BIT NOT NULL DEFAULT 0
    public DateTime CreatedAt { get; set; }
    // ... propiedades del dominio
}
```

### EF Migration approach
- [ ] `dotnet ef migrations add [NombreMigration]` en `backend/{Project}.API/`
- [ ] Verificar SQL generado antes de aplicar

## 3. Arquitectura de implementación

### Nuevos contratos (interfaces)
```csharp
public interface INuevaEntidadService
{
    Task<NuevaEntidadDto> GetByIdAsync(Guid id);
    // ...
}
```

### Secuencia de implementación (bottom-up)
1. Migration EF Core (si hay cambios de DB)
2. `Models/NuevaEntidad.cs` + `Configurations/NuevaEntidadConfiguration.cs`
3. `DTOs/NuevaEntidadRequest.cs` + `NuevaEntidadResponse.cs`
4. `Repositories/Interfaces/INuevaEntidadRepository.cs` + implementación
5. `Services/Interfaces/INuevaEntidadService.cs` + implementación
6. `Controllers/NuevaEntidadController.cs`
7. `Extensions/ServiceExtensions.cs` — registrar DI
8. `frontend/src/services/{entidad}Service.js`
9. `frontend/src/pages/{Entidad}ListPage.jsx` + `{Entidad}FormPage.jsx`

## 4. Endpoints API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/{entidad} | JWT | Listar (paginado) |
| GET | /api/{entidad}/{id} | JWT | Obtener por ID |
| POST | /api/{entidad} | JWT+Admin | Crear |
| PUT | /api/{entidad}/{id} | JWT+Admin | Actualizar |
| DELETE | /api/{entidad}/{id} | JWT+Admin | Eliminar (soft delete) |

## 5. Rutas Frontend

| Ruta | Componente | Auth | Descripción |
|------|-----------|------|-------------|
| /{entidad} | {Entidad}ListPage | Auth | Lista paginada |
| /{entidad}/nuevo | {Entidad}FormPage | Admin | Crear |
| /{entidad}/:id | {Entidad}FormPage | Admin | Editar |

## 6. Consideraciones de arquitectura

### Trade-offs y decisiones
- [Decisión 1]: [opción elegida] vs [opción descartada]. Motivo: [...]
- [Decisión 2]: ...

### Riesgos
- [Riesgo 1]: [descripción] — Mitigación: [...]
- [Riesgo 2]: ...

### Dependencias
- [Dependencia externa o de otro módulo que puede afectar el timeline]

## 7. Plan de testing

### Tests unitarios (xUnit + Moq)
```csharp
// Qué services/repositories cubrir con mocks
[Fact] public async Task GetByIdAsync_ReturnsDto_WhenExists() { ... }
[Fact] public async Task CreateAsync_ThrowsValidationException_WhenInvalidInput() { ... }
```

### Tests de integración
- `WebApplicationFactory<Program>` para flujos críticos
- Cubrir: happy path + error 400 + error 404 + error 403

### Tests de UI (opcional)
- Playwright para flujo completo si es feature crítico

## 8. Plan de rollout

- [ ] Migration ejecutada en dev (`dotnet ef database update`)
- [ ] `dotnet build` sin warnings
- [ ] Tests pasan (`dotnet test`)
- [ ] `npm run build` sin errores
- [ ] Happy path validado manualmente
- [ ] Script de migration preparado para producción
```

## Reglas para un buen TECH.md

**Orientado a implementación, ligero en ceremonia:**
- Incluir solo decisiones que no son obvias para el equipo/agente
- Si el pattern es estándar (CRUD de entidad), basta referenciar la convención
- Documentar trade-offs solo cuando hay alternativas reales que valió la pena considerar

**Secuencia de implementación explícita:**
- El orden bottom-up (DB → Repository → Service → Controller → Frontend) evita
  implementar algo que depende de algo que aún no existe

**Riesgos honestos:**
- Mencionar migraciones de DB que podrían afectar datos existentes
- Mencionar si hay dependencia de feature X que no está lista
- Mencionar cambios breaking en endpoints existentes

## Después de escribir TECH.md

1. Presentar junto con PRODUCT.md para aprobación combinada
2. Una vez aprobado → usar `implement-specs` para la implementación

## Related Skills

- `spec-driven-implementation`
- `write-product-spec`
- `implement-specs`
