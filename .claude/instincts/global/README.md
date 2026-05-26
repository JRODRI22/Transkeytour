# .claude/instincts/global — README

Este directorio contiene instincts globales (cross-project) generados por el EvolutionAgent.

## Formato de un instinct global

```yaml
---
id: global-001
trigger: "git commit sin mensaje"
confidence: 0.85
domain: git
scope: global
created: 2026-04-07
source_lessons: 3
---

Siempre verificar que el mensaje de commit no esté vacío antes de ejecutar `git commit`.
Usar el hook `git-push-guard.js` para bloquear automáticamente.
```

## Gestión

- **Crear instinct**: EvolutionAgent genera el archivo con confidence inicial 0.3
- **Actualizar confidence**: sube 0.1 cada vez que la observación se confirma
- **Decay**: baja 0.05 por semana sin confirmación (máx 30 días sin uso)
- **Promover a skill**: cuando confidence >= 0.8 → EvolutionAgent crea skill completa

## Archivo de estado

`.claude/instincts/global/index.yaml` — índice de todos los instincts con su confidence actual
