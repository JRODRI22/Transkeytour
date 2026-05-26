# /cleanup-context — Limpiar Contexto de Sesión

Limpia el contexto de la sesión y actualiza el Memory Bank antes de continuar.
Útil cuando el contexto está muy largo o al retomar trabajo después de un descanso.

## Qué hace este comando

1. Llama `MemorySyncAgent` para guardar el estado actual en los 4 archivos Memory Bank
2. Resume el estado del proyecto en ≤10 líneas
3. Identifica la próxima acción recomendada

## Cómo usar

```
/cleanup-context
/cleanup-context --save-only    (solo guarda, no resume)
/cleanup-context --resume-only  (solo resume, no guarda)
```

## Output esperado

```
✅ Memory Bank actualizado:
  - CLAUDE-activeContext.md → estado de fase guardado
  - CLAUDE-patterns.md → 0 patrones nuevos
  - CLAUDE-decisions.md → 0 ADRs nuevos
  - CLAUDE-troubleshooting.md → 0 bugs nuevos

📍 Estado del proyecto:
  Proyecto: [nombre]
  Fase activa: [fase]
  Último agente: [nombre]
  Build: [✅ OK / ❌ Error]
  Gates pendientes: [ninguno / lista]

▶️ Próxima acción recomendada:
  [descripción de qué hacer a continuación]
```

## Cuándo usar

- Antes de cerrar la sesión (obligatorio)
- Cuando el contexto supera 100K tokens
- Al retomar trabajo en un proyecto pausado
- Después de resolver un bug complejo
- Antes de lanzar un nuevo subagente
