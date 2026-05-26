# /speckit.clarify — Clarificar Antes del Plan

> **Inspirado en:** github/spec-kit `/speckit.clarify`  
> **Cuándo usar:** ANTES de ejecutar ArchitectAgent, cuando los requerimientos son ambiguos.  
> **No avanzar a la fase de plan hasta que todas las preguntas estén respondidas.**

---

## Propósito

Detectar y resolver ambigüedades en los requerimientos antes de que se conviertan en bugs caros.  
Un requerimiento no aclarado en fase 0 cuesta 10x más si se detecta en fase Backend y 100x más si llega a producción.

---

## Protocolo de ejecución

### Paso 1: Analizar PROJECT.md

Leer el PROJECT.md y detectar ambigüedades en 5 dimensiones:

```
1. ALCANCE: ¿Qué está dentro y qué está fuera de v1?
2. REGLAS DE NEGOCIO: ¿Hay casos edge no especificados?
3. ENTIDADES: ¿Relaciones ambiguas, cardinalidades no definidas?
4. AUTH: ¿Quién puede hacer qué? ¿Roles definidos completamente?
5. UI/UX: ¿Flujos de usuario no descritos?
```

### Paso 2: Generar preguntas de clarificación

Formato de cada pregunta:
```markdown
**[ALCANCE-1]** ¿El módulo de facturación incluye la generación del PDF o solo el registro en BD?
> Impacto si no se aclara: Se podría generar código incompleto o en exceso
> Opciones: (A) Solo registro en BD | (B) Registro + PDF | (C) Registro + PDF + envío por email
> Recomendación: Si es v1, sugiero (A) — PDF puede ser v2

**[AUTH-1]** ¿El rol "Usuario" puede ver las facturas de otros usuarios o solo las propias?
> Impacto: Define filtro en Repository y endpoint de API
> Defecto asumido si no se responde: Solo las propias (más restrictivo = más seguro)
```

### Paso 3: Esperar respuestas

Presentar TODAS las preguntas en un solo bloque para minimizar round-trips.  
El usuario puede responder letra (A/B/C) o frase libre.

### Paso 4: Actualizar PROJECT.md con las aclaraciones

```markdown
## 6. Aclaraciones de /speckit.clarify — {fecha}
- ALCANCE-1: (A) Solo registro en BD. PDF queda para v2.
- AUTH-1: Solo las propias facturas. Aplicar filtro WHERE UserId = @CurrentUserId.
```

### Paso 5: Reportar listo para planificar

```
✅ /speckit.clarify completado
📋 N preguntas respondidas
📝 PROJECT.md actualizado con las aclaraciones
➡️  Listo para ejecutar ArchitectAgent
```

---

## Integración en el pipeline

```
Usuario describe proyecto en PROJECT.md
        │
        ▼
/speckit.clarify      ← NUEVO (antes del ArchitectAgent)
        │
        ▼
[GATE: usuario responde preguntas]
        │
        ▼
ArchitectAgent → ARCHITECTURE.md, TASKS.md, ROUTES.md
```

---

## Activación

- Automática: cuando `PROJECT.md` existe + `docs/ARCHITECTURE.md` NO existe + existen ambigüedades
- Manual: `"/speckit.clarify"` o `"clarifica los requerimientos"` o `"tengo dudas del scope"`

---

## OUTPUT JSON (retornar al OrchestratorAgent)

```json
{
  "command": "/speckit.clarify",
  "agent": "/speckit.clarify",
  "status": "awaiting_answers | completed",
  "questions_count": 3,
  "questions_answered": 3,
  "project_md_updated": true,
  "ready_for_architect": true,
  "files_generated": [],
  "errors": [],
  "next_suggested": "ArchitectAgent",
  "state_updates": {}
}
```

> `status: "awaiting_answers"` cuando hay preguntas pendientes — el pipeline se detiene hasta que el usuario responda.  
> `status: "completed"` cuando todas las preguntas tienen respuesta y PROJECT.md fue actualizado.
