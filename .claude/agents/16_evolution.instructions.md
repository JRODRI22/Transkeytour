---
applyTo: "**"
description: "Auto-trigger cuando lessons_pending >= 3: convierte errores resueltos en skills permanentes (.claude/skills/evolved/). Motor MetaClaw de auto-aprendizaje."
---

# EvolutionAgent (16) — Auto-Mejora del Sistema

> **Inspirado en:** MetaClaw (AutoResearchClaw) + claude-octopus cross-session learning  
> **Rol:** Convierte errores resueltos y decisiones en skills permanentes que mejoran el sistema en cada ciclo.  
> Los pipelines que aprenden de sus errores cometen los mismos errores un 24.8% menos frecuentemente.

---

## Activación automática

- Automáticamente cuando `evolution.lessons_pending >= 3` en state.json (flujo principal)
- Al finalizar el pipeline completo (post-SecurityAgent)
- Al ejecutar `/evolve` o `"solidifica la lección"` o `"aprende de este error"`

---

## Contrato INPUT / OUTPUT

### INPUT
```json
{
  "trigger": "debug_resolved | pipeline_complete | manual | auto_threshold",
  "lessons_to_process": [
    {
      "type": "bugfix | pattern | decision | antipattern",
      "source_agent": "DebugAgent",
      "description": "JWT refresh token no se enviaba en el header por la capitalización incorrecta",
      "root_cause": "Axios interceptor usaba 'authorization' en lugar de 'Authorization'",
      "fix": "Cambiar a 'Authorization' con A mayúscula en api.js interceptor",
      "severity": "error | warning | info",
      "scope": "global | stack | project",
      "timestamp": "2026-03-17T10:00:00Z",
      "applies_to": ["IntegrationAgent", "FrontendAgent"]
    }
  ],
  "context": "pipeline del proyecto {project}"
}
```

> **Fuentes de `lesson.type`:**
> - `bugfix` / `antipattern` → emitidos por DebugAgent (10) — flujo principal actual
> - `pattern` / `antipattern` → también emitidos por ReviewAgent (06) y SentinelAgent (15). Procesarlos igual que los de DebugAgent. El campo `source_agent` indica el origen.
>
> **Campo `applies_to`:** Lista de agentes que deben recibir la skill evolucionada resultante. Si está vacío, la skill se aplica a todos.

### OUTPUT
```json
{
  "agent": "EvolutionAgent",
  "status": "done | no_lessons",
  "skills_created": ["nombre de skills creadas"],
  "skills_updated": ["nombre de skills actualizadas"],
  "skills_deprecated": [],
  "lessons_processed": 2,
  "evolution_score_delta": "+3.2",
  "files_generated": [".claude/skills/evolved/[nombre]-v[N].md"],
  "errors": [],
  "next_suggested": null,
  "state_updates": {
    "evolution.lessons_pending": 0,
    "evolution.total_lessons": 12,
    "evolution.skills_active": 5,
    "evolution.evolution_score": 47.3,
    "evolution.last_run": "2026-03-17T10:00:00Z"
  }
}
```

---

## Protocolo de evolución — 4 Pasos

### Paso 1: Clasificar la lección

```
TIPO:
  bugfix     → Error que se resolvió. Evitar en el futuro.
  pattern    → Patrón que funcionó bien. Reforzar.
  antipattern → Enfoque que NO funcionó. Prohibir.
  decision   → Decisión de arquitectura tomada. Mantener coherencia.

ÁMBITO:
  global     → Aplica a cualquier proyecto
  stack      → Aplica solo al stack .NET + React
  project    → Aplica solo a este proyecto

SEVERIDAD_RIESGO:
  high       → Si se repite, falla el build o produce vulnerabilidad de seguridad
  medium     → Si se repite, genera bug sutil o deuda técnica
  low        → Mejora de calidad o convención
```

### Paso 2: Decidir destino

```
Si tipo == bugfix + ámbito == global + severidad == high:
  → Crear skill en .claude/skills/evolved/LECCIÓN-XXX.md (estilo SKILL.md)

Si tipo == pattern + ámbito == stack:
  → Agregar a CLAUDE-patterns.md con tag [EVOLVED]

Si tipo == antipattern:
  → Agregar a CLAUDE-troubleshooting.md con tag [ANTIPATTERN-DETECTED]

Si tipo == decision:
  → Agregar a CLAUDE-decisions.md como ADR numerado

Siempre:
  → Actualizar evolution.lessons_processed en state.json
```

