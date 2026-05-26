/**
 * session-start.js — Auto-registro de sesión en JarvisDB
 *
 * Se ejecuta automáticamente al abrir el workspace (task runOn: folderOpen).
 * Lee .claude/state.json para obtener el nombre del proyecto y la fase activa,
 * luego llama a POST /api/log-agent-run y POST /api/sync-project.
 *
 * Uso:
 *   node .claude/session-start.js [nombre-proyecto] [fase]
 *
 * Si no se pasan args, intenta leer .claude/state.json automáticamente.
 */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const HTTP_PORT   = process.env.JARVIS_HTTP_PORT || 3001;
const RETRY_MS    = 2000;
const MAX_RETRIES = 5;

// ── Detectar proyecto y fase ──────────────────────────────────────────────────
function detectProject() {
  // 1. Args de línea de comando
  if (process.argv[2]) {
    return { projectName: process.argv[2], activePhase: process.argv[3] || 'maintenance' };
  }

  // 2. Explorar hacia arriba buscando .claude/state.json
  let dir = process.cwd();
  for (let i = 0; i < 4; i++) {
    const stateFile = path.join(dir, '.claude', 'state.json');
    if (fs.existsSync(stateFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        if (state.project) {
          return {
            projectName:  state.project,
            activePhase:  state.currentPhase || state.phase || 'maintenance',
            completedPhases: state.phases
              ? Object.entries(state.phases)
                  .filter(([, v]) => v && typeof v === 'string' && v.includes('done'))
                  .map(([k]) => k)
                  .join(',')
              : '',
            stack: state.stack || '',
          };
        }
      } catch { /* ignorar parse error */ }
    }

    // 3. Buscar package.json o *.sln como fallback de nombre
    const pkgFile = path.join(dir, 'package.json');
    if (fs.existsSync(pkgFile)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
        if (pkg.name && pkg.name !== 'visualizer') {
          return { projectName: pkg.name, activePhase: 'maintenance' };
        }
      } catch { /* ignorar */ }
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // 4. Usar el nombre de la carpeta del workspace
  return {
    projectName: path.basename(process.cwd())
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9_-]/g, '-'),
    activePhase: 'maintenance',
  };
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
function post(endpoint, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port:     HTTP_PORT,
      path:     endpoint,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Session Memory — escribe estado actual como instruction file ──────────────
function writeSessionMemory(projectName, activePhase, completedPhases) {
  try {
    // Buscar CLAUDE-activeContext.md en el workspace actual
    const activeContextPath = path.join(process.cwd(), 'CLAUDE-activeContext.md');
    let contextSnippet = '';
    if (fs.existsSync(activeContextPath)) {
      const lines = fs.readFileSync(activeContextPath, 'utf8').split('\n').slice(0, 80);
      contextSnippet = lines.join('\n').trim();
    }

    // Construir el instruction file
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const completedList = completedPhases
      ? completedPhases.split(',').map(p => `- ${p}`).join('\n')
      : '- (ninguna)';

    const content = `---
applyTo: "**"
---

# Estado de Sesión — ${projectName}

> Generado automáticamente por session-start.js el ${timestamp}.
> Actualizado en cada apertura de workspace. No editar manualmente.

---

## Proyecto activo

**Nombre:** ${projectName}
**Fase actual:** ${activePhase}

## Fases completadas

${completedList}

## Contexto (CLAUDE-activeContext.md)

${contextSnippet || '*(Sin activeContext disponible — primera sesión o archivo vacío)*'}

---

## Instrucciones para el asistente

Al recibir el primer mensaje del usuario en este workspace:
1. El proyecto activo es **${projectName}** en fase **${activePhase}**
2. Actuar como OrchestratorAgent y evaluar la solicitud del usuario
3. Si el usuario dice "continuar" o "qué sigue": reportar el estado de arriba y lanzar el siguiente agente sin preguntar más
4. Si el usuario hace una solicitud nueva: enrutar al agente correcto según la tabla de agents-catalog.instructions.md
`;

    // Escribir en .github/instructions/ del workspace actual
    const instrDir = path.join(process.cwd(), '.github', 'instructions');
    if (!fs.existsSync(instrDir)) {
      fs.mkdirSync(instrDir, { recursive: true });
    }
    const outPath = path.join(instrDir, 'session-memory.instructions.md');
    fs.writeFileSync(outPath, content, 'utf8');
    process.stdout.write(`[session-start] ✓ session-memory.instructions.md actualizado\n`);
  } catch (err) {
    // No bloquear si falla — solo advertir
    process.stderr.write(`[session-start] ⚠️ No se pudo escribir session-memory: ${err.message}\n`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const info = detectProject();
  const { projectName, activePhase, completedPhases = '', stack = '' } = info;

  process.stdout.write(`[session-start] Proyecto: ${projectName} | Fase: ${activePhase}\n`);

  // Reintentar hasta que el http-server arriba (puede tardar unos segundos)
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      // 1a. Log OrchestratorAgent session-open (started)
      await post('/api/log-agent-run', {
        agent_name:     'OrchestratorAgent',
        project_name:   projectName,
        status:         'started',
        phase:          activePhase,
        trigger_reason: `Workspace abierto automáticamente — VS Code folderOpen task`,
      });

      // 1b. Log OrchestratorAgent session-open (completed) — inmediato
      //     Sin esto el agente queda verde para siempre (started nunca completado)
      const logResult = await post('/api/log-agent-run', {
        agent_name:       'OrchestratorAgent',
        project_name:     projectName,
        status:           'completed',
        phase:            activePhase,
        trigger_reason:   `Workspace abierto automáticamente — VS Code folderOpen task`,
        duration_seconds: 0,
      });
      process.stdout.write(`[session-start] log_agent_run: ${JSON.stringify(logResult)}\n`);

      // 2. Sync project state
      const syncResult = await post('/api/sync-project', {
        project_name:     projectName,
        active_phase:     activePhase,
        last_agent:       'OrchestratorAgent',
        completed_phases: completedPhases,
        stack,
      });
      process.stdout.write(`[session-start] sync_project: ${JSON.stringify(syncResult)}\n`);

      // 3. Escribir session-memory.instructions.md para que Copilot conozca
      //    el estado actual del proyecto sin que el usuario diga "continuar"
      writeSessionMemory(projectName, activePhase, completedPhases);

      process.stdout.write(`[session-start] ✓ Sesión registrada en JarvisDB\n`);
      process.exit(0);
    } catch (err) {
      attempt++;
      if (attempt >= MAX_RETRIES) {
        process.stderr.write(`[session-start] No se pudo conectar a JarvisDB en :${HTTP_PORT} — ${err.message}\n`);
        process.exit(0); // Exit 0 para no bloquear el workspace
      }
      process.stdout.write(`[session-start] Esperando servidor... (intento ${attempt}/${MAX_RETRIES})\n`);
      await new Promise(r => setTimeout(r, RETRY_MS));
    }
  }
}

main().catch(err => {
  process.stderr.write(`[session-start] Error: ${err.message}\n`);
  process.exit(0);
});
