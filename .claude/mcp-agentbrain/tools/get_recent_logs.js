'use strict';
const { getPool, sql } = require('../db/connection');

async function getRecentLogs({ top = 50, level = null, agent_name = null } = {}) {
  try {
    const pool = await getPool();
    const req  = pool.request();
    req.input('Top',       sql.Int,          Math.min(top, 500));
    req.input('Level',     sql.VarChar(20),  level      ?? null);
    req.input('AgentName', sql.VarChar(100), agent_name ?? null);
    const result = await req.execute('sp_GetRecentLogs');
    const logs = result.recordset ?? [];
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, count: logs.length, logs }),
      }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
      isError: true,
    };
  }
}

module.exports = getRecentLogs;
