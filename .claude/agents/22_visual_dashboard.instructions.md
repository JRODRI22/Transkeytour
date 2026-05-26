---
applyTo: "**"
description: "Agente visualizador: copia o genera la carpeta visualizer/ (React 18 + Vite, puerto 1493) con monitor en tiempo real de los 22 agentes del pipeline. Auto-activado cuando visualizer/package.json no existe o usuario pide 'visualizador'/'monitor agentes'."
---

# 22 — VisualDashboardAgent

## Rol
Genera la carpeta `visualizer/` en el proyecto activo — una app React independiente que muestra en tiempo real el estado de los 22 agentes del pipeline, con un toggle **Visual Mode ON/OFF** para controlar animaciones y frecuencia de polling.

**Puerto:** `1493`

## Auto-trigger
- Keywords: `"visualizador"`, `"monitor agentes"`, `"dashboard de agentes"`, `"quiero ver los agentes"`, `"Visual Mode"`, `"ver en pantalla el pipeline"`
- Condición: Archivo `visualizer/package.json` no existe en el proyecto activo

## Pre-requisitos
- Node.js >= 18 instalado en el sistema
- Proyecto con `backend/` ya generado (requiere BackendAgent completado) — *opcional*, corre en simulación si el backend no está disponible*

## Payload de entrada esperado
```json
{
  "project_path": "ruta/al/proyecto",
  "backend_port": 5159
}
```

## Tarea
1. Copiar la carpeta `visualizer/` desde el cerebro central (`.claude/templates/visualizer/`) al proyecto
2. Ajustar `vite.config.js` con el `backend_port` del proyecto
3. Ejecutar `npm install` dentro de `visualizer/`
4. Verificar que `npm run dev` arranca en puerto 5174

Si no existe `.claude/templates/visualizer/`, generarla completa con los 14 archivos definidos en el cerebro central.

## Archivos generados
```
{project}/visualizer/
├── package.json
├── vite.config.js           ← proxy /api → http://localhost:{backend_port}
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── src/
    ├── index.css            ← keyframes: pulse-working, blink-error, zzz-float
    ├── main.jsx
    ├── App.jsx              ← layout: TopBar + AgentGrids + DetailsPanel + Footer
    ├── services/
    │   └── agentStateService.js   ← 22 agents + fetch /api/status/agents + simulación fallback
    ├── hooks/
    │   ├── useVisualMode.js       ← localStorage 'agent-viz-mode', default = true
    │   └── useAgentState.js       ← polling dinámico (2s ON / 15s OFF)
    └── components/
        ├── VisualModeToggle.jsx   ← slider grande ON/OFF
        ├── GlobalProgress.jsx     ← barra de progreso + dots de fase
        ├── AgentCard.jsx          ← 5 variantes: idle/working/done/error/sleeping
        └── AgentDetails.jsx       ← panel lateral de detalles al hacer clic
```

## Referencia de fuente de datos
El visualizador conecta a `GET /api/status/agents` (generado por `StatusController.cs` en BackendAgent).
Si el endpoint no responde en 2.5s → **fallback automático a simulación** — el visualizador siempre muestra datos.

## Visual Mode toggle

| Modo | Polling | Animaciones | Agentes idle/working |
|------|---------|-------------|----------------------|
| ON  (⚡) | 2 s | pulse-working, zzz-float activas | Colores vivos, estados animados |
| OFF (💤) | 15 s | Desactivadas vía CSS | `sleeping` state: grayscale(0.85) brightness(0.55) + 💤 icon |

El modo se persiste en `localStorage` bajo la key `agent-viz-mode`.

## Cómo arrancar después de instalar
```bash
cd visualizer
npm install
npm run dev
# → http://localhost:1493
```

## OUTPUT JSON
```json
{
  "status": "completed",
  "agent": "VisualDashboardAgent",
  "files_generated": [
    "visualizer/package.json",
    "visualizer/vite.config.js",
    "visualizer/tailwind.config.js",
    "visualizer/postcss.config.js",
    "visualizer/index.html",
    "visualizer/src/index.css",
    "visualizer/src/main.jsx",
    "visualizer/src/App.jsx",
    "visualizer/src/services/agentStateService.js",
    "visualizer/src/hooks/useVisualMode.js",
    "visualizer/src/hooks/useAgentState.js",
    "visualizer/src/components/VisualModeToggle.jsx",
    "visualizer/src/components/GlobalProgress.jsx",
    "visualizer/src/components/AgentCard.jsx",
    "visualizer/src/components/AgentDetails.jsx"
  ],
  "dev_url": "http://localhost:1493",
  "state_updates": {
    "visualizer": "installed"
  },
  "errors": [],
  "next_agent": null
}
```

> **Regla:** Al completar, retorna el OUTPUT JSON al OrchestratorAgent y **DETENTE**.
