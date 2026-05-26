/**
 * db/queries.js — Todas las queries SQL parametrizadas
 * Centralizar SQL aquí previene SQL injection y facilita mantenimiento.
 */

'use strict';

const { getPool, sql } = require('./connection');

/** Ejecuta un stored procedure con parámetros */
async function execSP(spName, params) {
  const pool = await getPool();
  const req = pool.request();
  for (const [key, { type, value }] of Object.entries(params)) {
    req.input(key, type, value ?? null);
  }
  return req.execute(spName);
}

/** INSERT en Lessons — raw query (evita OUTPUT UNIQUEIDENTIFIER que falla con msnodesqlv8) */
async function insertLesson(p) {
  const pool = await getPool();
  const id = require('crypto').randomUUID();
  const req = pool.request();
  req.input('Id',              sql.UniqueIdentifier, id);
  req.input('LessonType',      sql.NVarChar(20),   p.lesson_type);
  req.input('SourceAgent',     sql.NVarChar(100),  p.source_agent);
  req.input('Title',           sql.NVarChar(200),  p.title);
  req.input('Description',     sql.NVarChar(1000), p.description);
  req.input('RootCause',       sql.NVarChar(500),  p.root_cause    || null);
  req.input('Fix',             sql.NVarChar(1000), p.fix           || null);
  req.input('Severity',        sql.NVarChar(20),   p.severity);
  req.input('Scope',           sql.NVarChar(20),   p.scope);
  req.input('ProjectName',     sql.NVarChar(200),  p.project_name  || null);
  req.input('Stack',           sql.NVarChar(100),  p.stack         || null);
  req.input('Tags',            sql.NVarChar(500),  p.tags          || null);
  req.input('AppliesToAgents', sql.NVarChar(500),  p.applies_to_agents || null);
  req.input('FilesAffected',   sql.NVarChar(1000), p.files_affected || null);
  req.input('SkillPath',       sql.NVarChar(300),  p.skill_path    || null);
  await req.query(`
    INSERT INTO Lessons
      (Id, LessonType, SourceAgent, Title, Description, RootCause, Fix, Severity, Scope,
       ProjectName, Stack, Tags, AppliesToAgents, FilesAffected, SkillPath)
    VALUES
      (@Id, @LessonType, @SourceAgent, @Title, @Description, @RootCause, @Fix, @Severity, @Scope,
       @ProjectName, @Stack, @Tags, @AppliesToAgents, @FilesAffected, @SkillPath)
  `);
  return id;
}

/** INSERT en Patterns */
async function insertPattern(p) {
  const pool = await getPool();
  const req = pool.request();
  // Generar PatternId secuencial
  const countResult = await pool.request()
    .query("SELECT ISNULL(MAX(CAST(SUBSTRING(PatternId,5,10) AS INT)),0) AS MaxN FROM Patterns");
  const nextN = (countResult.recordset[0].MaxN || 0) + 1;
  const patternId = 'PAT-' + String(nextN).padStart(3, '0');

  req.input('PatternId',     sql.NVarChar(20),  patternId);
  req.input('Name',          sql.NVarChar(200), p.name);
  req.input('Description',   sql.NVarChar(500), p.description);
  req.input('Language',      sql.NVarChar(50),  p.language);
  req.input('CodeExample',   sql.NVarChar(sql.MAX), p.code_example    || null);
  req.input('WhyItWorks',    sql.NVarChar(500), p.why_it_works    || null);
  req.input('WhenToUse',     sql.NVarChar(500), p.when_to_use     || null);
  req.input('WhenNotToUse',  sql.NVarChar(500), p.when_not_to_use || null);
  req.input('RelatedAgent',  sql.NVarChar(200), p.related_agent   || null);
  await req.query(`
    INSERT INTO Patterns (PatternId, Name, Description, Language, CodeExample, WhyItWorks, WhenToUse, WhenNotToUse, RelatedAgent)
    VALUES (@PatternId, @Name, @Description, @Language, @CodeExample, @WhyItWorks, @WhenToUse, @WhenNotToUse, @RelatedAgent)
  `);
  return patternId;
}

