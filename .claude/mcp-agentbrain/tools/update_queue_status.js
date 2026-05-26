'use strict';
const { getPool, sql } = require('../db/connection');

/**
 * update_queue_status — Marca un ítem de PipelineQueue como running/done/failed.
 * El OrchestratorAgent llama esto:
 *   - status="running"  → justo antes de runSubagent
 *   - status="done"     → al recibir OUTPUT exitoso del subagente
 *   - status="failed"   → al recibir error
 *   - status="skipped"  → si el gate fue rechazado
 */
module.exports = async function updateQueueStatus(params) {
  try {
    const pool = await getPool();
    const req  = pool.request();
    req.input('QueueId',      sql.Int,              params.queue_id);
    req.input('Status',       sql.NVarChar(20),     params.status);
    req.input('ErrorMessage', sql.NVarChar(2000),   params.error_message ?? null);
    req.input('OutputJson',   sql.NVarChar(sql.MAX),params.output_json   ?? null);

    const result = await req.execute('sp_UpdateQueueStatus');
    const rows   = result.recordset?.[0]?.RowsAffected ?? 0;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success:      rows > 0,
          queue_id:     params.queue_id,
          status:       params.status,
          rows_updated: rows,
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
