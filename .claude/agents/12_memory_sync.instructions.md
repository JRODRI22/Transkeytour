---
applyTo: "**"
description: "Auto-trigger post-fase: sincroniza los 4 archivos CLAUDE-*.md (activeContext, patterns, decisions, troubleshooting) con el estado actual."
---

# MemorySyncAgent (12) — Memory Bank Synchronizer

## Rol
Mantener los 4 archivos Memory Bank del proyecto sincronizados con el estado actual.  
**Estrategia Progressive Disclosure:** el contexto se guarda en capas de costo de tokens creciente.  
La próxima sesión carga primero el índice compacto → decide qué detalle cargar → ahorra 50-70% tokens.

## Trigger automático
- Al ejecutar `/update-memory-bank`
- Al finalizar cualquier fase del pipeline
- Al detectar contexto largo (3+ fases completadas en la misma sesión)
- Keywords: "update-memory-bank", "actualiza contexto", "sincroniza memoria", "guarda session"

## Los 4 archivos Memory Bank

| Archivo | Propósito | Cuándo actualizar |
|---------|-----------|-------------------|
| `CLAUDE-activeContext.md` | Índice compacto (OBS) + estado actual | Siempre (cada sync) |
| `CLAUDE-patterns.md` | Patrones de código verificados | Al descubrir/validar un patrón nuevo |
| `CLAUDE-decisions.md` | ADRs y decisiones de arquitectura | Al tomar una decisión de diseño |
| `CLAUDE-troubleshooting.md` | Bugs conocidos + soluciones | Al resolver un bug |

---

## Protocolo Progressive Disclosure — 3 Capas

### Capa 1 — Índice (siempre cargado, ~50 tokens/observación)
```
OBS-001 | bugfix     | 2026-03-15 | Error en JWT al expirar token — solucionado con refresh
OBS-002 | pattern    | 2026-03-15 | Patrón Repository genérico aplicado en ClienteRepository
OBS-003 | decision   | 2026-03-15 | Usar UNIQUEIDENTIFIER para IDs en lugar de int
OBS-004 | phase_done | 2026-03-15 | Fase Backend completada — 12 archivos generados
```
→ Permite decidir qué cargar sin leer los detalles completos (~200 tokens total para 4 obs).

### Capa 2 — Estado actual (cargado después del índice, ~300 tokens)
```
Estado de fase, último agente, próximos pasos, gates pendientes, referencias rápidas
```
→ Suficiente para retomar la sesión.

### Capa 3 — Detalle completo (solo cuando se necesita, ~500-1000 tokens/entrada)
```
Código de solución, snippets de patrón, full ADR, stack trace completo
```
→ Solo cargar si la Capa 1 indica que esa OBS es relevante para la tarea actual.

---

## Protocolo de sincronización

### Paso -1 — Backup atómico de state.json [ANTES de cualquier escritura]
```
SIEMPRE antes de escribir state.json:
1. Leer state.json actual
2. Copiar a state.json.bak (sobrescribir — solo se conserva el backup de la última escritura)
3. Registrar timestamp en state.json["_last_backup"] = ISO8601 timestamp
4. Escribir state.json nuevo
5. Si la escritura falla: state.json.bak sirve como recuperación manual

Al iniciar sesión: si state.json está corrupto (JSON inválido):
  → Verificar si state.json.bak existe y es válido
  → Si sí: restore state.json desde .bak, notificar al usuario
  → Si no: inicializar desde state-template.json, notificar al usuario
```

### Paso -0.5 — OBS pruning del índice [ANTES de agregar nuevas entradas]
```
EJECUTAR antes de cada sync del CLAUDE-activeContext.md:
1. Contar entradas OBS en la Capa 1 del índice activo
2. Si count > 10:
   a. Identificar las entradas más antiguas (OBS con IDs más bajos) hasta contar el exceso
   b. Abrir (o crear) CLAUDE-activeContext-archive.md
   c. Mover las entradas excedentes al final de CLAUDE-activeContext-archive.md
      (Agregar encabezado "## Archivado {fecha}" si es una nueva sección)
   d. Mantener siempre las últimas 10 entradas en CLAUDE-activeContext.md Capa 1
   e. Notificar en el resumen: "🗂 {N} entradas OBS archivadas (índice > 10). Archivo: CLAUDE-activeContext-archive.md"
3. Si count <= 10: no hacer nada
Objetivo: La Capa 1 nunca crece más allá de ~500 tokens.
```

