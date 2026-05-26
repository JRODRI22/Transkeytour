# Skills Registry — Agent Teams Lite
> Cada subagente consulta esta tabla al inicio para saber qué skills cargar.
> Cargar skills = leer el archivo SKILL.md y aplicar sus instrucciones durante la tarea.

---

## Tabla de skills por agente

| Agente | Skills a cargar (leer SKILL.md antes de trabajar) |
|--------|---------------------------------------------------|
| **ArchitectAgent** (01) | `brainstorming`, `writing-plans`, `spec-driven-implementation`, `write-product-spec`, `write-tech-spec` |
| **DatabaseAgent** (02) | `sql-server-best-practices`, `systematic-debugging` |
| **BackendAgent** (03) | `systematic-debugging`, `sql-server-best-practices`, `test-driven-development` |
| **FrontendAgent** (04) | `frontend-pro`, `react-ui-guidelines` |
| **IntegrationAgent** (05) | `systematic-debugging`, `frontend-pro` |
| **ReviewAgent** (06) | `requesting-code-review`, `receiving-code-review` |
| **DevOpsAgent** (07) | `verification-before-completion` |
| **SecurityAgent** (08) | *(usa checklist OWASP interno del archivo 08_security.instructions.md)* |
| **QAAgent** (09) | `test-driven-development` |
| **DebugAgent** (10) | `systematic-debugging`, `diagnose-ci-failures` |
| **DocsAgent** (11) | `doc-coauthoring` |
| **MemorySyncAgent** (12) | *(ninguna — opera sobre archivos CLAUDE-*.md directamente)* |
| **CodeSearcherAgent** (13) | *(ninguna — usa Chain of Draft mode internamente)* |
| **APIDiscoveryAgent** (14) | `api-discovery`, `free-llm-apis` *(leer `.claude/api-registry.md` antes de trabajar)* |
| **SentinelAgent** (15) | *(ninguna — verificación interna de artefactos; usa blast-radius propio)* |
| **EvolutionAgent** (16) | *(ninguna — genera sus propias skills en `.claude/skills/evolved/`)* |
| **ComponentLibraryAgent** (17) | *(ninguna — opera via `npx claude-code-templates@latest`; prerequisito: Node.js >= 18)* |
| **FeatureDevAgent** (18) | `brainstorming`, `systematic-debugging`, `test-driven-development`, `free-llm-apis`, `spec-driven-implementation` |
| **TestMasterAgent** (19) | `test-driven-development`, `systematic-debugging` |
| **DesignStudioAgent** (20) | `frontend-pro`, `3d-animation-design`, `ui-ux-pro-max` |
| **CIPipelineAgent** (21) | `verification-before-completion`, `diagnose-ci-failures` |
| **VisualDashboardAgent** (22) | *(ninguna — copia template `visualizer/` y ajusta puertos; prerequisito: Node.js >= 18)* |

---

## Preamble que cada subagente ejecuta al arrancar

Al inicio de cada tarea, el subagente debe:

```
0. Si el INPUT contiene "evolved_skills": leer CADA archivo .md listado ANTES de cualquier
   otra acción. Estas son lecciones aprendidas de errores pasados — ignorarlas significa
   repetir los mismos errores. Aplicar sus instrucciones durante toda la ejecución.
1. Si el INPUT contiene "skills_to_load": esas son tus skills pre-filtradas por el Orchestrator.
   Leer el archivo SKILL.md de cada una (sin necesidad de buscar en la tabla).
   Si el INPUT NO incluye "skills_to_load": leer la tabla y localizar las skills de tu agente.
2. Leer el archivo SKILL.md de cada skill listada (si está disponible)
3. Aplicar las directrices de la skill durante toda la ejecución de su tarea
4. Al finalizar: retornar OUTPUT JSON al OrchestratorAgent y DETENERSE
```

---

## Notas de uso

- Las skills son **opt-in por agente** — cada agente solo carga las suyas
- No cargar skills de otros agentes (reduce tokens innecesarios)
- Si una skill no está disponible, continuar sin ella (no bloquear la tarea)
- Las skills de React Bits son opcionales dentro de FrontendAgent (ver `04_frontend.instructions.md`)

---

## Skills consolidadas (supersets)

| Skill | Reemplaza a |
|-------|-------------|
| `frontend-pro` | `frontend-design` + `frontend-patterns` + `vercel-react-best-practices` + `ui-ux-pro-max` (reglas clave) |
| `sql-server-best-practices` | `supabase-postgres-best-practices` (stack real es SQL Server) |

> **Nota:** Las skills originales siguen disponibles para uso on-demand cuando se necesita
> profundidad adicional en un tema específico (ej: `ui-ux-pro-max` para diseño avanzado).

## Preamble universal — `systematic-debugging`

La skill `systematic-debugging` está asignada explícitamente a los agentes que más la usan.
Si un agente no la tiene en su tabla pero encuentra un bug, puede cargarla bajo demanda
sin necesidad de pedirle al OrchestratorAgent que la inyecte.
