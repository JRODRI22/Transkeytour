/**
 * JarvisDB HTTP API Server
 * Expone endpoints REST para el Agent Visualizer.
 * Usa la misma conexión SQL Server que el MCP (Windows Auth).
 *
 * Iniciar: node http-server.js
 * Puerto: 3001 (configurable via JARVIS_HTTP_PORT)
 */

'use strict';

require('dotenv').config({ path: __dirname + '/.env' });

// Fallbacks para cuando se ejecuta sin variables de entorno del MCP
// (connection.js lee estos en tiempo de carga, por eso se setean antes del require)
process.env.JARVISDB_SERVER   = process.env.JARVISDB_SERVER   || 'JORGE_R\\SQL';
process.env.JARVISDB_DATABASE = process.env.JARVISDB_DATABASE || 'JarvisDB';

const http = require('http');
const { getPool, sql } = require('./db/connection');

const PORT = process.env.JARVIS_HTTP_PORT || 3001;

const PIPELINE_PHASES = ['SDD', 'BD', 'BE', 'FE', 'INT', 'REV', 'OPS', 'SEC'];

const PHASE_MAP = {
  SDD: 0, ARCH: 0, ARCHITECTURE: 0,
  BD: 1, DB: 1, DATABASE: 1,
  BE: 2, BACKEND: 2,
  FE: 3, FRONTEND: 3,
  INT: 4, INTEGRATION: 4,
  REV: 5, REVIEW: 5,
  OPS: 6, DEVOPS: 6, DOCKER: 6,
  SEC: 7, SECURITY: 7,
};