### Paso 0-DB — Persistir en JarvisDB SQL Server [SIEMPRE antes de escribir archivos]
```
IMPORTANTE: Estrategia dual-write — escribir SIEMPRE en DB Y en archivos CLAUDE-*.md.
Si la DB no está disponible (MCP no iniciado): continuar con archivos locales normalmente.
Si save_lesson falla: NO ignorar silenciosamente → log en CLAUDE-troubleshooting.md con
  "LECCIÓN PERDIDA: {description} — JarvisDB no disponible en {timestamp}"

Al recibir una lección (source: DebugAgent):
  save_lesson({
    lesson_type:       lesson.type,          -- 'bugfix' | 'pattern' | 'decision'
    source_agent:      lesson.source_agent,
    title:             lesson.description,
    description:       lesson.description,
    root_cause:        lesson.root_cause,
    fix:               lesson.fix,
    severity:          lesson.severity,
    scope:             lesson.scope,
    project_name:      state.project,
    stack:             state.stack.name,
    tags:              lesson.tags || null,
    applies_to_agents: lesson.applies_to?.join(',') || null,
    files_affected:    lesson.files_affected?.join(',') || null,
  })

Al actualizar CLAUDE-patterns.md con patrón nuevo:
  save_pattern({
    name:         pattern.name,
    description:  pattern.description,
    language:     pattern.language,        -- 'csharp', 'react', 'sql'
    code_example: pattern.code,
    why_it_works: pattern.why,
    related_agent: source_agent,
  })

Al actualizar CLAUDE-decisions.md con ADR nuevo:
  save_decision({
    title:        adr.title,
    context:      adr.context,
    decision:     adr.decision,
    rationale:    adr.rationale,
    alternatives: adr.alternatives,
    status:       'accepted',
    project_name: state.project || null,
  })

Al terminar sync completo:
  sync_project_state({
    project_name:     state.project,
    active_phase:     state.phases.active,
    last_agent:       state.lastAgent,
    completed_phases: state.phases.done?.join(','),
    state_json:       JSON.stringify(state),
    tokens_saved:     estimado (200 si se omitió cargar CLAUDE-*.md esta sesión)
  })
```

### Paso 0 — Procesar lecciones pendientes de state.json (SIEMPRE PRIMERO)
```
Si state.json.evolution.last_lesson != null:
  1. Leer el objeto last_lesson completo de state.json
  2. Asignar el próximo ID de error: ERR-NNN (leer CLAUDE-troubleshooting.md para determinar el último)
  3. APPEND a CLAUDE-troubleshooting.md con este formato exacto:

     ### ERR-NNN — {last_lesson.description}
     **Agente origen:** {last_lesson.source_agent}  
     **Causa raíz:** {last_lesson.root_cause}  
     **Solución:** {last_lesson.fix}  
     **Severidad:** {last_lesson.severity} | **Scope:** {last_lesson.scope}  
     **Agentes afectados:** {last_lesson.applies_to join(", ")}  
     **Fecha:** {last_lesson.timestamp}  

  4. APPEND a .claude/evolution.json — agregar al array lessons_log:
     {
       "id": "LECCION-NNN",
       "timestamp": "{last_lesson.timestamp}",
       "type": "{last_lesson.type}",
       "source": "{last_lesson.source_agent}",
       "summary": "{last_lesson.description}",
       "skill_path": null,
       "status": "pending_evolution",
       "triggered_count": 0
     }
  5. Limpiar state.json: evolution.last_lesson = null  (ya fue procesada)
  6. Continuar con los pasos siguientes

Si state.json.evolution.last_lesson == null:
  → Saltar al Paso 1 directamente
```

### Paso 1 — Leer estado actual
```
- Leer CLAUDE-activeContext.md (índice actual)
- Leer .claude/state.json
- Revisar archivos modificados en la sesión
- Identificar nuevas observaciones a registrar
- Asignar próximo ID auto-incremental (OBS-NNN)
```

### 2. Actualizar CLAUDE-activeContext.md

Estructura en dos partes:

```markdown
# CLAUDE-activeContext.md — Estado Activo

> ÍNDICE DE OBSERVACIONES (Capa 1 — siempre cargar)

| ID | Tipo | Fecha | Resumen (1 línea) |
|----|------|-------|-------------------|
| OBS-001 | phase_done | YYYY-MM-DD | [qué se completó] |
| OBS-002 | bugfix | YYYY-MM-DD | [bug resuelto] |
| OBS-003 | pattern | YYYY-MM-DD | [patrón aplicado] |
| OBS-004 | decision | YYYY-MM-DD | [decisión tomada] |

> ESTADO ACTUAL (Capa 2 — cargar para retomar sesión)

**Proyecto:** [nombre]
**Última actualización:** YYYY-MM-DD
**Fase activa:** [Fase X — NombreFase]

| Campo | Valor |
|-------|-------|
| Fase | [fase activa] |
| Último agente | [nombre] |
| Próximo agente | [nombre] o pendiente |
| Estado build | ✅ OK / ❌ Error / ⏳ Pendiente |
| Gate pendiente | [ninguno / descripción] |

**Referencias rápidas:**
- Backend: :[puerto] · Frontend: [puerto] · DB: [nombre]
- Connection: [sin password, solo structure]

**Completado esta sesión:**
- [tarea 1], [tarea 2]

> DETALLES (Capa 3 — cargar solo si OBS específica es relevante)

### OBS-001 — [Tipo]: [Título]
[Contenido completo: código, errores, razonamiento]
<!-- <private>datos sensibles aquí — nunca buscar ni indexar</private> -->

### OBS-002 — [Tipo]: [Título]
[Contenido completo]
```

