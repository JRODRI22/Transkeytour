'use strict';
const { insertError } = require('../db/queries');

module.exports = async function saveError(params) {
  try {
    const result  = await insertError(params);
    const newId   = result.recordset[0]?.NewErrorId;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success:     true,
          id:          newId,
          message:     `Error registrado: [${params.error_type}] ${params.error_message.substring(0, 100)}`,
          hasSolution: !!params.solution,
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
