'use strict';
const { getPool, sql } = require('../db/connection');

async function updateTaskProgress({ task_id, status, progress = null, output = null, error = null } = {}) {
  const pool = await getPool();
  const req  = pool.request();
  req.input('TaskId',   sql.Int,             task_id);
  req.input('Status',   sql.VarChar(50),     status);
  req.input('Progress', sql.Int,             progress ?? null);
  req.input('Output',   sql.NVarChar(sql.MAX), output ?? null);
  req.input('Error',    sql.NVarChar(sql.MAX), error  ?? null);
  const result = await req.execute('sp_UpdateTaskProgress');
  return { updated: result.rowsAffected?.[0] ?? 0 };
}

module.exports = updateTaskProgress;