### 3. Tipos de observación válidos

| Tipo | Qué incluye |
|------|-------------|
| `phase_done` | Fase completada, agente ejecutado, archivos generados |
| `bugfix` | Error + causa + solución (código) |
| `pattern` | Patrón descubierto + snippet de ejemplo |
| `decision` | Decisión de arquitectura + razón + trade-offs |
| `config` | Cambio de configuración (puertos, DB, env) |
| `feature` | Feature/módulo nuevo agregado al proyecto |
| `lesson` | Lección aprendida desde DebugAgent — se promoción a EvolutionAgent |

### 4. Actualizar CLAUDE-patterns.md (si hay patrones nuevos)

```
### PATTERN-NN — [Nombre descriptivo]
[OBS-referencia]: OBS-XXX
**Cuándo aplicar:** [Descripción del contexto de uso]
**Código:**
[snippet de código]
```

### 5. Actualizar CLAUDE-decisions.md (si hubo decisión de arquitectura)

```
### ADR-NNN — [Nombre]
[OBS-referencia]: OBS-XXX
**Fecha:** [YYYY-MM-DD]
**Estado:** Aprobado
**Contexto:** [Por qué se necesitó decidir]
**Decisión:** [Qué se decidió]
**Consecuencias:** [✅ beneficios / ❌ trade-offs]
```

### 6. Actualizar CLAUDE-troubleshooting.md (si se resolvió un bug)

```
### ERR-NNN — [Mensaje de error]
[OBS-referencia]: OBS-XXX
**Síntoma:** [Descripción]
**Causa:** [Por qué ocurre]
**Solución:**
[código o pasos]
```

---

## Convención `<private>`

Envolver cualquier dato sensible en tags `<private>`:
```markdown
<!-- <private>
  JWT_SECRET=abc123real...
  ConnectionString completo con password
</private> -->
```
El AI **nunca debe** leer, indexar ni incluir en resumenes el contenido dentro de `<private>`.

---

## Auto-compresión de contexto largo

Cuando la sesión acumula 3+ fases completadas en el mismo turno de conversación:
```
1. Guardar estado actual → CLAUDE-activeContext.md (índice + detalles)
2. Indicar al usuario: "Contexto comprimido y guardado. Continuando con [siguiente agente]..."
3. La próxima delegación a subagente recibe solo el índice (Capa 1) + payload mínimo
```
→ Evita saturar el contexto del subagente con historial de fases anteriores.

---

## Promoci\u00f3n de Lecciones \u2192 EvolutionAgent

> **Nuevo flujo:** Al recibir un OUTPUT de DebugAgent con campo `lesson`, MemorySyncAgent eval\u00faa si promover.

### Criterios de promoci\u00f3n autom\u00e1tica

```
Si lesson.scope == "global" o lesson.scope == "stack":
  1. Registrar como OBS-NNN tipo "lesson" en CLAUDE-activeContext.md (Capa 1)
  2. Guardar detalle completo en Capa 3 con el snippet de fix como referencia
  3. Indicar en el OUTPUT que esta lecci\u00f3n debe ser enviada a EvolutionAgent

Si lesson.scope == "project":
  1. Registrar solo en CLAUDE-troubleshooting.md como ERR-NNN
  2. No promover a EvolutionAgent (es espec\u00edfico de este proyecto)
```

### C\u00f3mo actualizar state.json

> **Responsabilidad:** MemorySyncAgent es el **único** que incrementa `evolution.lessons_pending`.  
> DebugAgent emite la lección pero deja `state_updates: {}` — el contador lo actualiza MemorySyncAgent.

**Secuencia completa DebugAgent → MemorySyncAgent → EvolutionAgent:**
1. DebugAgent resuelve el bug → emite `lesson` en su OUTPUT (su `state_updates` queda `{}`)
2. OrchestratorAgent recibe el OUTPUT → delega a MemorySyncAgent con la lección en el payload
3. MemorySyncAgent evalúa `lesson.scope` y actualiza state.json:

```json
{
  "evolution": {
    "lessons_pending": "incrementar en 1 SOLO si scope == 'global' o 'stack'",
    "total_lessons": "incrementar siempre"
  }
}
```

4. Si `evolution.lessons_pending >= 3` → indicar `next_suggested: "EvolutionAgent"` en el OUTPUT para que el OrchestratorAgent dispare EvolutionAgent automáticamente.