/** INSERT en Decisions — mapeado al schema real de la tabla */
async function insertDecision(p) {
  const pool = await getPool();
  const req = pool.request();
  req.input('ProjectName',  sql.NVarChar(200),    p.project_name || null);
  req.input('Title',        sql.NVarChar(200),    p.title);
  req.input('DecisionText', sql.NVarChar(sql.MAX),p.decision);
  req.input('Reason',       sql.NVarChar(sql.MAX),p.rationale    || p.context || null);
  req.input('Alternatives', sql.NVarChar(sql.MAX),p.alternatives || null);
  req.input('Tags',         sql.NVarChar(500),    p.status ? `status:${p.status}` : null);
  req.input('AgentName',    sql.NVarChar(100),    p.agent_name   || null);
  const result = await req.query(`
    INSERT INTO Decisions (ProjectName, Title, DecisionText, Reason, Alternatives, Tags, AgentName)
    OUTPUT INSERTED.Id
    VALUES (@ProjectName, @Title, @DecisionText, @Reason, @Alternatives, @Tags, @AgentName)
  `);
  return result.recordset[0]?.Id;
}

/** INSERT en AgentHistory */
async function insertAgentHistory(p) {
  const pool = await getPool();
  const req = pool.request();
  const id = require('crypto').randomUUID();
  req.input('Id',             sql.UniqueIdentifier, id);
  req.input('RunId',          sql.UniqueIdentifier, p.run_id || require('crypto').randomUUID());
  req.input('AgentName',      sql.NVarChar(100),    p.agent_name);
  req.input('AgentNumber',    sql.TinyInt,          p.agent_number ?? null);
  req.input('ProjectName',    sql.NVarChar(200),    p.project_name);
  req.input('TriggerReason',  sql.NVarChar(500),    p.trigger_reason    || null);
  req.input('Status',         sql.NVarChar(20),     p.status);
  req.input('Phase',          sql.NVarChar(50),     p.phase             || null);
  req.input('FilesGenerated', sql.NVarChar(sql.MAX),p.files_generated ? JSON.stringify(p.files_generated) : null);
  req.input('ErrorMessage',   sql.NVarChar(2000),   p.error_message     || null);
  req.input('DurationSeconds',sql.Int,              p.duration_seconds  ?? null);
  req.input('TokensEstimate', sql.Int,              p.tokens_estimate   ?? null);
  req.input('RetryAttempt',   sql.TinyInt,          p.retry_attempt     || 0);
  req.input('CompletedAt',    sql.DateTime2,        p.status !== 'started' ? new Date() : null);
  await req.query(`
    INSERT INTO AgentHistory
      (Id, RunId, AgentName, AgentNumber, ProjectName, TriggerReason, Status, Phase,
       FilesGenerated, ErrorMessage, DurationSeconds, TokensEstimate, RetryAttempt, CompletedAt)
    VALUES
      (@Id, @RunId, @AgentName, @AgentNumber, @ProjectName, @TriggerReason, @Status, @Phase,
       @FilesGenerated, @ErrorMessage, @DurationSeconds, @TokensEstimate, @RetryAttempt, @CompletedAt)
  `);
  return id;
}

/** UPSERT en ProjectStates */
async function upsertProjectState(p) {
  const pool = await getPool();
  const req = pool.request();
  req.input('ProjectName',     sql.NVarChar(200),    p.project_name);
  req.input('ProjectPath',     sql.NVarChar(500),    p.project_path      || null);
  req.input('Stack',           sql.NVarChar(200),    p.stack             || null);
  req.input('ActivePhase',     sql.NVarChar(50),     p.active_phase      || null);
  req.input('LastAgent',       sql.NVarChar(100),    p.last_agent        || null);
  req.input('CompletedPhases', sql.NVarChar(500),    p.completed_phases  || null);
  req.input('PendingGates',    sql.NVarChar(500),    p.pending_gates     || null);
  req.input('StateJson',       sql.NVarChar(sql.MAX),p.state_json        || null);
  req.input('TokensSavedDelta',sql.Int,              p.tokens_saved      || 0);
  await req.execute('sp_SyncProjectState');
}

