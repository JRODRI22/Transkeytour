'use strict';
const { getPool, sql } = require('../db/connection');

async function getCiSummary({ project_name, last_n = 10 } = {}) {
  const pool = await getPool();
  const req  = pool.request();
  req.input('ProjectName', sql.NVarChar(200), project_name);
  req.input('LastN',       sql.TinyInt,       Math.min(last_n, 50));
  const result = await req.execute('sp_GetCISummary');
  const runs    = result.recordsets[0] ?? [];
  const summary = result.recordsets[1]?.[0] ?? {};
  return { runs, summary };
}

module.exports = getCiSummary;
