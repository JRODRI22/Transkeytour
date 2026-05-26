'use strict';
const { getPool, sql } = require('../db/connection');

module.exports = async function getSkills(params) {
  try {
    const pool = await getPool();
    const req  = pool.request();
    req.input('AgentName',  sql.NVarChar(100), params.agent_name  || null);
    req.input('Category',   sql.NVarChar(50),  params.category    || null);
    req.input('ActiveOnly', sql.Bit,           params.active_only !== false ? 1 : 0);

    const result = await req.execute('sp_GetSkillsForAgent');
    const skills = result.recordset || [];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          count:   skills.length,
          skills:  skills.map(s => ({
            id:          s.Id,
            skill_name:  s.SkillName,
            description: s.Description,
            file_path:   s.FilePath,
            agents:      s.AgentsCsv || 'all',
            category:    s.Category,
            is_active:   s.IsActive,
            updated_at:  s.UpdatedAt,
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
