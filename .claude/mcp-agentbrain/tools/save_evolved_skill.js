'use strict';
const { insertEvolvedSkill } = require('../db/queries');

module.exports = async function saveEvolvedSkill(params) {
  try {
    const id = await insertEvolvedSkill(params);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success:    true,
          id,
          skill_name: params.skill_name,
          version:    params.version || 1,
          file_path:  params.file_path,
          message:    `EvolvedSkill '${params.skill_name}' v${params.version || 1} guardada en JarvisDB.`,
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