/** INSERT en Snippets */
async function insertSnippet(p) {
  const pool = await getPool();
  const req = pool.request();
  const id = require('crypto').randomUUID();
  req.input('Id',          sql.UniqueIdentifier,      id);
  req.input('SnippetType', sql.NVarChar(50),          p.snippet_type);
  req.input('Name',        sql.NVarChar(200),         p.name);
  req.input('Description', sql.NVarChar(500),         p.description);
  req.input('Code',        sql.NVarChar(sql.MAX),     p.code);
  req.input('Language',    sql.NVarChar(50),          p.language);
  req.input('Framework',   sql.NVarChar(100),         p.framework     || null);
  req.input('Tags',        sql.NVarChar(500),         p.tags          || null);
  req.input('SourceAgent', sql.NVarChar(100),         p.source_agent  || null);
  req.input('IsVerified',  sql.Bit,                   p.is_verified ? 1 : 0);
  await req.query(`
    INSERT INTO Snippets (Id, SnippetType, Name, Description, Code, Language, Framework, Tags, SourceAgent, IsVerified)
    VALUES (@Id, @SnippetType, @Name, @Description, @Code, @Language, @Framework, @Tags, @SourceAgent, @IsVerified)
  `);
  return id;
}

/** INSERT en EvolvedSkills */
async function insertEvolvedSkill(p) {
  const pool = await getPool();
  const req = pool.request();
  const id = require('crypto').randomUUID();
  const decayAt = p.decay_at || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  })();
  req.input('Id',             sql.UniqueIdentifier, id);
  req.input('SkillName',      sql.NVarChar(200),    p.skill_name);
  req.input('Version',        sql.TinyInt,          p.version || 1);
  req.input('FilePath',       sql.NVarChar(500),    p.file_path);
  req.input('SourceLessonId', sql.UniqueIdentifier, p.source_lesson_id || null);
  req.input('AgentsApplied',  sql.NVarChar(500),    p.agents_applied   || null);
  req.input('EvolutionDelta', sql.Decimal(5, 2),    p.evolution_delta  ?? null);
  req.input('DecayAt',        sql.DateTime2,        decayAt);

  // Si ya existe misma combinación (nombre + versión), actualiza en vez de insertar
  await req.query(`
    MERGE EvolvedSkills AS target
    USING (SELECT @SkillName AS SkillName, @Version AS Version) AS source
      ON target.SkillName = source.SkillName AND target.Version = source.Version
    WHEN MATCHED THEN
      UPDATE SET
        FilePath       = @FilePath,
        AgentsApplied  = @AgentsApplied,
        EvolutionDelta = @EvolutionDelta,
        DecayAt        = @DecayAt,
        IsActive       = 1,
        UpdatedAt      = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
      INSERT (Id, SkillName, Version, FilePath, SourceLessonId, AgentsApplied, EvolutionDelta, DecayAt)
      VALUES (@Id, @SkillName, @Version, @FilePath, @SourceLessonId, @AgentsApplied, @EvolutionDelta, @DecayAt);
  `);
  return id;
}

/** SELECT skills evolucionadas activas */
async function selectEvolvedSkills(p) {
  const pool = await getPool();
  const req = pool.request();
  req.input('ActiveOnly', sql.Bit,          p.active_only !== false ? 1 : 0);
  req.input('AgentName',  sql.NVarChar(200), p.agent_name || null);
  return req.query(`
    SELECT
      Id, SkillName, Version, FilePath, AgentsApplied,
      EvolutionDelta, UsageCount, DecayAt, IsActive, CreatedAt
    FROM EvolvedSkills
    WHERE IsDeleted = 0
      AND (@ActiveOnly = 0 OR IsActive = 1)
      AND (@AgentName IS NULL OR AgentsApplied LIKE '%' + @AgentName + '%')
    ORDER BY CreatedAt DESC
  `);
}

/** SELECT contexto relevante para una tarea */
async function selectContext(p) {
  const pool = await getPool();
  const req = pool.request();
  req.input('TaskDescription', sql.NVarChar(500), p.task_description);
  req.input('ProjectName',     sql.NVarChar(200), p.project_name || null);
  req.input('Stack',           sql.NVarChar(100), p.stack        || null);
  req.input('MaxResults',      sql.TinyInt,       p.max_results  || 8);
  return req.execute('sp_GetContext');
}

