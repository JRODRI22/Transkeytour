'use strict';
const { getPool, sql } = require('../db/connection');

async function createTask({ project_name = null, title, description = null, agent_name = null, priority = 'medium' } = {}) {
  const pool = await getPool();
  // Resolver project_id desde project_name si se provee
  let projectId = null;
  if (project_name) {
    const r = await pool.request()
      .input('PN', sql.NVarChar(200), project_name)
      .query("SELECT TOP 1 Id FROM Projects WHERE Name = @PN");
    projectId = r.recordset[0]?.Id ?? null;
  }
  const req = pool.request();
  req.input('ProjectId',   sql.Int,          projectId);
  req.input('Title',       sql.VarChar(300),  title);
  req.input('Description', sql.NVarChar(sql.MAX), description ?? null);
  req.input('AgentName',   sql.VarChar(100),  agent_name ?? null);
  req.input('Priority',    sql.VarChar(20),   priority);
  const result = await req.execute('sp_CreateTask');
  return { task_id: result.recordset[0]?.NewTaskId ?? null };
}

module.exports = createTask;