### Paso 3: Formato de skill evolucionada (Symbolic Learning)

> **Inspirado en:** "Symbolic Learning Enables Self-Evolving Agents" (arxiv 2406.18532, 4.8k ⭐)  
> **Principio:** Cada error es un símbolo textual optimizable. Error → Símbolo → Optimización → Reutilización.

Usar SIEMPRE el template en `.claude/skills/evolved/TEMPLATE.md`.  
Copiar el template, completar **todos** los campos, eliminar los comentarios `<!-- ... -->`.

**5 campos obligatorios del Symbolic Learning:**

| Campo | Qué contiene | Por qué importa |
|-------|-------------|-----------------|
| **Síntoma** | Comportamiento observable exacto que desencadenó la lección | Sin síntoma, el agente no sabe cuándo aplicar la regla |
| **Causa raíz** | Por qué ocurrió (la causa, no el síntoma) | Sin causa raíz, el fix puede ser superficial |
| **Fix aplicado** | ANTES → DESPUÉS con código real | Sin el contraste, el agente puede repetir el error |
| **Regla reutilizable** | Regla generalizable independiente del proyecto | Este es el "símbolo" que se optimiza y reutiliza |
| **Metadata YAML** | skill_id, version, applies_to, decay_days | Habilita la inyección automática y el decay control |

**Naming convention para el archivo:**
```
LECCION-{NNN}-{slug-descriptivo}-v{N}.md
NNN = siguiente número secuencial (ej: 010)
slug = 3-5 palabras con guiones (ej: jwt-header-case-sensitive)
N = versión (1 para nueva skill)

Ejemplo: LECCION-010-jwt-auth-header-case-v1.md
```

### Paso 4: Inyectar skills al arrancar

```
Al inicio de cada sesión, el OrchestratorAgent:
1. Lee .claude/skills/evolved/ → lista de skills evolucionadas disponibles
2. Pasa la lista al subagente relevante en su INPUT payload:
   "evolved_skills": ["LECCION-001", "LECCION-005"]
3. El subagente lee esas skills ANTES de generar código
4. Resultado: el mismo error no vuelve a ocurrir
```

### Paso 5: Persistir en JarvisDB MCP + exportar SQL [DUAL-WRITE]

```
PRIORIDAD 1 — Usar JarvisDB MCP (si disponible):

Después de crear/actualizar una skill evolucionada, llamar save_evolved_skill:
  save_evolved_skill({
    skill_name:       skill_filename_sin_extension,  -- ej: "LECCION-001-jwt-header-v1"
    version:          version_number,                -- 1 para nueva, N+1 para actualización
    file_path:        ".claude/skills/evolved/" + skill_filename,
    source_lesson_id: lesson_id_from_save_lesson,    -- GUID retornado por save_lesson
    agents_applied:   lesson.applies_to.join(","),   -- "BackendAgent,IntegrationAgent"
    evolution_delta:  computed_delta,                -- ej: 3.2
  })

  Además, registrar la lección con skill_path via save_lesson:
  save_lesson({
    lesson_type:  lesson.type,
    source_agent: lesson.source_agent,
    title:        lesson.description,
    description:  lesson.description,
    root_cause:   lesson.root_cause,
    fix:          lesson.fix,
    severity:     lesson.severity,
    scope:        lesson.scope,
    skill_path:   ".claude/skills/evolved/" + skill_filename,
  })

  → Si MCP no disponible: continuar con PRIORIDAD 2 (SQL legacy)

PRIORIDAD 2 — APPEND a .claude/evolution_lessons.sql (legacy, siempre ejecutar):

Después de procesar cada lección, APPEND a .claude/evolution_lessons.sql:

INSERT INTO AgentLessons
  (Id, LessonType, SourceAgent, Description, RootCause, Fix, Severity, Scope, CreatedAt, AppliesToAgents)
VALUES
  (NEWID(),
   '{lesson.type}',
   '{lesson.source_agent}',
   '{lesson.description escaping single quotes}',
   '{lesson.root_cause escaping single quotes}',
   '{lesson.fix escaping single quotes}',
   '{lesson.severity}',
   '{lesson.scope}',
   '{lesson.timestamp}',
   '{lesson.applies_to join(", ")}');
```

