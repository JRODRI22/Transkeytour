'use strict';
const { upsertProjectState } = require('../db/queries');

module.exports = async function syncProjectState(params) {
  try {
    await upsertProjectState(params);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Estado sincronizado: "${params.project_name}" → fase "${params.active_phase || 'N/A'}"`,
          last_agent: params.last_agent || null,
          tokens_saved: params.tokens_saved || 0,
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
