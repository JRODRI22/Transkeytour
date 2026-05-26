/**
 * JarvisDB MCP Server
 * Servidor MCP en stdio que expone herramientas para que los agentes de Copilot
 * puedan leer/escribir aprendizajes en SQL Server (localhost, Windows Auth).
 *
 * Registro en .vscode/mcp.json → VS Code lo lanza automáticamente
 */

'use strict';

require('dotenv').config({ path: __dirname + '/.env' });

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

// Herramientas
const saveLesson        = require('./tools/save_lesson');
const savePattern       = require('./tools/save_pattern');
const saveDecision      = require('./tools/save_decision');
const logAgentRun       = require('./tools/log_agent_run');
const syncProjectState  = require('./tools/sync_project_state');
const saveSnippet       = require('./tools/save_snippet');
const getContext        = require('./tools/get_context');
const getProjectHistory = require('./tools/get_project_history');
const getStatistics     = require('./tools/get_statistics');
const saveEvolvedSkill  = require('./tools/save_evolved_skill');
const getEvolvedSkills  = require('./tools/get_evolved_skills');
const getSkills            = require('./tools/get_skills');
const queueAgent           = require('./tools/queue_agent');
const updateQueueStatus    = require('./tools/update_queue_status');
const getPipelineStatus    = require('./tools/get_pipeline_status');
const getSnippets          = require('./tools/get_snippets');
const memSessionSummary    = require('./tools/mem_session_summary');
const saveMemoryNote       = require('./tools/save_memory_note');
const searchMemoryTool    = require('./tools/search_memory');
const saveError           = require('./tools/save_error');
const logTokenMetrics     = require('./tools/log_token_metrics');
const logEvent            = require('./tools/log_event');
const getDashboardSummary = require('./tools/get_dashboard_summary');
const getAgentsStatus     = require('./tools/get_agents_status');
const getRecentLogs       = require('./tools/get_recent_logs');
const getTokenDashboard   = require('./tools/get_token_dashboard');
const getCiSummary        = require('./tools/get_ci_summary');
const createTask          = require('./tools/create_task');
const updateTaskProgress  = require('./tools/update_task_progress');
const updateAgentStatus   = require('./tools/update_agent_status');
const saveKnowledge       = require('./tools/save_knowledge');
const getKnowledge        = require('./tools/get_knowledge');

const { getPool, closePool } = require('./db/connection');