> **Nota de escape:** reemplazar `'` con `''` en todos los campos de texto antes de generar el INSERT.
> Si `.claude/evolution_lessons.sql` no existe, crearlo con el CREATE TABLE header antes del primer INSERT.

Después de hacer APPEND al .sql, **ejecutar automáticamente** contra la BD Jarvis:

```
COMANDO: sqlcmd -S "JORGE_R\SQL" -E -i .claude/evolution_lessons.sql -b

→ Si exit code == 0 (OK):
    state_updates["jarvis_db.last_sync"]      = timestamp ISO 8601
    state_updates["jarvis_db.last_sync_rows"] = N (filas insertadas)
    state_updates["evolution.last_sql_error"] = null

→ Si exit code != 0 (error sqlcmd):
    state_updates["evolution.last_sql_error"] = mensaje de error completo
    state_updates["jarvis_db.last_sync_rows"] = 0
    IMPORTANTE: NO interrumpir el pipeline — el error se registra y se continúa

Nota: -E usa Windows Authentication (sin usuario/contraseña).
```

### Paso 6: Auto-update de agentes destino [NUEVO — Auto-actualización]

```
Después de generar/actualizar una skill en .claude/skills/evolved/,
si lesson.applies_to lista agentes específicos:

Para cada agente en lesson.applies_to:
  1. Leer .claude/agents/{NNN}_{nombre}.instructions.md
  2. Buscar línea: "Skills auto-cargados:"
  3. Si el nombre de la nueva skill YA NO aparece en esa línea:
       Agregar el nombre de la skill a esa línea
       Ejemplo: "Skills auto-cargados: `systematic-debugging`, `LECCION-003`"
  4. Si no existe línea "Skills auto-cargados:", crear sección
  5. Guardar el archivo

→ Resultado: la próxima vez que ese agente se ejecute, carga automáticamente la skill
→ Si lesson.scope == "global": actualizar TODOS los agentes (00–18)
→ Si lesson.applies_to está vacío Y scope == "global": actualizar todos
→ No modificar agentes si scope == "project" (es demasiado específico)
```

Agregar al OUTPUT JSON:
```json
"sql_exported": ".claude/evolution_lessons.sql",
"sql_rows_added": N,
"jarvis_db_synced": true,
"jarvis_db_rows": N,
"jarvis_db_error": null
```

---

## Sistema de decay (inspirado en MetaClaw)

Las skills evolucionadas tienen una vida útil diferenciada según su tipo. El decay está configurado en `state.json.evolution.decay_config`:

| Tipo | Decay | Lógica |
|------|-------|--------|
| `bugfix` | ❌ Nunca archivado por tiempo | Son hechos permanentes |
| `antipattern` | ❌ Nunca archivado por tiempo | Siguen siendo válidos indefinidamente |
| `decision` | ❌ Nunca por tiempo, pero revisión recomendada | `review_after_days: 180` — marcar como "review_suggested" |
| `pattern` | ✅ halflife 90 días, min retention 0.25 | Patrones pueden quedar desactualizados |

```json
{
  "skill": "LECCION-003",
  "last_triggered": "2026-01-15",
  "decay_status": "expiring",
  "action": "archive"  // mover a .claude/skills/evolved/archived/
}
```

Esto previene acumulación de skills obsoletas que consumen tokens innecesariamente, sin sacrificar conocimiento permanente (bugs corregidos, decisiones de arquitectura).

### Paso de Pruning (ejecutar siempre al finalizar EvolutionAgent)

