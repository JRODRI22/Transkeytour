> **Nota sobre rutas:** Este archivo de comando vive en `.claude/commands/speckit/constitution.md`.  
> El archivo que **genera** vive en `.claude/constitution.md` (raíz de `.claude/`).  
> Son dos archivos distintos: este es el comando, el otro es el output.

---

# /speckit.constitution — Principios Rectores del Proyecto

> **Inspirado en:** github/spec-kit `/speckit.constitution`  
> **Cuándo usar:** Al inicio de CUALQUIER proyecto nuevo, ANTES de correr ArchitectAgent.  
> **Por qué:** Define las reglas que todos los agentes deben respetar automáticamente.

---

## Propósito

La constitution es el contrato de calidad del proyecto. Sin ella, cada agente toma decisiones por su cuenta.  
Con ella, todos los agentes trabajajan con el mismo conjunto de principios — sin que el usuario tenga que repetirlos en cada sesión.

---

## Protocolo de ejecución

### Paso 1: Generar preguntas de principios

El sistema pregunta al usuario sobre 6 dimensiones de principios:

```markdown
**CALIDAD DE CÓDIGO:**
¿Qué estándar de calidad aplica? Opciones:
(A) Básico — funciona en producción, no más
(B) Estándar — SOLID, clean code, tests unitarios en servicios clave
(C) Alto — cobertura >80%, full DI, arquitectura limpia, performance observada

**SEGURIDAD:**
¿Nivel de seguridad requerido?
(A) Básico — JWT auth, BCrypt passwords
(B) Estándar — básico + CORS restrictivo + logging de auth events
(C) Paranoid — estándar + rate limiting + audit trail completo + OWASP Top 10 completo

**TESTING:**
¿Estrategia de tests?
(A) Manual — el usuario prueba a mano
(B) Unitarios — tests de servicios con xUnit + Moq
(C) Integración — unitarios + tests de endpoints con WebApplicationFactory

**DOCUMENTACIÓN:**
¿Nivel de documentación?
(A) Mínima — solo README básico
(B) Estándar — README + comentarios en métodos complejos
(C) Completa — README + API docs + guía de deployment + comentarios XML en todas las APIs

**PERFORMANCE:**
¿Hay requisitos de performance?
(A) No aplica — uso interno, < 10 usuarios concurrentes
(B) Moderado — paginación obligatoria, índices en claves foráneas
(C) Alto — caching con Redis, consultas EF optimizadas, load testing requerido

**COMPATIBILIDAD WINDOWS:**
¿El equipo trabaja en Windows?
(Sí/No) — Afecta scripts de build, rutas, line endings
```

### Paso 2: Generar `.claude/constitution.md`

```markdown
# Constitution — {PROJECT_NAME}
> Generado por /speckit.constitution — {fecha}
> Estos principios aplican AUTOMÁTICAMENTE a todos los agentes del pipeline.

## Principios de Calidad
- Nivel seleccionado: {A/B/C}
- Implicaciones: {lista de reglas concretas}

## Principios de Seguridad
- Nivel seleccionado: {A/B/C}
- Checklist obligatorio: {según nivel}

## Estrategia de Tests
- Nivel seleccionado: {A/B/C}
- Agentes afectados: QAAgent, ReviewAgent, BackendAgent

## Documentación
- Nivel seleccionado: {A/B/C}
- Agentes afectados: DocsAgent

## Performance
- Nivel seleccionado: {A/B/C}
- Patrones obligatorios: paginación en GET listas, índices en FKs, etc.

## Entorno
- OS del equipo: Windows / macOS / Linux
- Scripts: PowerShell (.ps1) / Bash (.sh)
- Line endings: CRLF / LF

## Reglas NO negociables
Estas reglas NUNCA se pueden violar sin aprobación explícita del usuario:
1. BCrypt para passwords — nunca MD5/SHA1/SHA256 plano
2. EF Core siempre — nunca SQL con concatenación de input
3. [Authorize] por defecto — [AllowAnonymous] requiere justificación explícita
4. Async/await en toda la cadena — nunca .Result ni .Wait()
5. DTOs en todos los endpoints — nunca exponer entidades directamente
```

### Paso 3: Configurar los agentes para leer la constitution

Cada agente en su payload recibirá:
```json
{
  "constitution": ".claude/constitution.md",
  "instruction": "Lee constitution.md ANTES de generar cualquier código. Aplica todos sus principios."
}
```

---

## Activación

- Manual: `"/speckit.constitution"` o `"define los principios del proyecto"` o `"establece las reglas"`
- Automática: Si `.claude/constitution.md` no existe cuando se inicia ArchitectAgent
- Keywords: `"principios"`, `"reglas del proyecto"`, `"constitution"`, `"estándares"`

---

## OUTPUT JSON (retornar al OrchestratorAgent)

```json
{
  "command": "/speckit.constitution",
  "agent": "/speckit.constitution",
  "status": "completed",
  "constitution_path": ".claude/constitution.md",
  "principles_defined": ["calidad", "seguridad", "testing", "docs", "performance", "entorno"],
  "files_generated": [".claude/constitution.md"],
  "errors": [],
  "next_suggested": "ArchitectAgent",
  "state_updates": {
    "constitution.exists": true,
    "constitution.path": ".claude/constitution.md"
  }
}
```

> Tras recibir este OUTPUT, el Orchestrator actualiza `state.json["constitution"]["exists"] = true`  
> y puede proceder a lanzar ArchitectAgent con `constitution.md` incluido en el payload.

---

## Nota para el OrchestratorAgent

Antes de lanzar ArchitectAgent, verificar:
```
¿Existe .claude/constitution.md?
  NO → ejecutar /speckit.constitution primero (sin preguntar)
  SÍ → pasar su contenido al payload de ArchitectAgent
```
