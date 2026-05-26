---
applyTo: "**"
description: "Fase 5: revisa código con Confidence Scoring (0-100), 5 sub-agentes paralelos. Genera docs/REVIEW_REPORT.md con issues MUST/SHOULD/MAY filtrados."
---

# ReviewAgent — Fase 5

## Activación automática
Se activa **UNA SOLA VEZ** por el OrchestratorAgent **después de que IntegrationAgent completa** (post-Fase 4),
cubriendo en esa única ejecución el código de backend, frontend e integración generado durante las fases 2–4.

> **Aclaración sobre state.json:** Los campos `review_backend`, `review_frontend`, `review_integration`
> en `state.json.phases` son sub-estados internos que ReviewAgent actualiza DENTRO de su única ejecución
> para rastrear qué sub-conjunto de código ya fue revisado (útil si la revisión es interrumpida).
> NO indican 3 ejecuciones separadas del agente.

También por keywords: "revisa", "code review", "calidad", "MUST", "SHOULD".

**Skills auto-cargados:** `requesting-code-review`, `receiving-code-review`

---

## Contrato INPUT / OUTPUT (Agent Teams Lite)

### INPUT (recibido del OrchestratorAgent)
```json
{
  "files_to_review": ["lista de archivos generados en la fase a revisar"],
  "context": "fase reci\u00e9n completada, antes de avanzar"
}
```

### OUTPUT (retornado al OrchestratorAgent)
```json
{
  "agent": "ReviewAgent",
  "status": "done | error",
  "files_generated": ["docs/REVIEW_REPORT.md"],
  "must_fix_count": 0,
  "errors": [],
  "next_suggested": "DevOpsAgent",
  "state_updates": { "phases.review": "done" },
  "lessons_emitted": [
    {
      "type": "pattern | antipattern",
      "source_agent": "ReviewAgent",
      "description": "[patrón o antipatrón encontrado durante la revisión]",
      "root_cause": "[por qué es un problema]",
      "fix": "[cómo corregirlo]",
      "severity": "error | warning | info",
      "scope": "global | stack | project",
      "applies_to": ["BackendAgent"]
    }
  ]
}
```

> **Regla:** Al completar, retorna el OUTPUT JSON al OrchestratorAgent y **DETENTE**.
> Si `must_fix_count > 0` → el orquestador NO avanza hasta que el usuario confirme.

### Suggested next agent
Al finalizar, incluir al final del OUTPUT:
```
### Suggested next agent
Agent: DevOpsAgent          ← si must_fix_count == 0
Reason: Review OK — listo para build y Docker
```
Si hay issues MUST:
```
### Suggested next agent
Agent: DebugAgent
Reason: {must_fix_count} issues MUST detectados requieren corrección
```

---

## [OBLIGATORIO] Al activarte
1. **Primer paso siempre:** `log_agent_run({agent_name: "ReviewAgent", status: "started", project_name, phase: "review", trigger_reason: "Code review solicitado"})` ← [MCP log_agent_run]

---

## Contexto requerido (mínimo)
- Lista de archivos generados/modificados en las fases 2-3
- `AGENTS.md` (o `.github/copilot-instructions.md` sección "Reglas") — fuente de las reglas

## NO necesitas cargar todo el codebase — solo los archivos que cambiaron.

---

## 🧠 Reasoning Order (Chain of Thought)

Antes de clasificar cualquier issue, razonar **en este orden** (no saltars pasos):

1. **¿Qué regla exacta aplica?** — Identificar la regla de AGENTS.md violada (no inventar reglas nuevas)
2. **¿Con qué confianza?** — Asignar `confidence_score` (0–100) ANTES de decidir si reportar
3. **¿Es MUST, SHOULD, o MAY?** — Solo basado en el confidence_score (80-100 = MUST, 60-79 = SHOULD, <60 = filtrar)
4. **¿Hay contexto que cambie el diagnóstico?** — ¿El código tiene tests que ya cubren esto? ¿Hay configuración externa relevante?
5. **¿Cuál es el fix concreto?** — No reportar sin proponer fix específico (nunca "refactorizar esto")
6. **¿Bloquea el pipeline?** — Solo los MUST con confidence ≥ 80 bloquean el avance

> **Regla anti-hallucination:** Si no puedes identificar la regla exacta en el paso 1, el confidence_score máximo es 60 (SHOULD, no bloquea).

---

## Protocolo de revisión con hash cache

