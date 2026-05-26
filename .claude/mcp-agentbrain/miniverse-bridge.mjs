/**
 * miniverse-bridge.mjs — ESM bridge entre JarvisDB HTTP Server (CJS) y @miniverse/server (ESM)
 *
 * Por qué separado: http-server.js es CommonJS; @miniverse/server es ESM puro.
 * CJS puede hacer dynamic import() de archivos .mjs, pero no importarlos estáticamente.
 *
 * Uso desde CJS:
 *   const bridge = await import('./miniverse-bridge.mjs');
 *   await bridge.start();
 *   bridge.sendHeartbeat('OrchestratorAgent', 'working', 'building backend', 'Orchestrator');
 *   bridge.sendHeartbeat('DebugAgent', 'idle');
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Configuración ─────────────────────────────────────────────────────────────
const MINIVERSE_PORT = process.env.MINIVERSE_PORT || 4321;

// ── Mapa de estados JarvisDB → Miniverse citizen states ──────────────────────
// Ver: @miniverse/server store.ts AgentState enum
const STATUS_MAP = {
  // JarvisDB statuses
  running:    'working',
  completed:  'idle',
  failed:     'error',
  started:    'thinking',
  pending:    'idle',
  active:     'working',
  // Agent history reciente → infer from time
  recent:     'idle',
  sleeping:   'sleeping',
  // Claude Code hook events
  thinking:   'thinking',
  working:    'working',
  idle:       'idle',
  error:      'error',
  offline:    'offline',
};

/**
 * Mapea nombre de agente JarvisDB → nombre para mostrar en el pixel world.
 * Usa prefijos de número de agente cuando están disponibles.
 */
function agentDisplayName(agentName, agentNumber) {
  if (agentNumber) return `[${agentNumber.toString().padStart(2, '0')}] ${agentName}`;
  return agentName;
}

// ── Estado interno del bridge ─────────────────────────────────────────────────
let _minimationStarted = false;
let _serverUrl = `http://localhost:${MINIVERSE_PORT}`;

/**
 * Envía un heartbeat a Miniverse vía HTTP (no necesita SDK)
 * @param {string} agentId     - Identificador único del agente (usado como citizen id)
 * @param {string} state       - Estado: working|idle|thinking|sleeping|error|offline
 * @param {string} [task]      - Tarea actual (aparece en tooltip del ciudadano)
 * @param {string} [name]      - Nombre para mostrar (si diffiere de agentId)
 * @param {string} [projectName] - Proyecto activo del agente
 */
export function sendHeartbeat(agentId, state, task, name, projectName) {
  const citizenState = STATUS_MAP[state] || 'idle';
  const displayName  = name || agentId;

  const payload = JSON.stringify({
    agent:    agentId,
    name:     displayName,
    state:    citizenState,
    task:     task || undefined,
    metadata: projectName ? { project: projectName } : undefined,
  });

  const options = {
    hostname: 'localhost',
    port:     MINIVERSE_PORT,
    path:     '/api/heartbeat',
    method:   'POST',
    headers: {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = http.request(options, (res) => {
    // Drain response silently
    res.resume();
  });

  req.on('error', (err) => {
    // Silencioso — Miniverse puede no estar arriba aún
    if (process.env.MINIVERSE_DEBUG) {
      process.stderr.write(`[MiniverseBridge] heartbeat error for ${agentId}: ${err.message}\n`);
    }
  });

  req.write(payload);
  req.end();
}

/**
 * Registra un agente de Claude Code (hook-based) directamente en Miniverse.
 * Llamado desde el handler de POST /api/hooks/claude-code en http-server.js
 */
export function handleClaudeCodeHook(hookEvent, agentId, task) {
  const hookToState = {
    'SessionStart':       'idle',
    'UserPromptSubmit':   'thinking',
    'PreToolUse':         'working',
    'PostToolUse':        'working',
    'PostToolUseFailure': 'error',
    'Stop':               'idle',
    'SubagentStart':      'working',
    'SubagentStop':       'idle',
    'SessionEnd':         'offline',
  };

  const state = hookToState[hookEvent] || 'idle';
  sendHeartbeat(agentId, state, task, agentId, 'Claude Code Session');
}

/**
 * Inicia el servidor Miniverse en el puerto configurado.
 * Si ya fue iniciado, es no-op.
 * Retorna Promise<boolean> — true si arrancó, false si ya estaba arriba.
 */
export async function start() {
  if (_minimationStarted) return false;

  try {
    // Intentar importar @miniverse/server dinámicamente
    const { MiniverseServer } = await import('@miniverse/server');

    const miniverseServer = new MiniverseServer({
      port: MINIVERSE_PORT,
    });

    await miniverseServer.start();
    _minimationStarted = true;
    process.stderr.write(`[MiniverseBridge] ✅ Miniverse world en http://localhost:${MINIVERSE_PORT}\n`);
    return true;

  } catch (err) {
    // Fallback: modo standalone — Miniverse no instalado pero heartbeats seguirán
    // funcionando si hay otro proceso corriendo en el puerto
    process.stderr.write(`[MiniverseBridge] ⚠️  Miniverse no disponible: ${err.message}\n`);
    process.stderr.write(`[MiniverseBridge] Heartbeats seguirán intentándose si el servidor ya corre\n`);
    _minimationStarted = true; // marcar como iniciado para no reintentar
    return false;
  }
}

/**
 * Verifica si Miniverse está corriendo mediante una petición HTTP simple.
 */
export function isRunning() {
  return new Promise((resolve) => {
    const req = http.get(`${_serverUrl}/api/agents`, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}
