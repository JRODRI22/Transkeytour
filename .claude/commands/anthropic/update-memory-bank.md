# /update-memory-bank — Sincronizar Memory Bank

Guarda el estado actual del proyecto en los 4 archivos Memory Bank.
**Ejecutar obligatoriamente al finalizar cada sesión de trabajo.**

## Qué hace este comando

Llama directamente a `MemorySyncAgent` para actualizar:
- `CLAUDE-activeContext.md` — estado actual de la sesión y proyecto
- `CLAUDE-patterns.md` — patrones de código nuevos descubiertos
- `CLAUDE-decisions.md` — decisiones de arquitectura tomadas
- `CLAUDE-troubleshooting.md` — bugs resueltos en la sesión

## Cómo usar

```
/update-memory-bank
/update-memory-bank --only-context    (solo actualiza activeContext)
/update-memory-bank --add-pattern     (modo interactivo para agregar patrón)
/update-memory-bank --add-decision    (modo interactivo para agregar ADR)
/update-memory-bank --add-bug         (modo interactivo para agregar bug resuelto)
```

## Por qué es obligatorio

Sin sincronización, la próxima sesión comenzará sin contexto:
- El agente re-leerá TODO el codebase (100K+ tokens desperdiciados)
- Decisiones tomadas pueden revertirse sin saberlo
- Bugs ya resueltos pueden reaparecer

Con Memory Bank actualizado:
- La sesión inicia con contexto en < 5KB de texto
- Reducción del 30-50% en consumo de tokens por sesión
- Continuidad garantizada entre sesiones

## Output esperado

```
✅ /update-memory-bank ejecutado

Memory Bank actualizado:
  📍 CLAUDE-activeContext.md → Fase [X], estado guardado
  🔧 CLAUDE-patterns.md → [N] patrones (sin cambios / +N nuevos)
  📋 CLAUDE-decisions.md → [N] ADRs (sin cambios / +N nuevos)
  🐛 CLAUDE-troubleshooting.md → [N] bugs (sin cambios / +N nuevos)

La próxima sesión cargará este estado automáticamente.
```

## Alias disponibles

- `/update-memory-bank`
- "actualiza contexto"
- "sincroniza memoria"
- "guarda la sesión"
