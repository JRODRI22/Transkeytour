'use strict';
const { insertDecision } = require('../db/queries');

module.exports = async function saveDecision(params) {
  try {
    const adrId = await insertDecision(params);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          adr_id: adrId,
          message: `Decisión guardada: ${adrId} — ${params.title} [${params.status || 'accepted'}]`,
          project: params.project_name || 'global',
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
