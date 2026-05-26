# Hooks de Automatización — Índice

Este directorio contiene los hooks del sistema de automatización (formato Hookify).  
Los hooks responden automáticamente a eventos sin intervención del usuario.

---

## Matriz de hooks activos

| Hook | Archivo | Evento | Estado | Acción | Configurado en |
|------|---------|--------|--------|--------|----------------|
| **build-failure-escalation** | `hookify.build-failure.md` | `bash` — comando de build/test | ✅ Activo | Avisa que DebugAgent intervendrá automáticamente (intentos 1-2); escala al usuario en intento 3 | `reactions.conf` + este hook |
| **phase-complete-sync** | `hookify.phase-complete.md` | `stop` — pipeline detecta fase `done` | ✅ Activo | Recuerda ejecutar `/update-memory-bank` y SentinelAgent tras cada fase completada | `reactions.conf` + este hook |
| **security-guard** | `hookify.security-guard.md` | `file` — escritura de archivo | ✅ Activo | Detecta patrones peligrosos en tiempo real: `eval()`, `innerHTML =`, SQL concatenado, pickle, subprocess | `reactions.conf` + este hook |
| **post-deploy-notification** | `hookify.post-deploy.md` | `bash` — comando de despliegue | ✅ Activo | Recuerda verificar salud del app, actualizar TASKS.md y disparar SecurityAgent post-deploy | `reactions.conf` + este hook |

---

## Cómo funciona cada hook

### `hookify.build-failure.md` — Escalación de fallos de build
**Disparador:** Cuando se ejecuta `dotnet build`, `dotnet run`, `npm run build`, `npm test`, o `dotnet test`  
**Qué hace:** Muestra un aviso de que el sistema atrapará el fallo automáticamente. Si `reactions.conf` tiene `build_failure` configurado, DebugAgent se lanza sin intervención manual.  
**No hace:** No bloquea el comando. Solo informa.

### `hookify.phase-complete.md` — Sincronización post-fase
**Disparador:** Cuando el transcript contiene `phases.{fase} = "done"` (cualquier fase del pipeline)  
**Qué hace:** Recuerda sincronizar el Memory Bank. Según `reactions.conf`, puede disparar automáticamente `MemorySyncAgent` y `SentinelAgent` en paralelo.  
**No hace:** No modifica archivos por sí solo.

### `hookify.security-guard.md` — Guardia de seguridad en tiempo real
**Disparador:** Cuando cualquier archivo es escrito/modificado  
**Qué hace:** Escanea el nuevo contenido contra patrones OWASP peligrosos (inyección, XSS, deserialización insegura). Si detecta algo, muestra advertencia antes de continuar.  
**Patrones cubiertos:** `eval()`, `exec()`, `os.system()`, `subprocess.call()`, `pickle.loads()`, `innerHTML =`, `dangerouslySetInnerHTML`, SQL concatenado con variables de usuario  
**No hace:** No bloquea la escritura. Solo advierte — la decisión final es del desarrollador.

---

## Cómo activar / desactivar un hook

Editar el YAML frontmatter del archivo del hook:

```yaml
# Para desactivar:
enabled: false

# Para activar:
enabled: true
```

---

## Relación con `reactions.conf`

Los hooks actúan como **detectores** y los eventos en `reactions.conf` actúan como **respuestas**.  
El flujo completo es:

```
Evento en el editor/terminal
        │
        ▼
Hook (hookify.*.md) detecta el patrón
        │
        ▼
Muestra advertencia / dispara señal
        │
        ▼
reactions.conf define QUÉ agente lanzar (si aplica)
```

---

## Agregar un nuevo hook

1. Crear `hookify.{nombre}.md` en este directorio
2. Agregar YAML frontmatter con `name`, `enabled`, `event`, `action`, `conditions`
3. Agregar documentación Markdown debajo del frontmatter
4. Registrar en este README (tabla de arriba)
5. Si requiere respuesta de agente, agregar entrada en `.claude/reactions.conf`

**Eventos disponibles:** `bash` | `file` | `stop` | `start`  
**Acciones disponibles:** `warn` | `block` | `transform`