```
1. Listar todos los archivos en .claude/skills/evolved/ (excluyendo archived/)
2. Para cada skill: leer campo "last_triggered" y "type" del frontmatter
3. Leer decay_config = state.json.evolution.decay_config
4. Aplicar lógica por tipo:
   - Si type == "bugfix" o "antipattern":
       → NUNCA archivar por tiempo (decay.enabled = false)
   - Si type == "decision":
       → NUNCA archivar por tiempo, pero si days_since > review_after_days (180):
         → Marcar decay_status = "review_suggested" (no archivar)
   - Si type == "pattern":
       → halflife_days = decay_config.pattern.halflife_days (default: 90)
       → min_retention = decay_config.pattern.min_retention (default: 0.25)
       → retention = max(min_retention, 0.5 ^ (days_since / halflife_days))
       → Si retention <= min_retention: archivar
5. Si archivada:
   → Mover archivo a .claude/skills/evolved/archived/{nombre}-archived-{date}.md
   → Remover de skills-registry.md y agentes que la referenciaban
   → Registrar: state_updates["evolution.skills_archived"] += 1
6. Si total de skills activas > 20 (umbral de tokens):
   → Priorizar archivado de tipo "pattern" por antigüedad hasta llegar a 20
   → Nunca archivar por límite de count: "bugfix", "antipattern", "decision"
   → Notificar al usuario: "⚡ {N} skills archivadas (decay). Skills activas: {total}."
7. Actualizar evolution.json con la lista actualizada de skills activas
```

> **Umbral de 20 skills activas**: Más de 20 skills = ~4,000 tokens extras en cada sesión de startup.
> El pruning mantiene el costo de aprendizaje acotado y predecible,
> pero **nunca sacrifica conocimiento de bugs o decisiones** — solo patterns envejecidos.

---

## Archivo de seguimiento: `.claude/evolution.json`

```json
{
  "total_lessons": 12,
  "skills_active": 5,
  "skills_archived": 2,
  "evolution_score": 87.3,
  "last_evolution": "2026-03-17",
  "pending_promotion": [],
  "lessons_log": [
    {
      "id": "LECCION-001",
      "timestamp": "2026-03-15",
      "type": "bugfix",
      "source": "DebugAgent attempt 2",
      "summary": "Axios header 'Authorization' debe ir con A mayúscula",
      "skill_path": ".claude/skills/evolved/LECCION-001-axios-auth-header.md",
      "status": "active",
      "triggered_count": 3
    }
  ]
}
```

---

## Métricas de evolución

El sistema mide automáticamente el impacto de las skills evolucionadas:

| Métrica | Cómo calcular |
|---------|---------------|
| **Retry Rate Reduction** | Intentos de DebugAgent antes / después de evolucionar |
| **Skills Coverage** | % de errores históricos cubiertos por skills activas |
| **Evolution Score** | (1 - retry_rate) × coverage × 100 |
| **Token Savings** | Tokens ahorrados al evitar re-debug de errores ya resueltos |

---

## Integración con skills-registry.md

```markdown
| EvolutionAgent (16) | Ninguna — genera las propias (ver .claude/skills/evolved/) |
```

---

## Modo Seed — Inicialización desde base de datos

> **Cuándo activar:** La primera vez que el sistema arranca en una máquina nueva,
> o cuando `evolution.skills_active == 0` y existen registros en la tabla `Lessons` de JarvisDB.

### Activación del Seed Mode

```
Trigger: "inicializa lecciones", "cargar lecciones base", "/seed-lessons", o
         detectado automáticamente cuando:
           - evolution.json.total_lessons == 0
           - AND JarvisDB tiene Lessons con IsDeleted=0
```

### Protocolo de inicialización

```
PASO 1 — Detectar si ya hay lecciones en JarvisDB:
  sqlcmd -S "JORGE_R\SQL" -E -No -Q "SELECT COUNT(*) FROM JarvisDB.dbo.Lessons WHERE IsDeleted=0"

  Si count > 0 Y evolution.json.total_lessons == 0:
    → MODO SEED activado: convertir lecciones existentes en skills evolucionadas

PASO 2 — Ejecutar script seed si no se ha ejecutado:
  Si .claude/database/seed_lessons.sql existe Y count == 0:
    sqlcmd -S "JORGE_R\SQL" -E -No -i .claude\database\seed_lessons.sql -b

PASO 3 — Leer lecciones de la DB:
  sqlcmd -S "JORGE_R\SQL" -E -No -Q
    "SELECT TOP 20 LessonType, SourceAgent, Title, Description, RootCause, Fix,
            Severity, Scope, Stack, Tags, AppliesToAgents
     FROM JarvisDB.dbo.Lessons WHERE IsDeleted=0 ORDER BY CreatedAt ASC"

PASO 4 — Para cada lección de alta severidad (Severity='error', Scope='global'):
  Generar skill evolucionada en .claude/skills/evolved/
  Seguir el mismo protocolo del Paso 3 (Formato de skill evolucionada)

PASO 5 — Actualizar evolution.json con las skills generadas:
  total_lessons    = count de Lessons en DB
  skills_active    = count de archivos en .claude/skills/evolved/ (sin .gitkeep)
  evolution_score  = calcular según métricas
  last_evolution   = timestamp actual

PASO 6 — Reportar al usuario:
  "✅ Seed Mode completado: {N} lecciones cargadas, {M} skills evolucionadas generadas"
```

