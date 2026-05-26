# hookify.suggest-compact

## Trigger
- Después de 5+ archivos editados en una sesión (EditFile / WriteFile tools)
- O cuando `CLAUDE-activeContext.md` registra 3+ fases completadas en la sesión

## Condición
Si el contexto es largo y el agente está a punto de iniciar una nueva fase grande, sugerir compactar antes de continuar.

## Acción sugerida
```
/compact
```
Luego cargar solo `.claude/state.json` + `CLAUDE-activeContext.md` Capa 1+2 para reancar con contexto fresco.

## Por qué
- Previene degradación de calidad en sesiones largas
- Reduce tokens consumidos en las siguientes herramientas
- Permite al EvolutionAgent procesar lecciones con contexto limpio

## Señales de activación
- Mensaje del agente contiene "voy a crear X archivos más..."
- Transcript supera las 100 herramientas usadas
- Se está iniciando Fase Backend, Frontend, o Integración (las más costosas en tokens)

## Protocolo para el OrchestratorAgent
```
⚠️ Compactación sugerida:
  - Fases completadas en esta sesión: [N]
  - Archivos editados: [N]
  - Siguiente fase: [NombreFase] (alta carga de tokens)

Opciones:
  A) /compact → continuar desde nueva sesión compacta
  B) Continuar sin compactar (riesgo de degradación)

Recomendación: opción A si sessions >= 2 horas
```
