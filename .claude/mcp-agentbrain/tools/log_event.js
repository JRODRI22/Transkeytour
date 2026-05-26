'use strict';
const { insertSystemLog } = require('../db/queries');

module.exports = async function logEvent(params) {
  try {
    await insertSystemLog(params);
    const preview = params.message.substring(0, 100);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Evento registrado: [${params.level || 'info'}/${params.category || 'general'}] ${preview}`,
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