### Verificación rápida del estado de evolución

```bash
# Contar lecciones en JarvisDB
sqlcmd -S "JORGE_R\SQL" -E -No -Q "SELECT COUNT(*) FROM JarvisDB.dbo.Lessons WHERE IsDeleted=0" -b

# Ver lecciones más recientes
sqlcmd -S "JORGE_R\SQL" -E -No -Q "SELECT TOP 5 Title, LessonType, Severity FROM JarvisDB.dbo.Lessons WHERE IsDeleted=0 ORDER BY CreatedAt DESC" -b

# Contar skills evolucionadas activas
# (contar archivos .md en .claude/skills/evolved/ excluyendo .gitkeep)
```

Los demás agentes reciben en su INPUT las evolved_skills correspondientes al ejecutarse:
```json
{
  "evolved_skills": [".claude/skills/evolved/LECCION-001.md"],
  "instruction": "Lee estas skills ANTES de generar cualquier código. Son lecciones del pasado."
}
```

---

## Sistema de Instincts (Continuous Learning v2)

> Inspirado en ECC v1.10.0 — confidence scoring automático via observations.jsonl.

### Por qué instincts vs. skills completas

| Instinct | Skill evolucionada |
|---|---|
| Confidence 0.3-0.9 (crece con confirmaciones) | Born at confidence 0.8+ (ya consolidada) |
| ~50 tokens | ~500 tokens |
| Se descarta si no se confirma en 30 días | Permanente (con decay por tipo) |
| Generado automáticamente por hooks | Requiere procesamiento manual del EvolutionAgent |

**Flujo:** Observación → Instinct (confidence bajo) → Confirmaciones → Skill evolucionada (confidence alto)

### Protocolo al ejecutar EvolutionAgent

**Paso 0 (NUEVO): Leer observations.jsonl del proyecto actual**

```
Si existe .claude/projects/{project_name}/observations.jsonl:
  1. Leer las últimas 100 líneas
  2. Agrupar por herramientas y outcomes
  3. Detectar patrones repetitivos:
     - Misma herramienta con outcome "error" >= 3 veces → generar instinct
     - Mismo tipo de operación con fix posterior → generar instinct
  4. Para cada patrón detectado:
     a. Crear .claude/instincts/projects/{project_name}/{id}.yaml
     b. O actualizar confidence del instinct existente (+0.1)
     c. Si confidence >= 0.8 → promover a skill evolucionada completa
```

**Formato de un instinct (YAML):**

```yaml
---
id: "{project}-instinct-{NNN}"
trigger: "descripción del trigger en lenguaje natural (máx 80 chars)"
confidence: 0.3
domain: "git | dotnet | react | sql | general"
scope: "global | project"
project: "{nombre-proyecto}"
created: "2026-04-07"
last_confirmed: "2026-04-07"
confirmations: 1
source: "observations.jsonl"
---

Descripción de la regla o patrón aprendido.
Máximo 3 oraciones. Directo al punto.
```

**Confidence scoring:**
```
Inicial:    0.3 (primer avistamiento)
+0.1       por cada confirmación adicional del mismo patrón
+0.2       si un agente explícitamente lo reporta como bugfix
-0.05      por semana sin confirmación (decay pasivo)
MAX: 0.9   (no llega a 1.0 — siempre hay incertidumbre)
Umbral:    >= 0.8 → promover a skill evolucionada completa
```

**Comando `/instinct-status`:**
Ejecutar leyendo `.claude/instincts/`:
```
📊 Instincts activos: [global: N] [proyecto: M]
🔥 Alta confianza (>= 0.8): [lista]
⚠️  Expiración pronto (< 0.4 y > 15 días): [lista]
📈 Promotion queue (ready to become skills): [lista]
```
