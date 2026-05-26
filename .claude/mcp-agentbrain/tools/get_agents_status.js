'use strict';
const { getPool } = require('../db/connection');

async function getAgentsStatus() {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('sp_GetAgentsStatus');
    const agents = result.recordset ?? [];
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, count: agents.length, agents }),
      }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
      isError: true,
    };
  }
}

module.exports = getAgentsStatus;
