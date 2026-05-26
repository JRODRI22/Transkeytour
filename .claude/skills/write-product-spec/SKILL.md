---
name: write-product-spec
description: Write a PRODUCT.md spec describing user-facing behavior for a feature before implementation begins. Use when starting a substantial feature in a .NET/React project that benefits from a written product spec checked into source control. Covers problem definition, desired UX, business rules, edge cases, success criteria, and validation plan.
---

# write-product-spec

Escribe el `PRODUCT.md` que describe el comportamiento al usuario de una feature antes
de que comience la implementación.

## Overview

El product spec define **qué** se construye — el comportamiento al usuario, las reglas
de negocio y los criterios de éxito. Es la fuente de verdad para comportamiento durante
la implementación.

Ubicación: `specs/<nombre-feature>/PRODUCT.md`
Ejemplo: `specs/T12-modulo-pagos/PRODUCT.md`

## Cuándo escribir PRODUCT.md

Siempre antes de implementar cuando:
- La feature es suficientemente sustancial para que la ambigüedad cueste implementación
- Múltiples personas o agentes necesitan entender el comportamiento esperado
- El comportamiento al usuario tiene edge cases o reglas de negocio no triviales
- El review se beneficia de poder comparar implementación vs spec

## Estructura de PRODUCT.md

```markdown
# PRODUCT.md — [Nombre del Feature]

## Referencia
- Ticket TASKS.md: [T-XX]
- Fecha: [YYYY-MM-DD]
- Autor: [ArchitectAgent / nombre]

## 1. Problema que se resuelve
[Qué necesita hacer el usuario que actualmente no puede, o que es doloroso/ineficiente.
Describir desde la perspectiva del usuario, no de la tecnología.]

## 2. Experiencia de usuario deseada
[Describir el flujo de usuario paso a paso. ¿Qué ve? ¿Qué hace? ¿Qué recibe?
Para cambios de UI, incluir wireframe o descripción detallada de cada pantalla/modal.]

### Flujo principal (happy path)
1. El usuario navega a [ruta]
2. [Acción]
3. [Resultado visible]

### Flujos alternativos
- Si [condición X]: [comportamiento Y]

## 3. Invariantes y reglas de negocio
- [Regla 1]: [descripción clara. Ej: "Un cliente solo puede tener una factura activa por mes"]
- [Regla 2]: [descripción + excepciones si las hay]
- Permisos: [quién puede hacer qué — Admin / Usuario / Público]

## 4. Edge cases
- [Caso borde 1]: [comportamiento esperado]
- [Caso borde 2]: [comportamiento esperado]
- Validaciones de input: [qué se valida y qué mensaje muestra el usuario]

## 5. Criterios de éxito
- [ ] [Criterio 1 verificable]: Ej: "El usuario puede crear un cliente y verlo en la lista inmediatamente"
- [ ] [Criterio 2 verificable]
- [ ] [Criterio 3 — negativo]: Ej: "Un usuario sin rol Admin no puede acceder a [X]"

## 6. Plan de validación
[Cómo se verificará que el feature funciona. Puede ser:
- Tests xUnit específicos
- Pasos de validación manual
- Screenshot o grabación de pantalla
- Playwright test de flujo]

## 7. Out of scope (v1)
[Qué queda explícitamente fuera de este spec. Ayuda a prevenir scope creep.]
```

## Reglas para escribir un buen PRODUCT.md

**Orientado a comportamiento, no a implementación:**
- ✅ "Cuando el usuario crea un cliente, aparece en la lista con estado Activo"
- ❌ "El endpoint POST /api/clientes guarda en la tabla Clientes y retorna 201"

**Criterios de éxito verificables:**
- ✅ "El usuario puede buscar clientes por nombre desde la barra de búsqueda"
- ❌ "La búsqueda funciona bien"

**Reglas de negocio explícitas:**
- Incluir permisos (qué rol puede qué acción)
- Incluir validaciones (longitud, formato, rangos)
- Incluir comportamiento en error (¿qué ve el usuario si falla?)

**Edge cases no triviales:**
- ¿Qué pasa si el usuario intenta hacer X cuando Y ya existe?
- ¿Qué pasa si se pierde la conexión durante una operación?
- ¿Qué comportamiento al borrar un registro con dependientes?

## Después de escribir PRODUCT.md

1. Presentar al usuario/reviewer para aprobación
2. Si la feature es sustancial o cross-cutting → usar `write-tech-spec` para TECH.md
3. Si feature es simple y PRODUCT.md es suficiente → proceder con `implement-specs`

## Related Skills

- `spec-driven-implementation`
- `write-tech-spec`
- `implement-specs`
