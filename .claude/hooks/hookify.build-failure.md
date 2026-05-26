---
name: build-failure-escalation
enabled: true
event: bash
action: warn
conditions:
  - field: command
    operator: regex_match
    pattern: dotnet build|dotnet run|npm run build|npm test|dotnet test
---

⚙️ **Comando de build/test detectado**

El DebugAgent está configurado para manejar fallos automáticamente:
- **Intento 1-2**: DebugAgent corrige automáticamente
- **Intento 3**: Diagnóstico completo + DETIENE el pipeline para revisión humana
- **Ralph Mode** (opcional): agrega `"ralph_mode": true` al payload para iteración extendida

Si la build falla y el DebugAgent no logra resolverla en 3 intentos, revisa:
1. `docs/CHANGELOG.md` — cambios recientes que pueden haber introducido el error
2. `.claude/state.json` → campo `last_error` para historial
3. `CLAUDE-troubleshooting.md` — bugs conocidos y soluciones verificadas
