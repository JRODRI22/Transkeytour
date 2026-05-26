---
name: spec-driven-implementation
description: Drive a spec-first workflow for substantial features by writing specs/PROJECT/PRODUCT.md before implementation, writing TECH.md when warranted, and keeping both updated as implementation evolves. Use when starting a significant feature in a .NET/React project, planning agent-driven implementation, or when product and tech specs should be checked into source control before any code is written.
---

# spec-driven-implementation

Impulsa un flujo spec-first para features sustanciales: PRODUCT.md antes de implementar,
TECH.md cuando corresponde, y ambos actualizados conforme evoluciona la implementación.

## Overview

Usar este skill para features significativas donde un spec escrito mejora la calidad
de implementación, reduce ambigüedad, o facilita el review. Ser pragmático: no todo
cambio necesita specs.

Los specs viven en:
- `specs/<nombre-feature>/PRODUCT.md`
- `specs/<nombre-feature>/TECH.md`

El nombre de la carpeta debe ser el ticket de TASKS.md o un slug kebab-case descriptivo.
Ejemplo:
- `specs/T12-modulo-pagos/PRODUCT.md`
- `specs/T12-modulo-pagos/TECH.md`

## Cuándo se requieren specs

**Preferir specs cuando:**
- Ambigüedad de producto o arquitectura
- Implementación estimada ≥ 500 LOC
- Cambios deep o cross-cutting (múltiples capas: DB + Backend + Frontend)
- Cambios riesgosos donde las regresiones serían caras
- Trabajo donde la calidad del agente mejoraría materialmente con inputs más claros

**Los specs a menudo son innecesarios para:**
- Bug fixes pequeños y locales
- Refactors directos con scope claro
- Ajustes de UI sin ambigüedad de comportamiento

Para cambios de UI puros, PRODUCT.md suele ser útil; TECH.md puede omitirse.

## Workflow

### 1. Decidir si la feature necesita specs

Evaluar tamaño, ambigüedad y riesgo. Si los specs no mejorarán materialmente la
ejecución o el review, saltarlos y enfocarse en verificación directamente.

### 2. Escribir el product spec primero

Antes de implementar, crear `PRODUCT.md` describiendo el comportamiento deseado
al usuario. Usar el skill `write-product-spec` para producirlo.

### 3. Escribir el tech spec cuando corresponda

Usar el skill `write-tech-spec` para trabajo sustancial o ambiguo. Preferir
tech spec cuando:
- La implementación abarca múltiples capas (DB → Service → Controller → UI)
- La arquitectura o extensibilidad importan
- Hay trade-offs a documentar
- Los reviewers se beneficiarían más de revisar el plan que el código crudo

### 4. Implementar desde los specs aprobados

Después de que los specs estén aprobados, usar el skill `implement-specs` para
construir desde `PRODUCT.md` y `TECH.md` aprobados.

La implementación puede pushearse en el mismo PR que los specs de producto y
técnicos. Los cambios a `PRODUCT.md`, `TECH.md` y código deben estar en ese mismo
PR para que el review refleje el feature que realmente shippe.

### 5. Mantener specs actualizados durante implementación

Si la implementación cambia del spec, actualizar el spec en lugar de dejarlo stale.

Actualizar `PRODUCT.md` cuando:
- El comportamiento al usuario cambia
- Los criterios de éxito cambian
- Detalles UX o edge cases cambian

Actualizar `TECH.md` cuando:
- El approach de implementación cambia
- Las boundaries arquitectónicas se mueven
- Riesgos, dependencias o detalles de rollout cambian
- El plan de testing/validación cambia

### 6. Verificar comportamiento contra el spec

Antes de considerar el trabajo completo, asegurarse de que la verificación se
mapea de vuelta a los specs:
- Tests unitarios (xUnit + Moq) para cobertura a nivel de service/repository
- Tests de integración para flujos críticos de usuario
- Screenshots o descripción verbal para features con UI

## Best Practices

- Ser pragmático ante todo.
- Escribir specs para mejorar la calidad del input para agentes, no como ceremonia.
- Mantener product specs orientados a comportamiento, ligeros en implementación.
- Mantener tech specs orientados a implementación y arraigados en patrones del codebase actual.
- Usar el review para validar specs y comportamiento, no para sobre-indexar en style nits.

## Related Skills

- `implement-specs`
- `write-product-spec`
- `write-tech-spec`
