# /introspect — Auto-Análisis de Sesión

## Propósito
Analiza la sesión actual (o el trabajo reciente) para detectar antipatrones, puntos ciegos, y oportunidades de mejora en cómo el sistema está operando. Genera un reporte honesto con recomendaciones concretas.

Úsalo cuando sientas que algo no está funcionando bien, cuando quieras auditar la calidad de las respuestas, o al final de una sesión larga.

## Cuándo invocar

```
/introspect
/introspect <área específica>
```

**Ejemplos:**
```
/introspect
/introspect ¿estamos siguiendo el protocolo de agentes?
/introspect calidad del código generado en esta sesión
/introspect ¿hay decisiones que no registramos en JarvisDB?
```

## Flujo de ejecución

### Paso 1 — Recolectar datos

Consultar fuentes disponibles:
```
mcp_jarvisdb_get_recent_logs(limit=20)        → últimas acciones del sistema
mcp_jarvisdb_get_context()                    → estado del proyecto
```

Adicionalmente, revisar mentalmente la sesión:
- ¿Cuántas iteraciones de debug hubo?
- ¿Se respetaron los approval gates?
- ¿Se registraron decisiones/lecciones en JarvisDB?
- ¿Se generó código sin plan previo?
- ¿Se saltó algún agente del pipeline?

### Paso 2 — Análisis en 6 dimensiones

#### 1. Protocolo de Agentes
- ¿Se activaron los agentes correctos?
- ¿El OrchestratorAgent generó código directamente (violación)?
- ¿Se respetaron los approval gates?
- ¿Se ejecutó ReviewAgent/SentinelAgent entre fases?

#### 2. Calidad del Código
- ¿Se generó código sin tests?
- ¿Hay `console.log` o credenciales hardcodeadas detectadas por quality-guard?
- ¿Se respetaron las convenciones de C#/React/SQL?
- ¿Hay TODOs sin resolver en código generado?

#### 3. Memoria y Aprendizaje
- ¿Se registraron bugs resueltos en JarvisDB?
- ¿Se guardaron decisiones de arquitectura?
- ¿Se actualizó CLAUDE-activeContext.md?
- ¿Lecciones pendientes en `evolution.lessons_pending`?

#### 4. Seguridad
- ¿Se auditó el código con SecurityAgent cuando correspondía?
- ¿Se detectaron patrones OWASP durante la sesión?
- ¿JWT, BCrypt, validaciones en DTOs OK?

#### 5. Eficiencia de Tokens
- ¿Se usó `rtk` en comandos shell?
- ¿Se cargó el codebase completo innecesariamente?
- ¿Se leyeron archivos de agente/skill innecesarios?

#### 6. Puntos Ciegos
- ¿Hay algo que asumí sin verificar en JarvisDB?
- ¿Hay dependencias entre módulos que no consideré?
- ¿El scope creció sin registrar el cambio?

### Paso 3 — Reporte de Introspección

```
## /introspect — Reporte de Sesión [fecha]

### Score General: [0-100] [🔴 < 60 | 🟡 60-79 | 🟢 80+]

### Hallazgos por Dimensión:

| Dimensión | Score | Estado |
|-----------|-------|--------|
| Protocolo de Agentes | /20 | ✅/⚠️/❌ |
| Calidad de Código | /20 | ✅/⚠️/❌ |
| Memoria y Aprendizaje | /20 | ✅/⚠️/❌ |
| Seguridad | /15 | ✅/⚠️/❌ |
| Eficiencia de Tokens | /15 | ✅/⚠️/❌ |
| Puntos Ciegos | /10 | ✅/⚠️/❌ |

### Issues Detectados:

**[SHOULD FIX — sesión actual]**
- [ ] [Issue 1] — Cómo corregir: [acción concreta]
- [ ] [Issue 2] ...

**[REGISTRAR EN JARVISDB]**
- [ ] Decisión: [qué decisión se tomó pero no se registró]
- [ ] Lección: [qué bug/problema se resolvió sin documentar]

**[PARA PRÓXIMA SESIÓN]**
- [ ] [Mejora 1]
- [ ] [Mejora 2]

### Acciones Inmediatas Recomendadas:
1. [Acción más prioritaria]
2. [Segunda acción]
3. [Tercera acción]
```

### Paso 4 — Registrar resultado

Si el score es < 70 o hay issues Should Fix, registrar en JarvisDB:
```
mcp_jarvisdb_save_lesson(
  lesson_type = "pattern",
  title = "Introspect: [issue principal detectado]",
  content = "Qué: ... Por qué: ... Acción: ..."
)
```

## Ejemplo de output rápido

```
/introspect

## /introspect — Reporte de Sesión — 07/04/2026

### Score General: 74/100 🟡

| Dimensión | Score | Estado |
|-----------|-------|--------|
| Protocolo de Agentes | 18/20 | ✅ |
| Calidad de Código | 15/20 | ⚠️ |
| Memoria y Aprendizaje | 12/20 | ⚠️ |
| Seguridad | 14/15 | ✅ |
| Eficiencia de Tokens | 10/15 | ⚠️ |
| Puntos Ciegos | 5/10 | ⚠️ |

### Issues Detectados:

**SHOULD FIX — sesión actual:**
- [ ] Calidad: save_knowledge.js regenerado sin agregar test de smoke automático
- [ ] Tokens: 3 comandos git sin prefijo rtk

**REGISTRAR EN JARVISDB:**
- [ ] Decisión: "Migrar mcp.json a JARVISDB_* vars" — no guardada aún
- [ ] Lección: "MCP tools devuelven formato incorrecto si no usan content wrapper"

**PARA PRÓXIMA SESIÓN:**
- [ ] Agregar test de integration para todas las tools MCP
- [ ] Revisar si fix-existing-projects.ps1 necesita test de idempotencia
```