/** SELECT historial de un proyecto */
async function selectProjectHistory(p) {
  const pool = await getPool();
  const req = pool.request();
  req.input('ProjectName', sql.NVarChar(200), p.project_name);
  req.input('Limit',       sql.Int,           p.limit || 20);
  req.input('AgentName',   sql.NVarChar(100), p.agent_name || null);
  return req.query(`
    SELECT TOP (@Limit)
      AgentName, AgentNumber, Status, Phase, TriggerReason,
      DurationSeconds, TokensEstimate, RetryAttempt, StartedAt, CompletedAt, ErrorMessage
    FROM AgentHistory
    WHERE ProjectName = @ProjectName
      AND (@AgentName IS NULL OR AgentName = @AgentName)
    ORDER BY StartedAt DESC
  `);
}

/** SELECT estadísticas globales o por proyecto */
async function selectStatistics(p) {
  const pool = await getPool();
  const req = pool.request();
  req.input('ProjectName', sql.NVarChar(200), p.project_name || null);
  return req.query(`
    SELECT
      (SELECT COUNT(*) FROM Lessons   WHERE IsDeleted = 0 AND (@ProjectName IS NULL OR ProjectName = @ProjectName)) AS TotalLessons,
      (SELECT COUNT(*) FROM Patterns  WHERE IsDeleted = 0)                                                          AS TotalPatterns,
      (SELECT COUNT(*) FROM Decisions WHERE IsDeleted = 0 AND (@ProjectName IS NULL OR ProjectName = @ProjectName)) AS TotalDecisions,
      (SELECT COUNT(*) FROM Snippets  WHERE IsDeleted = 0)                                                          AS TotalSnippets,
      (SELECT COUNT(*) FROM ProjectStates WHERE IsActive = 1)                                                       AS ActiveProjects,
      (SELECT ISNULL(SUM(TokensSaved),0) FROM ProjectStates)                                                        AS TotalTokensSaved,
      (SELECT COUNT(*) FROM AgentHistory WHERE Status = 'completed')                                                AS SuccessfulRuns,
      (SELECT COUNT(*) FROM AgentHistory WHERE Status = 'failed')                                                   AS FailedRuns,
      (SELECT TOP 1 Name FROM Patterns WHERE IsDeleted = 0 ORDER BY UsageCount DESC)                                AS MostUsedPattern,
      (SELECT COUNT(*) FROM EvolvedSkills WHERE IsActive = 1 AND IsDeleted = 0)                                     AS ActiveEvolvedSkills;
  `);
}

/** INSERT en MemoryNotes via sp_SaveMemoryNote
 * Soporta project_id (int) o project_name (string) — el nombre hace auto-lookup.
 */
async function insertMemoryNote(p) {
  const pool = await getPool();

  // Resolver project_id desde project_name si no viene numeric
  let projectId = p.project_id ?? null;
  if (!projectId && p.project_name) {
    const lookup = await pool.request()
      .input('PN', sql.NVarChar(200), p.project_name)
      .query('SELECT TOP 1 Id FROM ProjectStates WHERE ProjectName = @PN AND IsActive = 1');
    projectId = lookup.recordset?.[0]?.Id ?? null;
  }

  const req = pool.request();
  req.input('ProjectId',  sql.Int,              projectId);
  req.input('Category',   sql.NVarChar(100),    p.category);
  req.input('Title',      sql.NVarChar(300),    p.title);
  req.input('Content',    sql.NVarChar(sql.MAX),p.content);
  req.input('Tags',       sql.NVarChar(500),    p.tags        || null);
  req.input('Importance', sql.Int,              p.importance  ?? 5);
  const result = await req.execute('sp_SaveMemoryNote');
  return result.recordset[0]?.NewNoteId;
}

/** SEARCH en MemoryNotes via sp_SearchMemory */
async function searchMemory(p) {
  const pool = await getPool();
  const req = pool.request();
  req.input('Keywords', sql.NVarChar(500), p.keywords);
  req.input('Category', sql.NVarChar(100), p.category    || null);
  req.input('Top',      sql.Int,           p.max_results || 20);
  return req.execute('sp_SearchMemory');
}