function phaseIndex(phase) {
  if (!phase) return -1;
  return PHASE_MAP[phase.toUpperCase().trim()] ?? -1;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

function send(res, status, data) {
  setCors(res);
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

// ── GET /api/projects ─────────────────────────────────────────────────────────
// Shows ALL projects: those with a ProjectStates row AND those that only
// have AgentHistory entries (logged via mcp_jarvisdb_log_agent_run).
const DB_TIMEOUT_MS = 8000;

async function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('DB_TIMEOUT')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function handleProjects(res) {
  try {
    const pool = await withTimeout(getPool(), DB_TIMEOUT_MS);
    const result = await withTimeout(pool.request().query(`
      WITH AllProjectNames AS (
        SELECT ProjectName FROM ProjectStates
        UNION
        SELECT DISTINCT ProjectName FROM AgentHistory WHERE ProjectName IS NOT NULL
      ),
      AgentStats AS (
        SELECT
          ProjectName,
          COUNT(*)                  AS TotalRuns,
          COUNT(DISTINCT AgentName) AS UniqueAgents,
          MAX(StartedAt)            AS LastActivity
        FROM AgentHistory
        GROUP BY ProjectName
      ),
      LatestRun AS (
        SELECT ProjectName, AgentName AS LastAgent, Status AS LatestStatus
        FROM (
          SELECT ProjectName, AgentName, Status,
                 ROW_NUMBER() OVER (PARTITION BY ProjectName ORDER BY StartedAt DESC) AS rn
          FROM AgentHistory
        ) ranked
        WHERE rn = 1
      )
      SELECT
        apn.ProjectName,
        ps.Id,
        ISNULL(ps.Stack,           '')    AS Stack,
        ISNULL(ps.ActivePhase,     '')    AS ActivePhase,
        ISNULL(lr.LastAgent, ISNULL(ps.LastAgent, '')) AS LastAgent,
        ISNULL(ps.CompletedPhases, '')    AS CompletedPhases,
        ISNULL(ps.TokensSaved,     0)     AS TokensSaved,
        ISNULL(ps.IsActive,        1)     AS IsActive,
        ISNULL(ps.CreatedAt,       ags.LastActivity) AS CreatedAt,
        ISNULL(ps.LastSyncAt,      ags.LastActivity) AS LastSyncAt,
        ps.Artifacts,
        ISNULL(ags.TotalRuns,      0)     AS TotalRuns,
        ISNULL(ags.UniqueAgents,   0)     AS UniqueAgents,
        ISNULL(lr.LatestStatus,    '')    AS LatestStatus
      FROM AllProjectNames apn
      LEFT JOIN ProjectStates ps  ON ps.ProjectName  = apn.ProjectName
      LEFT JOIN AgentStats    ags ON ags.ProjectName = apn.ProjectName
      LEFT JOIN LatestRun     lr  ON lr.ProjectName  = apn.ProjectName
      ORDER BY ISNULL(ps.LastSyncAt, ags.LastActivity) DESC
    `), DB_TIMEOUT_MS);
    send(res, 200, result.recordset);
  } catch (err) {
    const isTimeout = err.message === 'DB_TIMEOUT';
    process.stderr.write(`[/api/projects] ${isTimeout ? 'DB timeout' : err.message}\n`);
    // Return empty array (not 500) so frontend shows empty state instead of treating it as offline
    send(res, 200, []);
  }
}

// ── GET /api/projects/:name/agents ────────────────────────────────────────────
async function handleProjectAgents(res, projectName) {
  try {
    const pool = await getPool();

    // Latest agent history entry per AgentName for this project
    const agentResult = await pool.request()
      .input('ProjectName', sql.NVarChar(200), projectName)
      .query(`
        SELECT
          ah.AgentName, ah.AgentNumber, ah.Status, ah.Phase,
          ah.TriggerReason, ah.DurationSeconds, ah.FilesGenerated,
          ah.ErrorMessage, ah.TokensEstimate, ah.RetryAttempt,
          ah.StartedAt, ah.CompletedAt
        FROM AgentHistory ah
        INNER JOIN (
          SELECT AgentName, MAX(StartedAt) AS MaxStarted
          FROM AgentHistory
          WHERE ProjectName = @ProjectName
          GROUP BY AgentName
        ) latest
          ON ah.AgentName = latest.AgentName
         AND ah.StartedAt = latest.MaxStarted
        WHERE ah.ProjectName = @ProjectName
        ORDER BY ah.StartedAt DESC
      `);

    // Project metadata
    const projectResult = await pool.request()
      .input('ProjectName', sql.NVarChar(200), projectName)
      .query(`
        SELECT TOP 1
          ProjectName, Stack, ActivePhase, LastAgent,
          CompletedPhases, TokensSaved, LastSyncAt, Artifacts
        FROM ProjectStates
        WHERE ProjectName = @ProjectName
      `);

    const projectInfo = projectResult.recordset[0] || {};
    const agentRows   = agentResult.recordset;

    // Build historyMap: AgentName → row
    const historyMap = {};
    for (const row of agentRows) {
      historyMap[row.AgentName] = row;
    }

    // Phase progress from CompletedPhases (comma-separated list)
    const completedList = (projectInfo.CompletedPhases || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    const activePhaseIdx = phaseIndex(projectInfo.ActivePhase);
    const overallProgress = Math.round((completedList.length / PIPELINE_PHASES.length) * 100);

    send(res, 200, {
      pipeline: {
        project:         projectInfo.ProjectName || projectName,
        stack:           projectInfo.Stack        || null,
        phase:           projectInfo.ActivePhase  || null,
        phaseIndex:      activePhaseIdx,
        completedPhases: completedList,
        overallProgress,
        phasesCount:     PIPELINE_PHASES.length,
        lastAgent:       projectInfo.LastAgent    || null,
        tokensSaved:     projectInfo.TokensSaved  || 0,
        lastSyncAt:      projectInfo.LastSyncAt   || null,
        isSimulation:    false,
      },
      historyMap,
    });
  } catch (err) {
    console.error('[/api/projects/:name/agents]', err.message);
    send(res, 500, { error: err.message });
  }
}

// ── GET /api/activity — últimas N acciones de TODOS los orígenes ─────────────
// Combina: AgentHistory + Lessons + Decisions + MemoryNotes + ErrorHistory
// Así el feed es activo aunque log_agent_run no se llame directamente.
async function handleActivity(res, limit = 30) {
  try {
    const pool = await withTimeout(getPool(), DB_TIMEOUT_MS);
    const result = await withTimeout(pool.request()
      .input('Limit', sql.Int, Math.min(Number(limit) || 30, 100))
      .query(`
        SELECT TOP (@Limit)
          AgentName, ProjectName, Status, Phase, TriggerReason,
          DurationSeconds, ErrorMessage, StartedAt, Source
        FROM (
          -- Runs de agentes (fuente principal)
          SELECT
            ISNULL(AgentName,     'system')    AS AgentName,
            ProjectName,
            Status,
            ISNULL(Phase,         '')           AS Phase,
            ISNULL(TriggerReason, '')           AS TriggerReason,
            DurationSeconds,
            ErrorMessage,
            StartedAt,
            'agent_run'                         AS Source
          FROM AgentHistory

          UNION ALL

          -- Lecciones guardadas (save_lesson)
          SELECT
            ISNULL(SourceAgent, 'system'),
            ProjectName,
            'lesson',
            LessonType,
            Title,
            NULL,
            NULL,
            CreatedAt,
            'lesson'
          FROM Lessons
          WHERE IsDeleted = 0

          UNION ALL

          -- Decisiones guardadas (save_decision)
          SELECT
            ISNULL(AgentName, 'system'),
            ProjectName,
            'decision',
            '',
            Title,
            NULL,
            NULL,
            CreatedAt,
            'decision'
          FROM Decisions
          WHERE IsDeleted = 0

          UNION ALL

          -- Notas de memoria (save_memory_note)
          SELECT
            'system',
            NULL,
            'memory_note',
            Category,
            Title,
            NULL,
            NULL,
            CreatedAt,
            'memory'
          FROM MemoryNotes
          WHERE IsDeleted = 0

          UNION ALL

          -- Errores registrados (save_error)
          SELECT
            ISNULL(AgentName, 'system'),
            CAST(NULL AS nvarchar(200)),
            'error',
            ErrorType,
            ErrorMessage,
            NULL,
            ErrorMessage,
            CreatedAt,
            'error'
          FROM ErrorHistory
        ) combined
        ORDER BY StartedAt DESC
      `), DB_TIMEOUT_MS);
    send(res, 200, { activity: result.recordset, ts: new Date().toISOString() });
  } catch (err) {
    process.stderr.write(`[/api/activity] ${err.message}\n`);
    send(res, 200, { activity: [], ts: new Date().toISOString() });
  }
}

async function handleTokenMetrics(res) {
  try {
    const pool = await withTimeout(getPool(), DB_TIMEOUT_MS);

    const totals = await withTimeout(pool.request().query(`
      SELECT
        ISNULL(SUM(TokensUsed), 0)  AS total_tokens,
        ISNULL(SUM(TokensUsed), 0)  * 0.000003 AS total_cost_usd,
        ISNULL(SUM(TokensSaved), 0) AS total_saved
      FROM TokenMetrics
      WHERE CreatedAt >= DATEADD(day, -30, GETUTCDATE())
    `), DB_TIMEOUT_MS);

    const session = await withTimeout(pool.request().query(`
      SELECT ISNULL(SUM(TokensUsed), 0) AS session_tokens
      FROM TokenMetrics
      WHERE CreatedAt >= DATEADD(hour, -24, GETUTCDATE())
    `), DB_TIMEOUT_MS);

    const topAgents = await withTimeout(pool.request().query(`
      SELECT TOP 5 AgentName AS agent_name, SUM(TokensUsed) AS tokens
      FROM TokenMetrics
      WHERE AgentName IS NOT NULL
        AND CreatedAt >= DATEADD(day, -30, GETUTCDATE())
      GROUP BY AgentName
      ORDER BY SUM(TokensUsed) DESC
    `), DB_TIMEOUT_MS);

    const t          = totals.recordset[0]  || {};
    const totalUsed  = t.total_tokens   || 0;
    const totalSaved = t.total_saved    || 0;
    const rtkPct     = (totalUsed + totalSaved) > 0
      ? Math.round((totalSaved / (totalUsed + totalSaved)) * 100)
      : 0;

    send(res, 200, {
      total_tokens:    totalUsed,
      total_cost_usd:  t.total_cost_usd  || 0,
      session_tokens:  session.recordset[0]?.session_tokens || 0,
      rtk_savings_pct: rtkPct,
      top_agents:      topAgents.recordset,
    });
  } catch (err) {
    process.stderr.write(`[/api/token-metrics] ${err.message}\n`);
    send(res, 200, {
      total_tokens: 0, total_cost_usd: 0,
      session_tokens: 0, rtk_savings_pct: 0, top_agents: [],
    });
  }
}

async function handleEvolutionStatus(res) {
  try {
    const pool = await withTimeout(getPool(), DB_TIMEOUT_MS);

    const stats = await withTimeout(pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Lessons      WHERE IsDeleted = 0)                      AS total_lessons,
        (SELECT COUNT(*) FROM Lessons      WHERE IsDeleted = 0)                        AS lessons_pending,
        (SELECT COUNT(*) FROM EvolvedSkills WHERE IsActive = 1)                       AS skills_active
    `), DB_TIMEOUT_MS);

    const highConf = await withTimeout(pool.request().query(`
      SELECT TOP 5
        Id        AS id,
        SkillName AS trigger,
        CAST(EvolutionDelta AS FLOAT) AS confidence
      FROM EvolvedSkills
      WHERE IsActive = 1
      ORDER BY EvolutionDelta DESC
    `), DB_TIMEOUT_MS);

    const s = stats.recordset[0] || {};
    send(res, 200, {
      total_lessons:   s.total_lessons   || 0,
      lessons_pending: s.lessons_pending || 0,
      skills_active:   s.skills_active   || 0,
      instincts_total: 0,
      evolution_score: (s.skills_active || 0) * 5,
      high_confidence: highConf.recordset,
      promotion_queue: [],
    });
  } catch (err) {
    process.stderr.write(`[/api/evolution-status] ${err.message}\n`);
    send(res, 200, {
      total_lessons: 0, lessons_pending: 0,
      skills_active: 0, instincts_total: 0,
      evolution_score: 0, high_confidence: [], promotion_queue: [],
    });
  }
}

// ── POST /api/log-agent-run ───────────────────────────────────────────────────
// Permite que scripts externos (session-start.js, tasks) logueen runs sin MCP.
async function handleLogAgentRun(res, body) {
  try {
    const {
      agent_name, project_name, status, phase = '',
      trigger_reason = '', duration_seconds = null,
      files_generated = null, tokens_estimate = null,
      retry_attempt = 0, error_message = null,
    } = body;

    if (!agent_name || !project_name || !status) {
      send(res, 400, { error: 'agent_name, project_name y status son obligatorios' });
      return;
    }

    const pool  = await withTimeout(getPool(), DB_TIMEOUT_MS);
    const filesJson = files_generated ? JSON.stringify(files_generated) : null;

    await withTimeout(pool.request()
      .input('AgentName',       sql.NVarChar(200),  agent_name)
      .input('ProjectName',     sql.NVarChar(200),  project_name)
      .input('Status',          sql.NVarChar(50),   status)
      .input('Phase',           sql.NVarChar(200),  phase || '')
      .input('TriggerReason',   sql.NVarChar(sql.MAX), trigger_reason || '')
      .input('DurationSeconds', sql.Int,            duration_seconds)
      .input('FilesGenerated',  sql.NVarChar(sql.MAX), filesJson)
      .input('TokensEstimate',  sql.Int,            tokens_estimate)
      .input('RetryAttempt',    sql.Int,            retry_attempt || 0)
      .input('ErrorMessage',    sql.NVarChar(sql.MAX), error_message)
      .query(`
        INSERT INTO AgentHistory
          (AgentName, ProjectName, Status, Phase, TriggerReason,
           DurationSeconds, FilesGenerated, TokensEstimate, RetryAttempt,
           ErrorMessage, StartedAt)
        VALUES
          (@AgentName, @ProjectName, @Status, @Phase, @TriggerReason,
           @DurationSeconds, @FilesGenerated, @TokensEstimate, @RetryAttempt,
           @ErrorMessage, GETUTCDATE())
      `), DB_TIMEOUT_MS);

    send(res, 200, { success: true, agent_name, project_name, status });
  } catch (err) {
    process.stderr.write(`[/api/log-agent-run] ${err.message}\n`);
    send(res, 500, { error: err.message });
  }
}

// ── POST /api/sync-project ────────────────────────────────────────────────────
async function handleSyncProject(res, body) {
  try {
    const {
      project_name, stack = '', active_phase = '',
      last_agent = '', completed_phases = '', tokens_saved = 0,
    } = body;

    if (!project_name) {
      send(res, 400, { error: 'project_name es obligatorio' });
      return;
    }

    const pool = await withTimeout(getPool(), DB_TIMEOUT_MS);
    await withTimeout(pool.request()
      .input('ProjectName',     sql.NVarChar(200),  project_name)
      .input('Stack',           sql.NVarChar(500),  stack || '')
      .input('ActivePhase',     sql.NVarChar(200),  active_phase || '')
      .input('LastAgent',       sql.NVarChar(200),  last_agent || '')
      .input('CompletedPhases', sql.NVarChar(sql.MAX), completed_phases || '')
      .input('TokensSaved',     sql.Int,            tokens_saved || 0)
      .query(`
        MERGE ProjectStates AS target
        USING (SELECT @ProjectName AS ProjectName) AS src
          ON target.ProjectName = src.ProjectName
        WHEN MATCHED THEN UPDATE SET
          ActivePhase     = @ActivePhase,
          LastAgent       = @LastAgent,
          CompletedPhases = @CompletedPhases,
          TokensSaved     = ISNULL(TokensSaved, 0) + @TokensSaved,
          LastSyncAt      = GETUTCDATE(),
          Stack           = CASE WHEN @Stack != '' THEN @Stack ELSE Stack END
        WHEN NOT MATCHED THEN INSERT
          (ProjectName, Stack, ActivePhase, LastAgent, CompletedPhases,
           TokensSaved, IsActive, CreatedAt, LastSyncAt)
        VALUES
          (@ProjectName, @Stack, @ActivePhase, @LastAgent, @CompletedPhases,
           @TokensSaved, 1, GETUTCDATE(), GETUTCDATE());
      `), DB_TIMEOUT_MS);

    send(res, 200, { success: true, project_name, active_phase });
  } catch (err) {
    process.stderr.write(`[/api/sync-project] ${err.message}\n`);
    send(res, 500, { error: err.message });
  }
}

// ── Utility: parse JSON body ──────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// ── Router ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // POST endpoints
  if (req.method === 'POST') {
    const url  = new URL(req.url, `http://localhost:${PORT}`);
    const path = url.pathname;
    if (path === '/api/log-agent-run') {
      const body = await readBody(req);
      return handleLogAgentRun(res, body);
    }
    if (path === '/api/sync-project') {
      const body = await readBody(req);
      return handleSyncProject(res, body);
    }
    if (path === '/api/trigger-evolution') {
      send(res, 200, { ok: true, message: 'EvolutionAgent trigger noted' });
      return;
    }
    send(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (req.method !== 'GET') {
    send(res, 405, { error: 'Method not allowed' });
    return;
  }

  const url    = new URL(req.url, `http://localhost:${PORT}`);
  const path   = url.pathname;
  const params = url.searchParams;

  if (path === '/api/projects') {
    return handleProjects(res);
  }

  const match = path.match(/^\/api\/projects\/([^/]+)\/agents$/);
  if (match) {
    return handleProjectAgents(res, decodeURIComponent(match[1]));
  }

  if (path === '/api/activity') {
    return handleActivity(res, params.get('limit') || 30);
  }

  if (path === '/api/token-metrics') {
    return handleTokenMetrics(res);
  }

  if (path === '/api/evolution-status') {
    return handleEvolutionStatus(res);
  }

  if (path === '/health') {
    send(res, 200, { ok: true, ts: new Date().toISOString() });
    return;
  }

  send(res, 404, { error: 'Not found' });
});

/**
 * Inicia el servidor HTTP.
 * Llamado desde index.js (dentro del proceso MCP) O directamente con `node http-server.js`.
 * Se ignora si el puerto ya está en uso (puede haber una instancia previa corriendo).
 */
function startHttpServer() {
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      process.stderr.write(`[JarvisHTTP] Puerto ${PORT} ya en uso — servidor HTTP omitido\n`);
    } else {
      process.stderr.write(`[JarvisHTTP] Error: ${err.message}\n`);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    process.stderr.write(`[JarvisHTTP] http://0.0.0.0:${PORT}  — ready\n`);
    process.stderr.write('[JarvisHTTP] Endpoints:\n');
    process.stderr.write(`  GET  /api/projects\n`);
    process.stderr.write(`  GET  /api/projects/:name/agents\n`);
    process.stderr.write(`  GET  /api/activity?limit=30\n`);
    process.stderr.write(`  GET  /api/token-metrics\n`);
    process.stderr.write(`  GET  /api/evolution-status\n`);
    process.stderr.write(`  POST /api/log-agent-run\n`);
    process.stderr.write(`  POST /api/sync-project\n`);
    process.stderr.write(`  POST /api/trigger-evolution\n`);
    process.stderr.write(`  GET  /health\n`);
  });
}

module.exports = { startHttpServer };

// Si se ejecuta directamente: `node http-server.js`
if (require.main === module) {
  startHttpServer();
}

module.exports = server;
