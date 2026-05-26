---
name: implement-specs
description: Implement an approved feature from PRODUCT.md and TECH.md in a .NET/React project, keeping specs and code aligned in the same PR as implementation evolves. Use after product and tech specs are approved and the next step is building the feature across any combination of layers (DB, Backend, Frontend, Integration).
---

# implement-specs

Implementa un feature aprobado desde `PRODUCT.md` y `TECH.md`, manteniendo specs y
código sincronizados en el mismo PR conforme la implementación evoluciona.

## Overview

Usar este skill después de que los specs de producto y técnicos estén aprobados. La
meta es construir el feature descrito por los specs manteniendo alineados los specs
checkeados y la implementación conforme el trabajo avanza.

Los specs aprobados deben vivir en `specs/<nombre-feature>/PRODUCT.md` y
`specs/<nombre-feature>/TECH.md`.

En la mayoría de casos, la implementación debe pushearse en el mismo PR que los specs.
Los cambios a `PRODUCT.md`, `TECH.md` y código deben estar en ese mismo PR para que
el review permanezca anclado al feature que realmente shippea.

## Prerequisites

Antes de usar este skill:
- Confirmar que `PRODUCT.md` existe y está aprobado
- Confirmar que `TECH.md` existe cuando el feature lo ameritó
- Confirmar que los specs relevantes han sido revisados suficientemente para empezar

## Workflow

### 1. Leer los specs aprobados primero

Tratar:
- `PRODUCT.md` como fuente de verdad para comportamiento al usuario
- `TECH.md` como fuente de verdad para arquitectura, secuenciación y shape de implementación

Asegurarse de entender el comportamiento esperado, constraints, riesgos y plan de
validación antes de escribir código.

### 2. Identificar las capas necesarias

Determinar qué capas requiere la implementación:
- **Base de datos**: nuevas tablas, columnas, FK → DatabaseAgent o migration EF Core
- **Backend**: Models, DTOs, Repository, Service, Controller → BackendAgent
- **Frontend**: páginas, componentes, servicios Axios → FrontendAgent
- **Integración**: conectar servicios Axios con endpoints reales → IntegrationAgent

Para features cross-layer, implementar de abajo hacia arriba:
`DB migration → Repository/Service → Controller → Frontend service → UI`

### 3. Planificar e implementar contra los specs

Descomponer el trabajo en pasos concretos de implementación, luego implementar el
feature contra los specs aprobados.

Durante implementación:
- Mantener comportamiento alineado con `PRODUCT.md`
- Mantener arquitectura y secuenciación alineada con `TECH.md`
- Agregar o actualizar tests y artefactos de verificación conforme el trabajo llega

Usar el mismo PR para los specs e implementación cuando sea práctico.

### 4. Actualizar specs conforme la implementación evoluciona

Si la implementación revela que el comportamiento o diseño previsto deben cambiar,
actualizar los specs en lugar de dejarlos stale.

En particular:
- Actualizar `PRODUCT.md` cuando comportamiento al usuario, UX, edge cases o
  criterios de éxito cambian
- Actualizar `TECH.md` cuando arquitectura, secuenciación, module boundaries o
  estrategia de validación cambian
- Mantener esas actualizaciones en el mismo PR que los code changes correspondientes

El PR debe describir el feature que realmente shippea, no solo el borrador inicial.

### 5. Verificar contra los specs

Antes de considerar el trabajo completo, verificar que el código coincide con los
specs actuales.

Preferir:
- Tests xUnit + Moq para tests unitarios a nivel de Service/Repository
- Tests de integración con `WebApplicationFactory<Program>` para flujos críticos
- `npm run build` y Playwright/manuale para flujos de UI importantes

### Convenciones de código (stack del proyecto)

**Backend (.NET 8):**
- Controllers: `[ApiController]` + `[Route("api/[controller]")]`, solo delegación al service
- Services: `IXxxService` + `XxxService`, toda la lógica de negocio aquí
- Repositories: `IXxxRepository` + `XxxRepository`, acceso a datos solo aquí
- DTOs: `record` de C# con validaciones `[Required]`, `[EmailAddress]`, etc.
- No usar `.Result`, `.Wait()`, `.GetAwaiter().GetResult()` — async/await en toda la cadena

**Frontend (React 18 + Vite):**
- Un service por módulo: `{entidad}Service.js` importando instancia Axios de `services/api.js`
- Toast con `react-hot-toast` para feedback al usuario
- TailwindCSS para estilos

**Base de datos (SQL Server):**
- `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()` para IDs
- `IsDeleted BIT NOT NULL DEFAULT 0` soft delete en todas las entidades
- `EF Core HasQueryFilter(e => !e.IsDeleted)` para filtrado automático

## Best Practices

- Mantener specs y código sincronizados durante toda la implementación.
- Preferir actualizar el spec inmediatamente cuando las decisiones cambian, no batching.
- Usar documentos de tracking opcionales solo cuando agreguen valor real para features complejos.
- Mantener el mismo PR coherente: actualizaciones de spec, code changes, tests juntos.

## Related Skills

- `spec-driven-implementation`
- `write-product-spec`
- `write-tech-spec`
- `test-driven-development`
