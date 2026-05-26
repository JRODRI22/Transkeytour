'use strict';
const { insertPattern } = require('../db/queries');

module.exports = async function savePattern(params) {
  try {
    const patternId = await insertPattern(params);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          pattern_id: patternId,
          message: `Patrón guardado: ${patternId} — ${params.name} (${params.language})`,
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