/** INSERT en ErrorHistory via sp_SaveError */
async function insertError(p) {
  const pool = await getPool();
  const req = pool.request();
  req.input('ProjectId',    sql.Int,              p.project_id    ?? null);
  req.input('ErrorType',    sql.NVarChar(200),    p.error_type);
  req.input('ErrorMessage', sql.NVarChar(sql.MAX),p.error_message);
  req.input('StackTrace',   sql.NVarChar(sql.MAX),p.stack_trace   || null);
  req.input('Solution',     sql.NVarChar(sql.MAX),p.solution      || null);
  req.input('AgentName',    sql.NVarChar(100),    p.agent_name    || null);
  req.input('Tags',         sql.NVarChar(300),    p.tags          || null);
  return req.execute('sp_SaveError');
}

/** INSERT en TokenMetrics via sp_SaveTokenMetrics */
async function insertTokenMetrics(p) {
  const pool = await getPool();
  const req = pool.request();
  req.input('SessionId',       sql.NVarChar(100), p.session_id);
  req.input('AgentName',       sql.NVarChar(100), p.agent_name       || null);
  req.input('TokensUsed',      sql.Int,           p.tokens_used);
  req.input('TokensSaved',     sql.Int,           p.tokens_saved     || 0);
  req.input('ContextSize',     sql.Int,           p.context_size     || 0);
  req.input('MemoryRetrieval', sql.Bit,           p.memory_retrieval ? 1 : 0);
  req.input('Model',           sql.NVarChar(100), p.model            || null);
  return req.execute('sp_SaveTokenMetrics');
}

/** INSERT en SystemLogs via sp_InsertLog */
async function insertSystemLog(p) {
  const pool = await getPool();
  const req = pool.request();
  req.input('ProjectId', sql.Int,              p.project_id ?? null);
  req.input('AgentId',   sql.Int,              p.agent_id   ?? null);
  req.input('AgentName', sql.NVarChar(100),    p.agent_name || null);
  req.input('TaskId',    sql.Int,              p.task_id    ?? null);
  req.input('Level',     sql.NVarChar(20),     p.level      || 'info');
  req.input('Category',  sql.NVarChar(100),    p.category   || null);
  req.input('Message',   sql.NVarChar(sql.MAX),p.message);
  req.input('Details',   sql.NVarChar(sql.MAX),p.details    || null);
  return req.execute('sp_InsertLog');
}

/** CHECK si existe un 'started' reciente para el mismo agente+proyecto (deduplicación) */
async function checkRecentAgentStart(agentName, projectName, windowSeconds = 60) {
  const pool = await getPool();
  const result = await pool.request()
    .input('AgentName',   sql.NVarChar(100), agentName)
    .input('ProjectName', sql.NVarChar(200), projectName)
    .input('WindowSec',   sql.Int,           windowSeconds)
    .query(`
      SELECT TOP 1 RunId, StartedAt
      FROM AgentHistory
      WHERE AgentName   = @AgentName
        AND ProjectName = @ProjectName
        AND Status      = 'started'
        AND StartedAt   > DATEADD(SECOND, -@WindowSec, SYSUTCDATETIME())
      ORDER BY StartedAt DESC
    `);
  return result.recordset[0] || null;
}

/** SELECT estadísticas mejoradas con TokenMetrics (v2) */
async function selectStatisticsV2(p) {
  const pool = await getPool();
  const req = pool.request();
  req.input('ProjectName', sql.NVarChar(200), p.project_name || null);
  return req.execute('sp_GetStatisticsV2');
}

module.exports = {
  insertLesson,
  insertPattern,
  insertDecision,
  insertAgentHistory,
  checkRecentAgentStart,
  upsertProjectState,
  insertSnippet,
  insertEvolvedSkill,
  selectEvolvedSkills,
  selectContext,
  selectProjectHistory,
  selectStatistics,
  selectStatisticsV2,
  insertMemoryNote,
  searchMemory,
  insertError,
  insertTokenMetrics,
  insertSystemLog,
};
