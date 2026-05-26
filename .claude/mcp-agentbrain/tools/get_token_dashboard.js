'use strict';
const { getPool } = require('../db/connection');

async function getTokenDashboard() {
  const pool = await getPool();
  const result = await pool.request().execute('sp_GetTokenDashboard');
  const totals     = result.recordsets[0]?.[0] ?? {};
  const byAgent24h = result.recordsets[1]  ?? [];
  return { totals, byAgent24h };
}

module.exports = getTokenDashboard;
