'use strict';
const { getPool, sql } = require('../db/connection');

async function getDashboardSummary() {
  const pool = await getPool();
  const result = await pool.request().execute('sp_GetDashboardSummary');
  // SP retorna 2 recordsets: agentes por estado + tareas por estado
  const agentsByStatus = result.recordsets[0] ?? [];
  const tasksByStatus  = result.recordsets[1] ?? [];
  return { agentsByStatus, tasksByStatus };
}

module.exports = getDashboardSummary;
