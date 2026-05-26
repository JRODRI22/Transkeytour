# Agents Registry — Agent Teams Lite

> Archivo consultable por cualquier agente para saber qué otros agentes existen,
> sus triggers, capas que tocan y qué pueden recibir como señal de encadenamiento.
> **NO duplica CLAUDE.md** — es la vista compacta para uso interno de agentes.
> Actualizar cuando se agrega o modifica un agente.

---

## Tabla de agentes activos

| # | Agente | Archivo | Trigger principal | Capa(s) | Acepta señal de | Modelo |
|---|--------|---------|-------------------|---------|-----------------|--------|
| 00 | OrchestratorAgent | `00_orchestrator.instructions.md` | Siempre activo | Todas | Todos | Sonnet |
| 01 | ArchitectAgent | `01_architect.instructions.md` | `PROJECT.md` + sin `docs/ARCHITECTURE.md` | Docs | OrchestratorAgent | **Opus** |
| 02 | DatabaseAgent | `02_database.instructions.md` | `ARCHITECTURE.md` aprobado + sin `schema.sql` | BD | ArchitectAgent | Free |
| 03 | BackendAgent | `03_backend.instructions.md` | `schema.sql` + sin `backend/` | Backend | DatabaseAgent | **Sonnet** |
| 04 | FrontendAgent | `04_frontend.instructions.md` | `backend/` + sin `frontend/src/` | Frontend | BackendAgent | **Sonnet** |
| 05 | IntegrationAgent | `05_integration.instructions.md` | frontend+backend + sin `api.js` | Integración | FrontendAgent | **Sonnet** |
| 06 | ReviewAgent | `06_review.instructions.md` | Fase recién completada / "revisa" | Todas | IntegrationAgent, FeatureDevAgent | **Opus** |
| 07 | DevOpsAgent | `07_devops.instructions.md` | Código completo + sin build | DevOps | ReviewAgent | Free |
| 08 | SecurityAgent | `08_security.instructions.md` | DevOpsAgent completado | Seguridad | DevOpsAgent | **Opus** |
| 09 | QAAgent | `09_qa.instructions.md` | "tests", "pruebas", "xUnit" | Testing | ReviewAgent, DevOpsAgent | **Sonnet** |
| 10 | DebugAgent | `10_debug.instructions.md` | Error en build/run/test | Todas | BackendAgent, FrontendAgent, QAAgent | **Sonnet** (+Opus si attempt≥2) |
| 11 | DocsAgent | `11_docs.instructions.md` | "README", "documentación" | Docs | DevOpsAgent | Free |
| 12 | MemorySyncAgent | `12_memory_sync.instructions.md` | Fin de fase / `/update-memory-bank` | Memoria | Todos (post-fase) | Free |
| 13 | CodeSearcherAgent | `13_code_searcher.instructions.md` | "busca en el código", "dónde está" | Análisis | OrchestratorAgent | Free |
| 14 | APIDiscoveryAgent | `14_api_discovery.instructions.md` | "API externa", "integración third-party" | APIs | FeatureDevAgent | **Sonnet** |
| 15 | SentinelAgent | `15_sentinel.instructions.md` | Paralelo a ReviewAgent | Consistencia | BackendAgent, FrontendAgent, IntegrationAgent | **Opus** |
| 16 | EvolutionAgent | `16_evolution.instructions.md` | `lessons_pending >= 3` | Auto-mejora | MemorySyncAgent | **Opus** |
| 17 | ComponentLibraryAgent | `17_component_library.instructions.md` | "instala componente", "MCP de" | Marketplace | OrchestratorAgent | **Sonnet** |
| 18 | FeatureDevAgent | `18_feature_dev.instructions.md` | "agregar feature", "nuevo módulo" | Todas | OrchestratorAgent | **Sonnet** |
| 19 | TestMasterAgent | `19_test_master.instructions.md` | "tests completos", "E2E", "k6" | Testing | DevOpsAgent | **Sonnet** |
| 20 | DesignStudioAgent | `20_design_studio.instructions.md` | "3D", "animaciones", "Three.js" | UI | FrontendAgent | **Opus** |
| 21 | CIPipelineAgent | `21_ci_pipeline.instructions.md` | DevOpsAgent completado + sin CI | CI/CD | DevOpsAgent | **Sonnet** |
| 22 | VisualDashboardAgent | `22_visual_dashboard.instructions.md` | "visualizador", "monitor agentes" | Visualización | OrchestratorAgent | Sonnet |

---

## Mapa de encadenamiento (quién puede sugerir a quién)

```
BackendAgent     → ReviewAgent, SentinelAgent, DebugAgent
FrontendAgent    → IntegrationAgent, ReviewAgent, SentinelAgent, DebugAgent
ReviewAgent      → DebugAgent (si must_fix_count > 0), DevOpsAgent (si must_fix_count == 0)
DebugAgent       → SentinelAgent (post-fix), BackendAgent/FrontendAgent (si se requiere regenerar)
IntegrationAgent → ReviewAgent, SentinelAgent
FeatureDevAgent  → ReviewAgent, SentinelAgent, MemorySyncAgent
DatabaseAgent    → BackendAgent
SecurityAgent    → MemorySyncAgent, EvolutionAgent
DevOpsAgent      → SecurityAgent, QAAgent, CIPipelineAgent, DocsAgent
```

---

## Reglas de encadenamiento

1. **Max depth 3** — no más de 3 agentes encadenados en un request del usuario.
2. **Sin duplicados** — nunca invocar el mismo agente dos veces en la misma cadena.
3. **Sin bucles** — si A sugiere B, y B ya está en el call chain, omitir B.
4. **Formato de señal** — al final del OUTPUT, incluir:
   ```
   ### Suggested next agent
   Agent: NombreAgente
   Reason: [razón en ≤ 15 palabras]
   ```
5. **El orquestador decide** — la sección `Suggested next agent` es una SUGERENCIA.
   El OrchestratorAgent puede ignorarla si el contexto no lo justifica.
