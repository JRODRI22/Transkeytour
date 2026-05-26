# /council — Multi-Perspectiva de Agentes

## Propósito
Convoca perspectivas simultáneas de múltiples agentes especializados para evaluar una decisión de diseño, arquitectura, o implementación antes de ejecutarla.

Úsalo cuando no estés seguro si una decisión es la correcta, cuando quieras detectar puntos ciegos, o cuando una decisión afecta múltiples capas del sistema.

## Cuándo invocar

```
/council <decisión o pregunta>
```

**Ejemplos:**
```
/council ¿Debería usar CQRS para el módulo de reportes?
/council Evalúa esta estrategia de migración de SQL Server a PostgreSQL
/council ¿Tiene sentido usar Redis como cache para las facturas?
/council Revisa este diseño de API antes de implementarlo
```

## Flujo de ejecución

Al recibir `/council <pregunta>`, el agente activado debe:

### Paso 1 — Activar 4 perspectivas

Evalúa la pregunta desde estos 4 ángulos simultáneamente:

#### 🏗️ Perspectiva: Arquitecto (ArchitectAgent)
- ¿Cómo encaja en la arquitectura actual (Clean Architecture + .NET + React)?
- ¿Genera deuda técnica? ¿Qué compromisos implica?
- ¿Es coherente con las decisiones registradas en JarvisDB?

#### 🗄️ Perspectiva: Base de Datos (DatabaseAgent)
- ¿Impacto en el schema actual? ¿Requiere migration?
- ¿Performance implications? ¿Índices necesarios?
- ¿Soft delete, UNIQUEIDENTIFIER, timestamps respetados?

#### 🔒 Perspectiva: Seguridad (SecurityAgent)
- ¿Introduce alguna vulnerabilidad OWASP Top 10?
- ¿Expone datos sensibles? ¿JWT/auth correcto?
- ¿CORS, inputs validados, SQL injection possible?

#### ⚙️ Perspectiva: Implementación (BackendAgent/FrontendAgent)
- ¿Qué tan complejo es implementar esto? ¿Estimación?
- ¿Hay alternativas más simples que logran lo mismo?
- ¿Rompe algo existente? ¿Blast radius?

### Paso 2 — Síntesis y veredicto

Después de las 4 perspectivas, emitir:

```
## Veredicto del Consejo

**Recomendación:** [PROCEDER / PROCEDER CON CUIDADO / REPLANTEAR]

**Consenso:** [Resumen de los puntos en que todas las perspectivas coinciden]

**Riesgos identificados:**
- [Risk 1] — Perspectiva: [quién lo identificó] — Severidad: Alta/Media/Baja
- [Risk 2] ...

**Condiciones para proceder:** [Si PROCEDER CON CUIDADO]
1. [Condición 1]
2. [Condición 2]

**Alternativa recomendada:** [Si REPLANTEAR]
```

### Paso 3 — Registrar en JarvisDB

Si el usuario decide proceder, registrar la decisión:
```
mcp_jarvisdb_save_decision(
  title = "Council: <pregunta resumida>",
  decision = "<veredicto>",
  rationale = "<síntesis de perspectivas>",
  alternatives_considered = "<alternativas discutidas>"
)
```

## Ejemplo de output

```
/council ¿Debería usar SignalR para notificaciones en tiempo real?

🏗️ ARQUITECTO: SignalR encaja bien en .NET 8. Requiere agregar hub + service. Clean Architecture: hub en Controllers, INotificationService en Services. Costo: ~2-3 horas frontend + 1-2 horas backend. 

🗄️ BASE DE DATOS: No requiere cambios de schema inmediatos. Para persistir notificaciones → tabla Notificaciones (Id, UserId, Mensaje, IsRead, CreatedAt). Con soft delete opcional.

🔒 SEGURIDAD: Verificar que el Hub tenga [Authorize]. Los grupos de SignalR deben basarse en UserId del JWT, no en parámetros de query string. CSRF no aplica a WebSockets.

⚙️ IMPLEMENTACIÓN: Viabilidad alta. Frontend: signalr npm package + hook useNotifications. Alternativa más simple: polling cada 30s (menos infra, suficiente para <100 usuarios concurrentes).

## Veredicto del Consejo

**Recomendación:** PROCEDER CON CUIDADO

**Consenso:** Técnicamente sólido. Bien soportado en el stack actual.

**Riesgos:**
- Complejidad de infraestructura si <50 usuarios → polling podría ser suficiente (Baja)
- Hub sin [Authorize] = canal de eventos expuesto (Alta — fácil de prevenir)

**Condiciones para proceder:**
1. Agregar [Authorize] en el Hub
2. Usar UserId del JWT para grupos, no query params
3. Evaluar si el volumen de usuarios justifica WebSockets vs polling
```
