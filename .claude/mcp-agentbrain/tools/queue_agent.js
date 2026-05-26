'use strict';
const { getPool, sql } = require('../db/connection');

module.exports = async function queueAgent(params) {
  try {
    const pool = await getPool();
    const req  = pool.request();
    req.input('ProjectName',   sql.NVarChar(200), params.project_name);
    req.input('AgentName',     sql.NVarChar(100), params.agent_name);
    req.input('AgentNumber',   sql.TinyInt,       params.agent_number   ?? null);
    req.input('Phase',         sql.NVarChar(50),  params.phase);
    req.input('Priority',      sql.TinyInt,       params.priority       ?? 5);
    req.input('TriggerReason', sql.NVarChar(500), params.trigger_reason ?? null);
    req.input('PayloadJson',   sql.NVarChar(sql.MAX), params.payload_json ?? null);

    const result = await req.execute('sp_QueueAgent');
    const queueId = result.recordset?.[0]?.NewQueueId ?? null;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, queue_id: queueId }),
      }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
      isError: true,
    };
  }
};
