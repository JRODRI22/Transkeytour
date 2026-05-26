'use strict';
const { insertMemoryNote } = require('../db/queries');

module.exports = async function saveMemoryNote(params) {
  try {
    const newId = await insertMemoryNote(params);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success:    true,
          id:         newId,
          message:    `Nota de memoria guardada: [${params.category}] ${params.title}`,
          importance: params.importance || 5,
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
