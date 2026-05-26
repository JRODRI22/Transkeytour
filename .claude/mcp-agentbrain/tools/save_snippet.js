'use strict';
const { insertSnippet } = require('../db/queries');

module.exports = async function saveSnippet(params) {
  try {
    const id = await insertSnippet(params);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          snippet_id: id,
          message: `Snippet guardado: "${params.name}" [${params.language}/${params.snippet_type}]`,
          verified: params.is_verified || false,
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
