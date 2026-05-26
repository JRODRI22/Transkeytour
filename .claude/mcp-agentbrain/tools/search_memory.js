'use strict';
const { searchMemory } = require('../db/queries');

module.exports = async function searchMemoryTool(params) {
  try {
    const result = await searchMemory(params);
    const notes  = result.recordset;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          count:   notes.length,
          notes:   notes.map(n => ({
            id:         n.Id,
            category:   n.Category,
            title:      n.Title,
            content:    n.Content,
            tags:       n.Tags,
            importance: n.Importance,
            createdAt:  n.CreatedAt,
          })),
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