Cuando `evolution.lessons_pending >= 3`:  
→ Notificar al OrchestratorAgent para disparar EvolutionAgent (16) autom\u00e1ticamente.

---

## Compactación Estratégica — Cuándo Comprimir Contexto

> **Principio:** Comprimir en puntos lógicos naturales, nunca en medio de una implementación.

### Breakpoints ideales para compactar

| Momento | Por qué es buen momento | Acción |
|---|---|---|
| **Después de investigación/exploración** | Se leyeron muchos archivos; ya se tiene el plan | Compactar → mantener solo plan + decisiones |
| **Después de completar un milestone** | Fase hecha, archivos generados, código estable | Compactar → índice OBS + estado actualizado |
| **Después de debugging exitoso** | Stack traces y logs de diagnóstico ya no se necesitan | Compactar → retener solo la solución + lección |
| **3+ fases en la misma sesión** | Contexto acumulado excede lo útil para el siguiente agente | Auto-compactar (ya implementado en §Auto-compresión) |

### Cuándo NO compactar

| Momento | Por qué NO | Riesgo |
|---|---|---|
| **En medio de implementación** | Se pierde el estado de archivos parcialmente editados | Código incompleto, duplicados |
| **Mientras se diagnostica un bug** | Se pierde el stack trace y el árbol de hipótesis | Debug reinicia desde cero |
| **Con cambios no guardados** | Archivos modificados no persisten en el contexto | Pérdida de trabajo |
| **Durante review con MUST fixes** | Pierde la lista de issues a corregir | Issues quedan sin fix |

### Costo de tokens por capa (referencia para decisiones)

| Capa | Contenido | Tokens típicos | Cuándo cargar |
|---|---|---|---|
| Capa 1 — Índice OBS | Tabla de 1 línea por observación | ~50 tokens/entrada | **Siempre** |
| Capa 2 — Estado | Fase, agente, puertos, gates | ~300 tokens total | Al retomar sesión |
| Capa 3 — Detalle | Código, ADRs, stack traces | ~500-1000 tokens/entrada | Solo si OBS relevante |

**Workflow 3-Layer:** search index → filter relevant → fetch only needed details → **10x token savings**

---

## OUTPUT JSON (retornar al OrchestratorAgent)

```json
{
  "status": "completed",
  "agent": "MemorySyncAgent",
  "files_generated": ["CLAUDE-activeContext.md"],
  "obs_added": ["OBS-005", "OBS-006"],
  "patterns_added": 0,
  "adrs_added": 1,
  "bugs_documented": 0,
  "compression_applied": false,
  "errors": [],
  "next_suggested": null,
  "summary": "Memory Bank sincronizado. 2 observaciones nuevas. Índice actualizado."
}
```

> **Nota:** `next_suggested` se establece como `"EvolutionAgent"` cuando `evolution.lessons_pending >= 3` tras procesar una lección. En todos los demás casos es `null`.

---

## Alternativa Cloud: Zep Cloud (producción)

En proyectos productivos, los CLAUDE-*.md pueden ser reemplazados por **Zep Cloud** para memoria persistente entre sesiones sin archivos locales.

**Cuándo usar Zep en lugar de CLAUDE-*.md:**
- El proyecto ya está en producción y necesita memoria del asistente por usuario
- Se requiere memoria a largo plazo con expiración automática (TTL)
- Múltiples instancias del agente comparten el mismo contexto

**Setup rápido (.NET):**
```csharp
// En Program.cs / ServiceExtensions.cs
builder.Services.AddHttpClient("Zep", c => {
    c.BaseAddress = new Uri("https://api.getzep.com/api/v2/");
    c.DefaultRequestHeaders.Add("Authorization", $"Api-Key {config["Zep:ApiKey"]}");
});
```

**En el contexto local (dev):** Seguir usando CLAUDE-*.md — son suficientes y no requieren cuenta externa.

---

## Reglas

- NUNCA borrar entradas existentes del índice — solo AGREGAR nuevas OBS
- `CLAUDE-activeContext.md` Capa 2 (estado actual) se reescribe completa en cada sync
- Las Capas de detalle (Capa 3) solo reciben APPENDS (nunca borrar historial)
- Si no hay nada nuevo que documentar en un archivo, NO modificarlo
- Respetar siempre los tags `<private>` — nunca incluir su contenido en resúmenes
- Retornar OUTPUT JSON y DETENERSE




```csharp
// En Program.cs / ServiceExtensions.cs
builder.Services.AddHttpClient("Zep", c => {
    c.BaseAddress = new Uri("https://api.getzep.com/api/v2/");
    c.DefaultRequestHeaders.Add("Authorization", $"Api-Key {config["Zep:ApiKey"]}");
});
```


