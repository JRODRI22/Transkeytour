'use strict';
const { insertTokenMetrics } = require('../db/queries');

module.exports = async function logTokenMetrics(params) {
  try {
    await insertTokenMetrics(params);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success:    true,
          message:    `Métricas registradas: ${params.tokens_used} tokens usados, ${params.tokens_saved || 0} ahorrados`,
          session_id: params.session_id,
          agent:      params.agent_name || 'unknown',
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
