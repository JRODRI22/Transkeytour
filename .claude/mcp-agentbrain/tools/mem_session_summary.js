'use strict';
const { getPool, sql } = require('../db/connection');

/**
 * mem_session_summary — Guarda el resumen de cierre de sesión en JarvisDB.
 *
 * Equivalente MCP de `mem_session_summary({Goal, Discoveries, Accomplished, Files})`.
 * OBLIGATORIO llamar al finalizar CUALQUIER sesión de trabajo.
 * El OrchestratorAgent y CLAUDE.md lo mencionan explícitamente.
 *
 * Combina:
 *   1. Actualiza TokensSaved en ProjectStates
 *   2. Inserta MemoryNote de categoría "session" con importance=9
 */
module.exports = async function memSessionSummary(params) {
  try {
    const pool = await getPool();
    const req  = pool.request();

    req.input('ProjectName',  sql.NVarChar(200),    params.project_name  ?? 'global');
    req.input('Goal',         sql.NVarChar(1000),   params.goal);
    req.input('Discoveries',  sql.NVarChar(2000),
      Array.isArray(params.discoveries) ? JSON.stringify(params.discoveries) : (params.discoveries ?? null));
    req.input('Accomplished', sql.NVarChar(2000),
      Array.isArray(params.accomplished) ? JSON.stringify(params.accomplished) : (params.accomplished ?? null));
    req.input('Files',        sql.NVarChar(2000),
      Array.isArray(params.files) ? JSON.stringify(params.files) : (params.files ?? null));
    req.input('SessionId',    sql.NVarChar(100),    params.session_id    ?? null);
    req.input('TokensUsed',   sql.Int,              params.tokens_used   ?? null);
    req.input('TokensSaved',  sql.Int,              params.tokens_saved  ?? 0);

    const result = await req.execute('sp_SaveSessionSummary');
    const noteId = result.recordset?.[0]?.NewNoteId ?? null;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success:     true,
          note_id:     noteId,
          project:     params.project_name ?? 'global',
          message:     `Resumen de sesión guardado. Goal: "${params.goal}"`,
          saved_at:    new Date().toISOString(),
        }),
      }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
      isError: true,
    };
  }
};