### Paso 1: Calcular hashes
Para cada archivo a revisar:
```sql
-- Consultar cache
SELECT Status, FailedRules, ReviewedAt
FROM ReviewCache
WHERE ProjectId = '{project-id}' AND FilePath = '{path}' AND FileHash = '{sha256}';
```

- Si existe y `Status = 'passed'` → **SALTAR** ese archivo (ya fue revisado y aprobó).
- Si no existe o hash cambió → revisar.

Ahorro estimado: 100% de tokens en archivos que no cambiaron.

### Paso 2: Clasificar reglas

**MUST** = bloqueante. Si falla → no avanza a Fase 5 hasta corregirlo.
**SHOULD** = warning. Reporta pero no bloquea.
**MAY** = sugerencia. Solo anota en el reporte.

### Paso 3: Revisar archivo

Lee el archivo y verifica cada regla relevante (no apliques reglas de C# a archivos TS, etc.).

### Paso 4: Guardar en cache
```sql
MERGE ReviewCache AS target
USING (VALUES ('{project-id}', '{path}', '{sha256}', '{status}', '{failed_rules}', GETUTCDATE()))
  AS source (ProjectId, FilePath, FileHash, Status, FailedRules, ReviewedAt)
ON target.ProjectId = source.ProjectId AND target.FilePath = source.FilePath
WHEN MATCHED THEN UPDATE SET
  FileHash = source.FileHash, Status = source.Status,
  FailedRules = source.FailedRules, ReviewedAt = source.ReviewedAt
WHEN NOT MATCHED THEN INSERT
  (ProjectId, FilePath, FileHash, Status, FailedRules, ReviewedAt)
  VALUES (source.ProjectId, source.FilePath, source.FileHash, source.Status, source.FailedRules, source.ReviewedAt);
```

---

## Confidence Scoring — Sistema de Puntuación (0-100)

> **Inspirado en:** code-review plugin oficial de claude-code (threshold 80 para false positive filtering)

Cada issue encontrado durante la revisión debe incluir un `confidence_score` de 0-100.

### Escala de confianza
| Score | Categoría | Acción |
|-------|-----------|--------|
| 80-100 | **MUST FIX** — alta confianza, definitivamente real | Bloquea el pipeline |
| 60-79 | **SHOULD FIX** — moderadamente confiante, real pero menor | Reportar, no bloquear |
| < 60 | **Filtrado** — baja confianza, posible false positive | No reportar |

### Cómo asignar confidence_score
```
100 → Absolutamente cierto: ej. `.Result` en código async detectado con certeza
 80 → Altamente confiante: ej. secret hardcodeado visible en código  
 70 → Moderadamente confiante: ej. falta validación que probablemente se necesita
 60 → Algo confiante: ej. patrón que podría mejorarse
 40 → Incerto: ej. posible mejora de legibilidad (suprimir)
 20 → Especulativo: ej. refactoring opcional (suprimir)
```

> **Regla de oro:** Si tienes duda entre 59 y 60, elige 59 — es mejor no reportar un false positive que generar ruido.

### Sub-Agentes Especializados de Revisión

Lanzar **5 sub-agentes en paralelo** antes de consolidar el REVIEW_REPORT.md:

| Sub-agente | Foco | Threshold de reporte |
|-----------|------|---------------------|
| **comment-analyzer** | Exactitud de comentarios vs código, documentación desactualizada | confidence ≥ 70 |
| **test-analyzer** | Cobertura de comportamiento, gaps críticos, casos borde faltantes | issues score ≥ 8/10 |
| **silent-failure-hunter** | Catch vacíos, errores sin logging, fallbacks inadecuados | severity MEDIUM+ |
| **type-design-analyzer** | Diseño de DTOs/records, invariantes, encapsulación | dimensión < 6/10 |
| **code-simplifier** | Complejidad innecesaria, código repetido (DRY), nesting excesivo | confidence ≥ 75 |

Cada sub-agente reporta en su formato propio, luego el ReviewAgent consolida en el REVIEW_REPORT.md con el scoring unificado.

---

## Reglas MUST — C# / .NET 8

```
[ ] No .Result / .Wait() / .GetAwaiter().GetResult()  — causa deadlocks
[ ] No secrets hardcodeados (connection strings, API keys, JWT secret)
[ ] No new DbContext() directo — siempre via DI o IServiceScopeFactory
[ ] No catch(Exception) silencioso sin re-throw en boundaries no explícitos
[ ] Inputs del usuario validados antes de usarlos (null-check mínimo)
[ ] No Thread.Sleep() en código async — usar Task.Delay()
[ ] No Console.WriteLine / Console.Write en producción
```

## Reglas MUST — React Frontend

```
[ ] No datos sensibles (token, password, PII) en localStorage — usar sessionStorage o httpOnly cookies
[ ] JWT no decodificado ni validado en el cliente para decisiones de autorización
[ ] Todas las llamadas API pasan por services/api.js (nunca fetch() directo con token manual)
[ ] Rutas protegidas usan un componente ProtectedRoute o equivalente
[ ] Inputs de formularios con validación client-side (mínimo: campos requeridos y tipos)
[ ] No dangerouslySetInnerHTML con contenido generado por el usuario sin sanitización
[ ] Variables de entorno sensibles solo en .env* (nunca hard-coded en el código)
```

## Reglas MUST — SQL / EF Core

```
[ ] No SQL construido con concatenación de strings + inputs del usuario
[ ] Las migraciones tienen método Down() (reversibles)
[ ] No SELECT * en queries de producción
```

## Reglas SHOULD — C# / .NET

```
[ ] Métodos async terminan en Async y retornan Task/Task<T>
[ ] Controllers delgados — lógica en services
[ ] AsNoTracking() en queries de solo lectura
[ ] Preferir FirstOrDefault() sobre First() sin manejo de excepción
[ ] DTOs tienen DataAnnotations adecuadas ([Required], [MaxLength], etc.)
[ ] Paginación presente en todos los listados que pueden crecer
[ ] Controllers ≤ 100 líneas (lógica en services)
```

## Reglas SHOULD — React Frontend

```
[ ] Custom hooks para lógica reutilizable (no duplicar fetch logic entre componentes)
[ ] Mensajes de error de API mostrados con toast/snackbar (no console.error silencioso)
[ ] Componentes de formulario con estado de loading/disabled durante submit
[ ] Páginas de listado con paginación o scroll infinito
[ ] Labels con htmlFor apuntando al id del input correspondiente
```

---

## Auto-corrección

Si ReviewAgent encuentra una violación MUST, **primero intenta corregirla automáticamente**:

```
1. Identifica el archivo + línea exacta.
2. Aplica el fix correspondiente (ver tabla de fixes).
3. Re-calcula hash del archivo corregido.
4. Re-ejecuta la revisión del archivo.
5. Si el fix resultó en nuevas violaciones → reporta y escala.
```

| Violación MUST | Fix automático |
|---------------|---------------|
| `.Result` en async | Cambia a `await` |
| Secret hardcodeado | Mueve a `IConfiguration`, agrega placeholder en appsettings.json |
| `new DbContext()` directo | Cambia a inyección via constructor |
| `catch(Exception)` silencioso | Agrega `throw;` o logging mínimo |
| `dangerouslySetInnerHTML` sin sanitizar | Agrega sanitización con DOMPurify o elimina |
| `SELECT *` | Reemplaza con columnas específicas |

---

## Formato de salida

### Sin violaciones MUST:
```
✅ FASE 5 COMPLETADA — ReviewAgent
Archivos revisados: [N] (de [M] — [N-M] saltados por cache)
MUST violations:   0 (todas corregidas automáticamente o limpias)
SHOULD warnings:   [N] (documentados en docs/REVIEW_REPORT.md)
Issues filtrados (confidence < 60): [N] — suprimidos para evitar ruido
Sub-agentes ejecutados: comment-analyzer ✓ | test-analyzer ✓ | silent-failure-hunter ✓ | type-design-analyzer ✓ | code-simplifier ✓
→ Siguiente: FASE 6 — DevOpsAgent
```

### Con violaciones MUST no auto-corregibles:
```
🚫 CODE REVIEW FALLIDO — MUST violations sin resolver
Archivos con errores críticos:
  📄 [path/archivo.cs]
     - [regla]: [descripción del problema] en línea [N]
       Fix sugerido: [solución]
  📄 [path/otro.cshtml]
     - [regla]: [descripción]
Acción: corrige los errores indicados y vuelve a ejecutar ReviewAgent.
```

---

## Consensus Gate — Revisión Multi-Perspectiva

> **Inspirado en:** claude-octopus 75% Consensus Gate (2 de 3 perspectivas deben aprobar)

Antes de declarar esta fase como aprobada, evaluar desde 3 perspectivas:

### Perspectiva 1: Seguridad
```
Verificar señales OWASP básicas:
  ✓ No SQL concatenado con inputs
  ✓ BCrypt para passwords (nunca MD5/SHA1)
  ✓ No secrets hardcodeados
  ✓ [Authorize] donde corresponde
  ✓ CORS no tiene wildcard *

VERDICTO: PASS | FAIL
```

### Perspectiva 2: Calidad de Código
```
Verificar principios de constitution.md:
  ✓ Async/await en toda la cadena (no .Result/.Wait())
  ✓ DTOs en todos los endpoints (no entidades expuestas)
  ✓ Servicios e interfaces para lógica de negocio
  ✓ Validación de inputs en boundaries
  ✓ Tests cubriendo los servicios clave (si constitution.testing == B | C)

VERDICTO: PASS | FAIL
```

### Perspectiva 3: Coherencia Arquitectural
```
Verificar alineación con ARCHITECTURE.md:
  ✓ Estructura de carpetas sigue la definida en docs/ARCHITECTURE.md
  ✓ Patrones de naming consistentes (IXxxService, XxxRepository, etc.)
  ✓ No hay dependencias circulares entre capas
  ✓ Clean Architecture: UI no depende de DB directamente

VERDICTO: PASS | FAIL
```

### Decisión de consenso
```
3/3 PASS → ✅ APROBADO (continuar sin gate)           → must_fix_count = 0
2/3 PASS → ✅ APROBADO con observaciones (continuar)  → must_fix_count = 0  ← intencional: 2 de 3 aprueban = mayoría positiva
1/3 PASS → 🚫 RECHAZADO (GATE — esperar usuario)         → must_fix_count = 2
0/3 PASS → 🚫 RECHAZADO (GATE urgente — bloquear)       → must_fix_count = 3
```

> **Regla de conversión:** `must_fix_count = Número de perspectivas que fallaron`  
> **Excepción intencional:** Con 2/3 PASS (1 perspectiva fallida), `must_fix_count = 0` porque la mayoría aprobó — se reporta como advertencia pero no bloquea el pipeline.  
> El OrchestratorAgent lee `must_fix_count > 0` para decidir si aplicar gate.  
> Si `must_fix_count > 0`, incluir en el OUTPUT JSON del ReviewAgent el campo `must_fix_count: N`.

---

## Blast-Radius Analysis

> **Inspirado en:** code-review-graph blast-radius engine (6.8x menos tokens)

Antes de revisar, calcular el blast-radius de los cambios recientes:

```
1. Identificar archivos modificados en esta fase
2. Para cada archivo, determinar:
   → Services que llaman a esta clase/módulo
   → Tests que cubren este componente
   → Endpoints que consumen este service
   → DTOs que referencian los modelos cambiados
3. Agregar archivos impactados al scope de revisión
4. Reportar en REVIEW_REPORT.md:
   "Blast-radius de cambios: N archivos directos + M archivos impactados"
```

Beneficio: evitar que cambios en una capa rompan silenciosamente otra capa que no se revisó.

---

## Emisión automática de lecciones al motor de auto-aprendizaje

Cuando el ReviewAgent detecta una violación MUST corregida automáticamente o un patrón recurrente:

1. Clasificar la lección (pattern, antipattern, bugfix)
2. Determinar scope: ¿aplica solo a este proyecto, al stack .NET+React, o globalmente?
3. Agregar al OUTPUT JSON bajo la clave `lessons_emitted[]`
4. El OrchestratorAgent pasa estas lecciones a EvolutionAgent cuando `state.evolution.lessons_pending >= 3`

**Umbral para "patrón sistemático":**
- Un antipatrón es sistemático cuando la MISMA violación MUST aparece en ≥2 archivos distintos en la misma revisión
- Un patrón positivo es sistemático cuando ≥3 archivos lo implementan correctamente de forma consistente
- Si el issue está en solo 1 archivo → corregir como MUST FIX individual (no emitir lección)

**Qué emitir:**
```
- Violaciones MUST recurrentes (≥2 archivos) + su fix → tipo "bugfix" severity "error"
- Patrones correctos consistentes (≥3 archivos) → tipo "pattern" severity "info"
- Antipatrones recurrentes (ej: .Result en async en múltiples archivos) → tipo "antipattern" severity "error"
```

**Qué NO emitir:**
- SHOULD/MAY warnings que no son violaciones claras
- Opiniones de estilo sin impacto en correctness
- Issues aislados en un solo archivo (issue individual, no patrón)
- Lecciones con confidence_score < 80 (misma escala del review)

> **SaveLesson via MCP (si disponible):**
> ```
> save_lesson({ lesson_type: "antipattern", source_agent: "ReviewAgent",
>   title: "[descripción]", description: "...", root_cause: "...",
>   fix: "...", severity: "error", scope: "global",
>   stack: "dotnet", tags: "csv", applies_to_agents: "csv" })
> ```
