'use strict';
const { getPool, sql } = require('../db/connection');

async function updateAgentStatus({ agent_name, status, current_task = null } = {}) {
  const pool = await getPool();
  // Resolver agent_id desde agent_name
  const r = await pool.request()
    .input('Name', sql.NVarChar(100), agent_name)
    .query("SELECT TOP 1 Id FROM Agents WHERE Name = @Name");
  const agentId = r.recordset[0]?.Id;
  if (!agentId) return { updated: 0, note: `Agent '${agent_name}' not found in Agents table` };

  const req = pool.request();
  req.input('AgentId', sql.Int,              agentId);
  req.input('Status',  sql.VarChar(50),      status);
  req.input('Task',    sql.NVarChar(sql.MAX), current_task ?? null);
  await req.execute('sp_UpdateAgentStatus');
  return { updated: 1, agent_id: agentId };
}

module.exports = updateAgentStatus;
