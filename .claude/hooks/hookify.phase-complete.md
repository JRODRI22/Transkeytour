---
name: phase-complete-sync
enabled: true
event: stop
action: warn
conditions:
  - field: transcript
    operator: regex_match
    pattern: phases\.(db|backend|frontend|integration|review|devops|security)\s*[=:]\s*['""]?done['""]?
---

📦 **Fase completada — Sincronización de memoria pendiente**

Se detectó que una fase del pipeline acaba de marcarse como `done`.

**Acciones automáticas recomendadas antes de cerrar:**
1. MemorySyncAgent actualizará `CLAUDE-activeContext.md` con el nuevo estado
2. SentinelAgent verificará consistencia entre artefactos generados
3. Actualizar `docs/TASKS.md` — marcar tareas de esta fase como `✅ Done`

**Si vas a cerrar la sesión ahora:**
Escribe `update-memory-bank` para asegurar que el contexto queda guardado.
La próxima sesión comenzará desde donde quedaste sin perder contexto.

---
*Este hook es informativo — no bloquea. Puedes continuar normalmente.*
