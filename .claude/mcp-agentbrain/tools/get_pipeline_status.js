'use strict';
const { getPool, sql } = require('../db/connection');

module.exports = async function getPipelineStatus(params) {
  try {
    const pool = await getPool();
    const req  = pool.request();
    req.input('ProjectName', sql.NVarChar(200), params.project_name);
    req.input('LastN',       sql.Int,           params.last_n ?? 20);

    const result = await req.execute('sp_GetPipelineStatus');
    const items  = result.recordset || [];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success:      true,
          project_name: params.project_name,
          count:        items.length,
          pipeline:     items.map(r => ({
            id:             r.Id,
            agent:          r.AgentName,
            phase:          r.Phase,
            status:         r.Status,
            priority:       r.Priority,
            trigger:        r.TriggerReason,
            queued_at:      r.QueuedAt,
            started_at:     r.StartedAt,
            completed_at:   r.CompletedAt,
            retry_count:    r.RetryCount,
            error:          r.ErrorMessage,
          })),
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
