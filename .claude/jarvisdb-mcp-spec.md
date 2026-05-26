# JarvisDB MCP — Especificación de Contrato

> **Propósito:** Define las firmas de función, payloads esperados, y reglas de fallback
> para el MCP de JarvisDB usado por los agentes del framework.
> Todos los agentes que llaman a estos MCPs DEBEN implementar el bloque de fallback.

---

## Configuración de conexión

El MCP lee de `state.json.jarvis_db`:
```json
{
  "server":    "JORGE_R\\SQL",
  "database":  "JarvisDB",
  "enabled":   true,
  "last_sync": null
}
```

Si `enabled: false` → saltar TODO llamado MCP y continuar normalmente.

---

## Funciones disponibles

### 1. `get_context(task, project, stack)`

**Usado por:** OrchestratorAgent (Paso 0), BackendAgent, DebugAgent

```json
// Input
{
  "task":    "descripción de la tarea actual (ej: 'generar controllers para Clientes')",
  "project": "nombre del proyecto (de state.json)",
  "stack":   "NET8_React | Python_FastAPI_React | ..." 
}

// Output
{
  "lessons": [
    { "id": "LECCION-001", "type": "bugfix|pattern|antipattern", "description": "...", "relevance_score": 0.87 }
  ],
  "patterns": [...],
  "top_risk": "descripción del riesgo más relevante para esta tarea"
}
```

**Fallback si MCP no disponible:**
```
→ Continuar sin contexto adicional. Registrar en OUTPUT: "jarvisdb_context": "unavailable"
```

---

### 2. `log_agent_run(payload)`

**Usado por:** Todos los agentes al iniciar (OBLIGATORIO cuando jarvis_db.enabled == true)

```json
// Input
{
  "agent_name":     "BackendAgent",
  "status":         "started | completed | failed",
  "project_name":   "MiSistema",
  "phase":          "backend | frontend | db | ...",
  "trigger_reason": "schema.sql encontrado, backend/ no existe"
}

// Output
{
  "run_id": "uuid-del-registro",
  "ok": true
}
```

**Fallback si MCP no disponible:**
```
→ Omitir silenciosamente. NO detener la ejecución del agente.
  Registrar en OUTPUT: "jarvisdb_log": "skipped_unavailable"
```

---

### 3. `save_lesson(payload)`

**Usado por:** DebugAgent (al resolver), ReviewAgent (al emitir lecciones), MemorySyncAgent

```json
// Input
{
  "type":        "bugfix | pattern | antipattern | decision | config",
  "description": "descripción concisa de la lección (≤ 150 caracteres)",
  "context":     {
    "file":     "archivo donde ocurrió (si aplica)",
    "agent":    "agente que generó la lección",
    "project":  "proyecto (opcional)"
  },
  "tags":        ["dotnet", "efcore", "migrations"]
}

// Output
{
  "lesson_id": "LECCION-NNN-slug-v1",
  "ok": true
}
```

**Fallback si MCP no disponible:**
```
→ Escribir la lección en state.json.evolution.last_lesson (campo texto).
  Incrementar state.json.evolution.lessons_pending += 1.
  Al próximo inicio de sesión, MemorySyncAgent procesará el backlog.
```

---

### 4. `sync_project_state(payload)`

**Usado por:** OrchestratorAgent (al finalizar cada fase), MemorySyncAgent

```json
// Input
{
  "project":        "NombreProyecto",
  "phase":          "fase que acaba de completar",
  "artifacts":      ["lista de archivos generados"],
  "state_updates":  { "phases.backend": "done", "lastAgent": "BackendAgent" }
}

// Output
{
  "ok": true,
  "synced_at": "2026-04-06T12:00:00Z"
}
```

**Fallback si MCP no disponible:**
```
→ Actualizar únicamente state.json local con los state_updates.
  Registrar en OUTPUT: "jarvisdb_sync": "local_only"
```

---

### 5. `queue_agent(payload)`

**Usado por:** OrchestratorAgent (para encolar el siguiente agente)

```json
// Input
{
  "agent_name": "ReviewAgent",
  "payload":    { "files_to_review": ["..."], "context": "..." },
  "priority":   "high | normal | low"
}

// Output
{
  "queue_id": "uuid",
  "position": 1,
  "ok": true
}
```

**Fallback si MCP no disponible:**
```
→ Invocar el agente directamente con runSubagent() sin pasar por la cola.
  Este es el comportamiento estándar actual del framework.
```

---

### 6. `get_evolved_skills(agent_name)`

**Usado por:** EvolutionAgent, MemorySyncAgent

```json
// Input
{
  "agent_name": "BackendAgent"   // o null para todos
}

// Output
{
  "skills": [
    { "id": "LECCION-001", "name": "aspnet-middleware-order", "version": 1, "delta": 4.5, "active": true }
  ]
}
```

**Fallback si MCP no disponible:**
```
→ Leer `.claude/evolution.json.skills_evolved[]` como fuente alternativa.
```

---

## Regla Global de Fallback

```
SI jarvis_db.enabled == false OR MCP no responde en < 3s:
  1. Continuar el agente normalmente SIN interrumpir el pipeline
  2. Registrar en el OUTPUT JSON del agente: "jarvisdb_status": "unavailable"
  3. NO hacer retry del MCP
  4. Funciones de escritura (save_lesson, log_agent_run): usar fallback local
  5. Funciones de lectura (get_context, get_evolved_skills): continuar sin contexto adicional
```

---

## Estado actual de implementación

| Función | Implementación | Status |
|---------|---------------|--------|
| `get_context` | Via `mcp_jarvisdb_get_context` | ✅ Activo |
| `log_agent_run` | Via `mcp_jarvisdb_log_agent_run` | ✅ Activo |
| `save_lesson` | Via `mcp_jarvisdb_save_knowledge` | ✅ Activo |
| `sync_project_state` | Via `mcp_jarvisdb_sync_project_state` | ✅ Activo |
| `queue_agent` | Via `mcp_jarvisdb_queue_agent` | ✅ Activo |
| `get_evolved_skills` | Via `mcp_jarvisdb_get_evolved_skills` | ✅ Activo |

> Si el servidor MCP `mcp_jarvisdb_*` no está disponible en VS Code,
> todos los agentes deben ejecutar el fallback local especificado arriba.
