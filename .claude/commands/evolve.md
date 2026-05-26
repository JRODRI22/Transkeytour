---
description: Dispara manualmente el EvolutionAgent (16) para procesar lecciones pendientes y convertirlas en skills permanentes.
---

# /evolve — Disparador Manual del EvolutionAgent

> **Cuándo usar:**  
> - Cuando quieres solidificar una lección concreta sin esperar al umbral automático (lessons_pending >= 3)  
> - Después de resolver un bug difícil: `"/evolve — aprende de este error"`  
> - Para ver el estado actual del sistema de auto-evolución  
> - También se activa con: `"solidifica la lección"`, `"aprende de este error"`, `"qué lecciones tenemos pendientes"`

---

## Modos de activación

### Modo 1 — Forzar procesamiento (aunque lessons_pending < 3)
```
/evolve
```
Procesa TODAS las lecciones en `state.json.evolution.lessons_pending`, aunque sean menos de 3.

### Modo 2 — Solidificar lección específica
```
/evolve: [descripción de la lección]
```
Ejemplo: `/evolve: JWT refresh token no se enviaba por capitalización incorrecta en el header`

### Modo 3 — Ver estado del sistema
```
/evolve status
```
Muestra: evolution_score, retry_rate_improvement, skills_evolved count, lessons_pending count, last_run.

---

## Protocolo de ejecución

El OrchestratorAgent ejecuta:

```
1. Leer state.json.evolution.lessons_pending
2. Leer evolution.json para estado actual
3. runSubagent(EvolutionAgent, {
     trigger: "manual",
     lessons_to_process: [lecciones actuales],
     context: "manual via /evolve command"
   })
4. Recibir OUTPUT: skills_created, evolution_score_delta
5. Actualizar state.json + evolution.json
6. Crear .claude/skills/evolved/LECCION-XXX.md para cada skill nueva
7. Reportar resumen al usuario
```

---

## OUTPUT esperado

```
✅ EvolutionAgent completado
📚 Lecciones procesadas: N
🧠 Skills creadas: [lista]
📈 Evolution score: X.X → Y.Y (+delta)
📁 Archivos: .claude/skills/evolved/LECCION-XXX.md
```

---

## Relación con otros mecanismos

| Mecanismo | Cuándo dispara EvolutionAgent |
|-----------|-------------------------------|
| Automático | `evolution.lessons_pending >= 3` en state.json |
| Post-pipeline | Al completar SecurityAgent (fase 7) |
| Manual | `/evolve` (este comando) |
| Reaction | `evolution_lessons_pending_gte3` en reactions.conf |