async function main() {
  // Pre-inicializar pool de conexión
  await getPool();

  process.stderr.write('[JarvisDB MCP v4.1.0] Iniciando...\n');

  const server = new McpServer({
    name: 'jarvisdb',
    version: '4.1.0',
  });

  // ── TOOL: save_lesson ────────────────────────────────────────────────
  server.tool(
    'save_lesson',
    'Guarda una lección aprendida (bug resuelto, patrón, decisión, antipatrón) en JarvisDB. IMPORTANTE: incluir SIEMPRE project_name con el nombre exacto del proyecto activo (ej: "DeUnaCR", "TaskStars"). Solo omitir si scope=global y la lección aplica a todos los proyectos.',
    {
      lesson_type:       z.enum(['bugfix', 'antipattern', 'pattern', 'decision']).describe('Tipo de lección'),
      source_agent:      z.string().describe('Nombre del agente que genera la lección: DebugAgent, MemorySyncAgent, etc.'),
      title:             z.string().max(200).describe('Título corto y descriptivo'),
      description:       z.string().max(1000).describe('Descripción completa de la lección'),
      root_cause:        z.string().max(500).optional().describe('Causa raíz del bug o problema'),
      fix:               z.string().max(1000).optional().describe('Solución aplicada'),
      severity:          z.enum(['error', 'warning', 'info']).describe('Severidad de la lección'),
      scope:             z.enum(['global', 'stack', 'project']).describe('Alcance: global=todos los proyectos, stack=mismo lenguaje, project=solo este proyecto. Usar "project" para bugs específicos del proyecto activo.'),
      project_name:      z.string().max(200).optional().describe('OBLIGATORIO cuando scope="project". Nombre exacto del proyecto activo (ej: "DeUnaCR"). También recomendado para scope="stack" para poder filtrar por proyecto.'),
      stack:             z.string().max(100).optional().describe('Stack tecnológico: dotnet, react, sql, azure, etc.'),
      tags:              z.string().max(500).optional().describe('Tags separados por coma: jwt,auth,axios'),
      applies_to_agents: z.string().max(500).optional().describe('Agentes que deben usar esta lección (CSV)'),
      files_affected:    z.string().max(1000).optional().describe('Archivos afectados (CSV de rutas)'),
      skill_path:        z.string().max(300).optional().describe('Ruta del .md de skill generado si aplica'),
    },
    async (params) => saveLesson(params)
  );

  // ── TOOL: save_pattern ───────────────────────────────────────────────
  server.tool(
    'save_pattern',
    'Guarda un patrón de código verificado en JarvisDB para reutilizarlo en proyectos futuros.',
    {
      name:          z.string().max(200).describe('Nombre del patrón'),
      description:   z.string().max(500).describe('Descripción breve del patrón'),
      language:      z.string().max(50).describe('Lenguaje: csharp, javascript, typescript, sql, react, any'),
      code_example:  z.string().optional().describe('Ejemplo de código del patrón'),
      why_it_works:  z.string().max(500).optional().describe('Por qué funciona este patrón'),
      when_to_use:   z.string().max(500).optional().describe('Cuándo usar este patrón'),
      when_not_to_use: z.string().max(500).optional().describe('Cuándo NO usar este patrón'),
      related_agent: z.string().max(200).optional().describe('Agente que descubrió/usa el patrón'),
    },
    async (params) => savePattern(params)
  );

  // ── TOOL: save_decision ──────────────────────────────────────────────
  server.tool(
    'save_decision',
    'Guarda una decisión de arquitectura (ADR) en JarvisDB.',
    {
      title:        z.string().max(200).describe('Título del ADR'),
      context:      z.string().max(1000).describe('Contexto y problema que motivó la decisión'),
      decision:     z.string().max(1000).describe('La decisión tomada'),
      rationale:    z.string().max(1000).optional().describe('Justificación / razonamiento'),
      alternatives: z.string().max(1000).optional().describe('Alternativas consideradas y descartadas'),
      consequences: z.string().max(500).optional().describe('Consecuencias / trade-offs'),
      status:       z.enum(['proposed', 'accepted', 'deprecated', 'superseded']).default('accepted'),
      project_name: z.string().max(200).optional().describe('Proyecto al que aplica (omitir si es global)'),
    },
    async (params) => saveDecision(params)
  );

  // ── TOOL: log_agent_run ──────────────────────────────────────────────
  server.tool(
    'log_agent_run',
    'Registra el inicio o fin de la ejecución de un agente. Llamar con status=started al inicio y status=completed/failed al final.',
    {
      run_id:           z.string().optional().describe('ID único de la sesión de run (generar en started, reusar en completed)'),
      agent_name:       z.string().describe('Nombre del agente: OrchestratorAgent, BackendAgent, etc.'),
      agent_number:     z.number().int().min(0).max(18).optional().describe('Número del agente 0-18'),
      project_name:     z.string().describe('Nombre del proyecto'),
      status:           z.enum(['started', 'completed', 'failed', 'gate_pending']).describe('Estado del agente'),
      phase:            z.string().optional().describe('Fase: architecture, database, backend, frontend, etc.'),
      trigger_reason:   z.string().max(500).optional().describe('Por qué se activó este agente'),
      files_generated:  z.array(z.string()).optional().describe('Lista de archivos generados'),
      error_message:    z.string().max(2000).optional().describe('Mensaje de error si status=failed'),
      duration_seconds: z.number().int().optional().describe('Duración en segundos'),
      tokens_estimate:  z.number().int().optional().describe('Estimado de tokens consumidos'),
      retry_attempt:    z.number().int().min(0).default(0).describe('Número de reintento (0 = primer intento)'),
    },
    async (params) => logAgentRun(params)
  );

  // ── TOOL: sync_project_state ─────────────────────────────────────────
  server.tool(
    'sync_project_state',
    'Sincroniza el estado del proyecto (state.json) en JarvisDB. Llamar al finalizar cada fase.',
    {
      project_name:     z.string().max(200).describe('Nombre del proyecto'),
      project_path:     z.string().max(500).optional().describe('Ruta absoluta del proyecto'),
      stack:            z.string().max(200).optional().describe('Stack: dotnet-react, dotnet, react, etc.'),
      active_phase:     z.string().max(50).optional().describe('Fase activa: architecture, database, backend, etc.'),
      last_agent:       z.string().max(100).optional().describe('Último agente ejecutado'),
      completed_phases: z.string().max(500).optional().describe('Fases completadas separadas por coma'),
      pending_gates:    z.string().max(500).optional().describe('Gates pendientes de aprobación'),
      state_json:       z.string().optional().describe('Contenido completo del state.json como string JSON'),
      tokens_saved:     z.number().int().optional().default(0).describe('Tokens ahorrados en esta sesión vs. cargar archivos completos'),
    },
    async (params) => syncProjectState(params)
  );

  // ── TOOL: save_snippet ───────────────────────────────────────────────
  server.tool(
    'save_snippet',
    'Guarda un snippet de código reutilizable en la biblioteca de JarvisDB.',
    {
      name:         z.string().max(200).describe('Nombre descriptivo del snippet'),
      description:  z.string().max(500).describe('Qué hace este snippet'),
      code:         z.string().describe('Código del snippet'),
      language:     z.string().max(50).describe('Lenguaje: csharp, javascript, typescript, sql, powershell'),
      snippet_type: z.enum(['function', 'component', 'config', 'sql', 'migration', 'test', 'hook', 'other']).describe('Tipo de snippet'),
      framework:    z.string().max(100).optional().describe('Framework: aspnetcore, react, ef-core, etc.'),
      tags:         z.string().max(500).optional().describe('Tags CSV'),
      source_agent: z.string().max(100).optional().describe('Agente que generó el snippet'),
      is_verified:  z.boolean().default(false).describe('Si el snippet fue verificado como funcional'),
    },
    async (params) => saveSnippet(params)
  );

  // ── TOOL: get_context ────────────────────────────────────────────────
  server.tool(
    'get_context',
    'Herramienta CLAVE para ahorro de tokens. Retorna contexto relevante (lecciones + patrones) para la tarea actual en ≤200 tokens. Llamar al INICIO de cada sesión ANTES de cargar CLAUDE-*.md.',
    {
      task_description: z.string().max(500).describe('Descripción de la tarea o problema actual'),
      project_name:     z.string().max(200).optional().describe('Nombre del proyecto activo'),
      stack:            z.string().max(100).optional().describe('Stack: dotnet, react, sql, azure'),
      max_results:      z.number().int().min(1).max(20).default(8).describe('Máximo de resultados a retornar'),
    },
    async (params) => getContext(params)
  );

  // ── TOOL: get_project_history ────────────────────────────────────────
  server.tool(
    'get_project_history',
    'Retorna el historial de ejecución de agentes para un proyecto específico.',
    {
      project_name: z.string().max(200).describe('Nombre del proyecto'),
      limit:        z.number().int().min(1).max(100).default(20).describe('Número máximo de registros'),
      agent_name:   z.string().max(100).optional().describe('Filtrar por agente específico'),
    },
    async (params) => getProjectHistory(params)
  );

  // ── TOOL: get_statistics ─────────────────────────────────────────────
  server.tool(
    'get_statistics',
    'Retorna estadísticas del sistema JarvisDB: lecciones por tipo, proyectos activos, patrones más usados, tokens ahorrados.',
    {
      project_name: z.string().max(200).optional().describe('Filtrar por proyecto (omitir para stats globales)'),
    },
    async (params) => getStatistics(params)
  );

  // ── TOOL: save_evolved_skill ─────────────────────────────────────────
  server.tool(
    'save_evolved_skill',
    'Guarda o actualiza una skill evolucionada generada por EvolutionAgent en JarvisDB. Hace UPSERT por nombre+versión.',
    {
      skill_name:        z.string().max(200).describe('Nombre único de la skill (ej: LECCION-001-jwt-header)'),
      version:           z.number().int().min(1).max(255).default(1).describe('Versión de la skill (incrementar al actualizar)'),
      file_path:         z.string().max(500).describe('Ruta al .md generado: .claude/skills/evolved/nombre-v1.md'),
      source_lesson_id:  z.string().uuid().optional().describe('ID de la lecón de origen en la tabla Lessons (GUID)'),
      agents_applied:    z.string().max(500).optional().describe('CSV de agentes donde se inyectó: BackendAgent,IntegrationAgent'),
      evolution_delta:   z.number().optional().describe('Mejora de score aportada por esta skill (ej: 3.2)'),
      decay_at:          z.string().optional().describe('Fecha ISO 8601 de expiración (default: 30 días desde ahora)'),
    },
    async (params) => saveEvolvedSkill(params)
  );

  // ── TOOL: get_evolved_skills ────────────────────────────────────────
  server.tool(
    'get_evolved_skills',
    'Retorna skills evolucionadas activas desde JarvisDB. El OrchestratorAgent las carga al inicio de sesión para inyectarlas en subagentes.',
    {
      active_only: z.boolean().default(true).describe('true = solo skills activas (por defecto), false = incluir inactivas'),
      agent_name:  z.string().max(200).optional().describe('Filtrar por agente destino (ej: BackendAgent)'),
    },
    async (params) => getEvolvedSkills(params)
  );

  // ── TOOL: get_skills ─────────────────────────────────────────────────
  server.tool(
    'get_skills',
    'Retorna el catálogo de skills disponibles en JarvisDB. Usar al inicio de sesión para saber qué skills cargar según el agente activo.',
    {
      agent_name:  z.string().max(100).optional().describe('Filtrar por agente: ArchitectAgent, BackendAgent, FrontendAgent, etc.'),
      category:    z.string().max(50).optional().describe('Filtrar por categoría: backend, frontend, db, qa, devops, design, general'),
      active_only: z.boolean().default(true).describe('true = solo skills activas (default)'),
    },
    async (params) => getSkills(params)
  );

  // ── TOOL: queue_agent ────────────────────────────────────────────────
  server.tool(
    'queue_agent',
    'Encola un agente en PipelineQueue (fuente de verdad del pipeline). El OrchestratorAgent llama esto ANTES de ejecutar cada subagente.',
    {
      project_name:   z.string().max(200).describe('Nombre del proyecto'),
      agent_name:     z.string().max(100).describe('Nombre del agente: ArchitectAgent, BackendAgent, etc.'),
      agent_number:   z.number().int().min(0).max(21).optional().describe('Número del agente 0-21'),
      phase:          z.string().max(50).describe('Fase: architecture, database, backend, frontend, integration, review, devops, security'),
      priority:       z.number().int().min(1).max(10).default(5).describe('Prioridad 1-10 (1=más alta)'),
      trigger_reason: z.string().max(500).optional().describe('Razón por la que se activa este agente'),
      payload_json:   z.string().optional().describe('Payload JSON enviado al subagente'),
    },
    async (params) => queueAgent(params)
  );

  // ── TOOL: get_pipeline_status ─────────────────────────────────────────
  server.tool(
    'get_pipeline_status',
    'Retorna el estado actual del pipeline para un proyecto. Ver qué agentes están pendientes, corriendo o completados.',
    {
      project_name: z.string().max(200).describe('Nombre del proyecto'),
      last_n:       z.number().int().min(1).max(100).default(20).describe('Últimos N registros del pipeline'),
    },
    async (params) => getPipelineStatus(params)
  );
  // ── TOOL: update_queue_status ─────────────────────────────────────
  server.tool(
    'update_queue_status',
    'Actualiza el estado de un ítem en PipelineQueue. Llamar con status=running justo antes del subagente, y status=done|failed tras recibir el OUTPUT.',
    {
      queue_id:      z.number().int().describe('ID del ítem en PipelineQueue (retornado por queue_agent)'),
      status:        z.enum(['running', 'done', 'failed', 'skipped']).describe('Nuevo estado del ítem'),
      error_message: z.string().max(2000).optional().describe('Mensaje de error si status=failed'),
      output_json:   z.string().optional().describe('OUTPUT JSON retornado por el subagente'),
    },
    async (params) => updateQueueStatus(params)
  );

  // ── TOOL: get_snippets ───────────────────────────────────────────────
  server.tool(
    'get_snippets',
    'Recupera snippets de código de la biblioteca JarvisDB. Usa keywords, language, snippet_type o framework para filtrar.',
    {
      keywords:      z.string().max(500).optional().describe('Palabras clave a buscar en nombre, descripción, tags o código'),
      language:      z.string().max(50).optional().describe('Filtrar por lenguaje: csharp, javascript, typescript, sql, powershell'),
      snippet_type:  z.enum(['function', 'component', 'config', 'sql', 'migration', 'test', 'hook', 'other']).optional().describe('Tipo de snippet'),
      framework:     z.string().max(100).optional().describe('Framework: aspnetcore, react, ef-core, etc.'),
      verified_only: z.boolean().default(false).describe('true = solo snippets verificados como funcionales'),
      max_results:   z.number().int().min(1).max(50).default(20).describe('Máximo de resultados'),
    },
    async (params) => getSnippets(params)
  );

  // ── TOOL: mem_session_summary ────────────────────────────────────────
  server.tool(
    'mem_session_summary',
    'OBLIGATORIO al cerrar sesión. Guarda el resumen completo de la sesión en JarvisDB (goal, discoveries, accomplished, files). Equivalente MCP de mem_session_summary en CLAUDE.md.',
    {
      project_name: z.string().max(200).optional().default('global').describe('Nombre del proyecto activo (omitir para sesión global)'),
      goal:         z.string().max(1000).describe('Objetivo de la sesión'),
      discoveries:  z.union([z.array(z.string()), z.string()]).optional().describe('Descubrimientos importantes (array o string)'),
      accomplished: z.union([z.array(z.string()), z.string()]).optional().describe('Qué se completó (array o string)'),
      files:        z.union([z.array(z.string()), z.string()]).optional().describe('Archivos principales tocados (array o string)'),
      session_id:   z.string().max(100).optional().describe('ID de la sesión (UUID o timestamp)'),
      tokens_used:  z.number().int().optional().describe('Tokens consumidos en la sesión'),
      tokens_saved: z.number().int().default(0).describe('Tokens ahorrados vs. no usar memoria'),
    },
    async (params) => memSessionSummary(params)
  );  // ── TOOL: save_memory_note ──────────────────────────────────────────
  server.tool(
    'save_memory_note',
    'Guarda una nota de memoria contextual en JarvisDB SQL Server. Ideal para observaciones de sesión, context rápido y descubrimientos que no son lecciones formales.',
    {
      project_id:   z.number().int().optional().describe('ID del proyecto en JarvisDB (opcional — usar project_name es más fácil)'),
      project_name: z.string().max(200).optional().describe('Nombre del proyecto (auto-resuelve project_id). Preferir esto sobre project_id.'),
      category:     z.string().max(100).describe('Categoría: session, discovery, context, reminder, observation'),
      title:        z.string().max(300).describe('Título corto de la nota'),
      content:      z.string().describe('Contenido completo de la nota'),
      tags:         z.string().max(500).optional().describe('Tags CSV: jwt,auth,frontend'),
      importance:   z.number().int().min(1).max(10).default(5).describe('Importancia 1-10 (10=crítica)'),
    },
    async (params) => saveMemoryNote(params)
  );

  // ── TOOL: search_memory ──────────────────────────────────────────────
  server.tool(
    'search_memory',
    'Busca notas de memoria en JarvisDB por keywords/tags/título. Retorna las notas más relevantes ordenadas por importancia.',
    {
      keywords:    z.string().max(500).describe('Palabras clave a buscar en título, contenido o tags'),
      category:    z.string().max(100).optional().describe('Filtrar por categoría: session, discovery, context, etc.'),
      max_results: z.number().int().min(1).max(50).default(20).describe('Máximo de resultados'),
    },
    async (params) => searchMemoryTool(params)
  );

  // ── TOOL: save_error ──────────────────────────────────────────────────
  server.tool(
    'save_error',
    'Registra un error y su solución en JarvisDB ErrorHistory. Llamar cuando DebugAgent resuelve un bug para historial de soluciones reutilizables.',
    {
      error_type:    z.string().max(200).describe('Tipo de error: SqlException, NullRef, BuildError, AuthError, etc.'),
      error_message: z.string().describe('Mensaje completo del error'),
      stack_trace:   z.string().optional().describe('Stack trace completo'),
      solution:      z.string().optional().describe('Solución aplicada (null si aún no se resolvió)'),
      agent_name:    z.string().max(100).optional().describe('Agente que detectó/resolvió el error'),
      project_id:    z.number().int().optional().describe('ID del proyecto en JarvisDB'),
      tags:          z.string().max(300).optional().describe('Tags CSV: sql,auth,jwt'),
    },
    async (params) => saveError(params)
  );

  // ── TOOL: log_token_metrics ───────────────────────────────────────────
  server.tool(
    'log_token_metrics',
    'Registra métricas de consumo de tokens en JarvisDB. Llamar al finalizar cada sesión para trackear eficiencia y tokens ahorrados por memoria.',
    {
      session_id:       z.string().max(100).describe('ID único de la sesión (UUID o timestamp)'),
      agent_name:       z.string().max(100).optional().describe('Nombre del agente o sesión'),
      tokens_used:      z.number().int().describe('Tokens consumidos en la sesión'),
      tokens_saved:     z.number().int().default(0).describe('Tokens ahorrados vs. no usar memoria'),
      context_size:     z.number().int().default(0).describe('Tamaño del contexto en tokens'),
      memory_retrieval: z.boolean().default(false).describe('Si se usó recuperación de memoria en esta sesión'),
      model:            z.string().max(100).optional().describe('Modelo usado: claude-sonnet-4-5, gpt-4o, etc.'),
    },
    async (params) => logTokenMetrics(params)
  );

  // ── TOOL: log_event ──────────────────────────────────────────────────────
  server.tool(
    'log_event',
    'Registra un evento del sistema en JarvisDB SystemLogs. Para auditoría, debug y trazabilidad de operaciones de agentes.',
    {
      message:    z.string().describe('Mensaje del evento'),
      level:      z.enum(['info', 'warning', 'error', 'debug']).default('info').describe('Nivel del log'),
      category:   z.string().max(100).optional().describe('Categoría: build, deploy, auth, db, agent, etc.'),
      agent_name: z.string().max(100).optional().describe('Nombre del agente que genera el evento'),
      project_id: z.number().int().optional().describe('ID del proyecto en JarvisDB'),
      task_id:    z.number().int().optional().describe('ID de la tarea asociada'),
      details:    z.string().optional().describe('Detalles adicionales en formato JSON o texto libre'),
    },
    async (params) => logEvent(params)
  );
  // ── TOOL: get_dashboard_summary ──────────────────────────────────────────
  server.tool(
    'get_dashboard_summary',
    'Retorna un resumen del dashboard: agentes por estado + tareas por estado. Útil para que el OrchestratorAgent conozca el estado global en segundos.',
    {},
    async () => getDashboardSummary()
  );

  // ── TOOL: get_agents_status ───────────────────────────────────────────────
  server.tool(
    'get_agents_status',
    'Lista todos los agentes habilitados con su estado actual (idle/running/error), tarea actual y última actividad.',
    {},
    async () => getAgentsStatus()
  );

  // ── TOOL: get_recent_logs ─────────────────────────────────────────────────
  server.tool(
    'get_recent_logs',
    'Retorna los últimos eventos del SystemLog de JarvisDB. Útil para diagnóstico y trazabilidad.',
    {
      top:        z.number().int().min(1).max(500).default(50).describe('Número de registros a retornar'),
      level:      z.enum(['info', 'warning', 'error', 'debug']).optional().describe('Filtrar por nivel'),
      agent_name: z.string().max(100).optional().describe('Filtrar por agente específico'),
    },
    async (params) => getRecentLogs(params)
  );

  // ── TOOL: get_token_dashboard ─────────────────────────────────────────────
  server.tool(
    'get_token_dashboard',
    'Muestra el consumo total de tokens y el desglose por agente en las últimas 24h. Incluye porcentaje de ahorro.',
    {},
    async () => getTokenDashboard()
  );

  // ── TOOL: get_ci_summary ──────────────────────────────────────────────────
  server.tool(
    'get_ci_summary',
    'Resumen del historial CI/CD de un proyecto: últimos N runs con estado, cobertura, tiempos y pass rate.',
    {
      project_name: z.string().describe('Nombre del proyecto'),
      last_n:       z.number().int().min(1).max(50).default(10).describe('Número de runs recientes a mostrar'),
    },
    async (params) => getCiSummary(params)
  );

  // ── TOOL: create_task ─────────────────────────────────────────────────────
  server.tool(
    'create_task',
    'Crea una tarea en JarvisDB y la asigna a un agente. Úsalo antes de runSubagent para registrar el trabajo planificado.',
    {
      title:        z.string().max(300).describe('Título de la tarea'),
      project_name: z.string().optional().describe('Nombre del proyecto (se resuelve a ProjectId automáticamente)'),
      description:  z.string().optional().describe('Descripción detallada'),
      agent_name:   z.string().optional().describe('Nombre del agente responsable (ej: BackendAgent)'),
      priority:     z.enum(['low', 'medium', 'high', 'critical']).default('medium').describe('Prioridad'),
    },
    async (params) => createTask(params)
  );

  // ── TOOL: update_task_progress ────────────────────────────────────────────
  server.tool(
    'update_task_progress',
    'Actualiza el estado y progreso de una tarea creada con create_task. Úsalo al completar o fallar un subagente.',
    {
      task_id:  z.number().int().describe('ID de la tarea (retornado por create_task)'),
      status:   z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).describe('Nuevo estado'),
      progress: z.number().int().min(0).max(100).optional().describe('Porcentaje de avance (0-100)'),
      output:   z.string().optional().describe('Resultado o artefactos generados'),
      error:    z.string().optional().describe('Mensaje de error si status=failed'),
    },
    async (params) => updateTaskProgress(params)
  );

  // ── TOOL: update_agent_status ─────────────────────────────────────────────
  server.tool(
    'update_agent_status',
    'Actualiza el estado de un agente en la tabla Agents (idle/running/error/waiting). Los agentes lo llaman al inicio y fin de cada ejecución.',
    {
      agent_name:   z.string().describe('Nombre exacto del agente (ej: BackendAgent, DebugAgent)'),
      status:       z.enum(['idle', 'running', 'error', 'waiting', 'disabled']).describe('Nuevo estado del agente'),
      current_task: z.string().optional().describe('Descripción breve de la tarea actual (null cuando idle)'),
    },
    async (params) => updateAgentStatus(params)
  );

  // ── TOOL: save_knowledge ─────────────────────────────────────────────────
  server.tool(
    'save_knowledge',
    'Guarda o actualiza una entrada en AI_Knowledge (base de conocimiento global). Úsalo para registrar convenciones de código, decisiones de arquitectura, HOW-TOs, o cualquier referencia que deba persistir entre proyectos.',
    {
      category: z.enum(['architecture','pattern','convention','faq','howto','reference']).describe('Categoría del conocimiento'),
      title:    z.string().max(300).describe('Título único dentro de la categoría'),
      content:  z.string().describe('Contenido detallado del conocimiento (markdown permitido)'),
      tags:     z.string().optional().describe('Tags separados por coma (ej: "dotnet,jwt,seguridad")'),
    },
    async (params) => saveKnowledge(params)
  );

  // ── TOOL: get_knowledge ───────────────────────────────────────────────────
  server.tool(
    'get_knowledge',
    'Recupera entradas de AI_Knowledge. Filtra por categoría y/o palabras clave (busca en título, tags y contenido). Útil para consultar convenciones y referencias antes de escribir código.',
    {
      category: z.enum(['architecture','pattern','convention','faq','howto','reference']).optional().describe('Filtrar por categoría (omitir para todas)'),
      keywords: z.string().optional().describe('Palabras clave a buscar en título, tags y contenido'),
      top:      z.number().int().min(1).max(100).default(20).describe('Máximo de resultados (default 20)'),
    },
    async (params) => getKnowledge(params)
  );

  // Conectar y lanzar en stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[JarvisDB MCP v4.1.0] ✅ Listo. 32 tools registradas. Auth: Windows. DB: JarvisDB\n');

  // ── HTTP API para el Agent Visualizer ──────────────────────────────
  // Se inicia DENTRO del proceso MCP para reutilizar el pool ya conectado.
  try {
    const { startHttpServer } = require('./http-server');
    startHttpServer();
  } catch (e) {
    process.stderr.write(`[JarvisHTTP] Advertencia: no se pudo iniciar el HTTP server: ${e.message}\n`);
  }

  // Cerrar pool al terminar
  process.on('SIGINT',  async () => { await closePool(); process.exit(0); });
  process.on('SIGTERM', async () => { await closePool(); process.exit(0); });
}

main().catch((err) => {
  process.stderr.write('JarvisDB MCP Error: ' + err.message + '\n');
  process.exit(1);
});
