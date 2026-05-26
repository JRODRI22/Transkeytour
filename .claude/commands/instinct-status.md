---
description: "Muestra el estado actual del sistema de instincts: confidence scores, instincts por proyecto, próximas promociones a skills y expiración inminente."
---

# /instinct-status

Muestra el estado del sistema de aprendizaje continuo (instincts + observations).

## Protocolo de ejecución

1. **Listar instincts globales:**
   - Leer `.claude/instincts/global/index.yaml`
   - Mostrar total, activos, alta confianza (>= 0.8)

2. **Listar instincts por proyecto:**
   - Para cada subdirectorio en `.claude/instincts/projects/`:
     - Contar archivos `.yaml`
     - Leer confidence de cada uno
     - Identificar los 3 con mayor confidence

3. **Estadísticas de observations.jsonl:**
   - Para el proyecto activo (leer `.claude/state.json → project`):
     - Si existe `.claude/projects/{project}/observations.jsonl`:
       - Contar líneas totales (= total observaciones)
       - Contar errores (outcome: "error")
       - Calcular ratio de éxito

4. **Promotion queue:**
   - Listar instincts con confidence >= 0.8 que aún no son skills
   - Sugerir: "Considera ejecutar EvolutionAgent para promoverlos"

5. **Expiración inminente:**
   - Instincts con confidence < 0.4 Y creados hace > 15 días
   - Sugerir eliminación o reconsideración

## Formato de salida

```
📊 INSTINCT STATUS — [fecha]

🌐 Instincts globales: [N] activos
  Alta confianza (>=0.8): [nombre: confidence, ...]
  En decaimiento (<0.4): [nombre: confidence días, ...]

📁 Proyecto activo: [{project_name}]
  Observaciones totales: [N]  |  Errores: [E]  |  Ratio éxito: [X%]
  Instincts del proyecto: [N]
    🔥 [id] (conf: 0.85) — "{trigger}"
    📈 [id] (conf: 0.62) — "{trigger}"
    ⚠️  [id] (conf: 0.31, 18 días) — "{trigger}" ← expiración

🚀 Promotion queue (listos para skill):
  - [id] conf=0.87 → sugerido: LECCION-{NNN}-{slug}-v1.md

💡 Para procesar: "ejecuta EvolutionAgent" o usa el botón en el Visualizer
```

## Si no hay datos aún

```
ℹ️  Sistema de instincts recién instalado.
  Las observaciones se acumulan automáticamente mientras trabajas.
  Después de 50+ operaciones en un proyecto, los primeros instincts aparecerán.
  
  Estado actual:
  - observations.jsonl: [no existe | N líneas]
  - Instincts globales: 0
  - Instincts del proyecto: 0
```
