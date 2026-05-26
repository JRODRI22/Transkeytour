---
description: "Health check del sistema AgentBrain: verifica agentes, MCP, state.json, hooks, rules. Retorna score 0-100."
---

# /harness-audit

Verifica el estado de salud completo del sistema de 22 agentes.

## Protocolo de ejecución

### Check 1 — Agent files (23 archivos esperados)

```
Verificar que existen en .claude/agents/:
  00_orchestrator.instructions.md
  01_architect.instructions.md
  02_database.instructions.md
  03_backend.instructions.md
  04_frontend.instructions.md
  05_integration.instructions.md
  06_review.instructions.md
  07_devops.instructions.md
  08_security.instructions.md
  09_qa.instructions.md
  10_debug.instructions.md
  11_docs.instructions.md
  12_memory_sync.instructions.md
  13_code_searcher.instructions.md
  14_api_discovery.instructions.md
  15_sentinel.instructions.md
  16_evolution.instructions.md
  17_component_library.instructions.md
  18_feature_dev.instructions.md
  19_test_master.instructions.md
  20_design_studio.instructions.md
  21_ci_pipeline.instructions.md
  22_visual_dashboard.instructions.md

Para cada archivo: verificar que tiene frontmatter YAML (primera línea es ---)
Puntuación: 2 puntos por agente OK (máx 46 puntos de este check)
```

### Check 2 — MCP JarvisDB health

```
Verificar que el proceso Node.js del MCP está corriendo:
  rtk ps node | grep mcp-agentbrain
  O: Get-Process node | Where-Object { ... }

Si responde: +15 puntos
Si no responde: 0 puntos + warning "MCP JarvisDB offline — ejecutar: node .claude/mcp-agentbrain/index.js"
```

### Check 3 — state.json válido (Copilot memory)

```
Verificar que existe /memories/repo/ en memoria del repo
Verificar que session-summary.md existe
Si existe y es JSON parseable: +5 puntos
Si no existe: 0 puntos + info (primer uso del workspace)
```

### Check 4 — Hooks ejecutables configurados

```
Verificar .github/hooks/ existe
Verificar .github/hooks/rtk-rewrite.json existe y tiene PreToolUse
Verificar .github/hooks/copilot-hooks.json existe y tiene PostToolUse
Verificar scripts/hooks/quality-guard.js existe
Verificar scripts/hooks/git-push-guard.js existe
Verificar scripts/hooks/observe.js existe
Puntuación: 2 puntos por hook OK (máx 12 puntos de este check)
```

### Check 5 — Rules system

```
Verificar rules/ directorio existe
Verificar rules/common/general.md existe
Verificar rules/dotnet/conventions.md existe
Verificar rules/react/conventions.md existe
Verificar rules/sql-server/conventions.md existe
Puntuación: 2 puntos por regla OK (máx 8 puntos de este check)
```

### Check 6 — RTK instalado

```
Ejecutar: rtk --version
Si responde con versión: +5 puntos
Si no: 0 puntos + instrucción de instalación
```

### Check 7 — Memory Bank files

```
Verificar en raíz del workspace:
  CLAUDE-activeContext.md
  CLAUDE-patterns.md
  CLAUDE-decisions.md
  CLAUDE-troubleshooting.md
Puntuación: 2 puntos por archivo OK (máx 8 puntos)
```

## Cálculo del score

```
Total máximo: 46 + 15 + 5 + 12 + 8 + 5 + 8 = 99 puntos → ajustar a 100
Score final = (puntos_obtenidos / 99) * 100, redondeado a entero

Umbrales:
  >= 90: 🟢 EXCELENTE — sistema completamente operativo
  75-89: 🟡 BUENO — algunos componentes opcionales ausentes
  60-74: 🟠 ACEPTABLE — hooks o rules faltantes
  < 60:  🔴 CRÍTICO — agentes o MCP con problemas
```

## Formato de salida

```
🔍 HARNESS AUDIT — AgentBrain v2026
══════════════════════════════════════

✅ Agentes:     [N]/23 OK          (+[puntos])
[⚠️ | ✅] MCP JarvisDB              (+[puntos])
[⚠️ | ✅] State/Memory              (+[puntos])
✅ Hooks:       [N]/6 OK           (+[puntos])
✅ Rules:       [N]/4 OK           (+[puntos])
[⚠️ | ✅] RTK v[version]            (+[puntos])
✅ Memory Bank: [N]/4 OK           (+[puntos])

──────────────────────────────────────
SCORE: [N]/100  [emoji según umbral]

Issues encontrados:
  ⚠️  [descripción del issue] → [solución]

Próximas mejoras disponibles:
  📚 /instinct-status → ver estado de aprendizaje continuo
  🔄 "ejecuta EvolutionAgent" → procesar lecciones pendientes
```
