# /speckit.analyze — Análisis de Consistencia Cross-Artefacto

> **Inspirado en:** github/spec-kit `/speckit.analyze` + SentinelAgent (15)  
> **Cuándo usar:** Después de completar cualquier fase, ANTES de avanzar a la siguiente.  
> Complementa al ReviewAgent (código) analizando la coherencia entre TODOS los artefactos.

---

## Propósito

El ReviewAgent revisa el código. El `/speckit.analyze` revisa que los documentos, el código, el schema y los routes sean COHERENTES entre sí.  
Una incongruencia entre ROUTES.md y los Controllers equivale a un contrato roto que los tests no detectarán hasta runtime.

---

## Protocolo de ejecución

### Paso 1: Inventario de artefactos

```
Artefactos a analizar según fase:

Post-ArchitectAgent:
  ├─ PROJECT.md
  ├─ docs/ARCHITECTURE.md
  ├─ docs/TASKS.md
  └─ docs/ROUTES.md

Post-DatabaseAgent (+anterior):
  └─ database/schema.sql
  └─ database/seed.sql

Post-BackendAgent (+anterior):
  └─ backend/{Project}.API/ (todos los archivos)

Post-FrontendAgent (+anterior):
  └─ frontend/src/ (todos los archivos)
```

### Paso 2: Ejecutar verificaciones

Para cada par de artefactos relacionados:

```
ROUTES.md ↔ Controllers:
  → Verificar que cada endpoint documentado tiene implementación
  → Verificar que cada Controller tiene su ruta documentada
  → Diferencia entre ambos = "orphan endpoints" (crítico)

schema.sql ↔ Models/*.cs ↔ AppDbContext:
  → Cada tabla tiene entidad C# con mismos campos y tipos
  → Cada entidad está en DbSet<T>
  → Índices críticos definidos en ambos lados

TASKS.md ↔ archivos generados:
  → Tareas Done tienen archivos correspondientes
  → Archivos existentes tienen tareas correspondientes
  → No hay tareas Pending ignoradas sin justificación

PROJECT.md §Reglas ↔ código:
  → Reglas de negocio implementadas (verificable por búsqueda de texto)
  → Roles de auth aplicados según §Auth de PROJECT.md
```

### Paso 3: Calcular Consistency Score

```javascript
consistency_score = (
  matches_found / total_expected_matches
) * 100

// Zonas:
// 95-100: 🟢 Excelente — continuar
// 80-94:  🟡 Bueno — warnings pero no bloquea
// 60-79:  🟠 Regular — revisar antes de continuar
// < 60:   🔴 Crítico — STOP, corregir antes de avanzar
```

### Paso 4: Generar reporte

```markdown
## /speckit.analyze — {proyecto} — {fase} — {timestamp}

### Consistency Score: {N}/100 {emoji}

### ✅ Verificaciones correctas ({N})
- ROUTES.md ↔ ClienteController: 8/8 endpoints coinciden
- schema.sql ↔ Cliente.cs: todos los campos mapeados

### ⚠️ Warnings ({N})
- TASKS.md: T05 marcado como Done pero frontend/pages/DashboardPage.jsx no existe
  Fix sugerido: Crear DashboardPage.jsx o actualizar estado a Pending

### 🚫 Issues Críticos ({N})
- ROUTES.md define GET /api/facturas/{id} pero FacturaController no tiene GetById()
  Fix sugerido: Implementar GetById en FacturaController

### Blast-Radius de cambios pendientes
Los siguientes archivos se verán afectados si se aplican los fixes:
  → backend/Controllers/FacturaController.cs (agregar método)
  → backend/Services/IFacturaService.cs (agregar interfaz)
  → database/schema.sql (si aplica)

### Veredicto
[✅ Continuar | ⚠️ Continuar con precaución | 🚫 DETENER]
```

---

## Activación

- Manual: `"/speckit.analyze"` o `"analiza la consistencia"` o `"verifica los artefactos"`
- Automática: Este comando **invoca a SentinelAgent (15)** para ejecutar la verificación transversal
- Keywords: `"hay inconsistencias"`, `"revisa todo"`, `"cross-check"`

> **Nota:** `/speckit.analyze` es el **comando manual**. SentinelAgent (15) es el **agente ejecutor** que corre la lógica de verificación. El comando invoca al agente — no son lo mismo ni se disparan mutuamente.

---

## OUTPUT JSON (retornar al OrchestratorAgent)

```json
{
  "command": "/speckit.analyze",
  "agent": "/speckit.analyze",
  "status": "ok | warnings | critical",
  "consistency_score": 94,
  "issues_critical": 0,
  "issues_warnings": 2,
  "verdict": "continuar | continuar_con_precaucion | detener",
  "report_generated": "docs/SPECKIT_ANALYSIS.md",
  "files_generated": ["docs/SPECKIT_ANALYSIS.md"],
  "errors": [],
  "next_suggested": null,
  "state_updates": {
    "sentinel.last_score": 94,
    "sentinel.last_run": "2026-03-17T10:00:00Z",
    "sentinel.issues_pending": 2
  }
}
```

> Si `verdict == "detener"` → el Orchestrator aplica GATE y espera resolución.  
> Si `verdict == "continuar"` o `"continuar_con_precaucion"` → el pipeline avanza.
