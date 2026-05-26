'use strict';
const { selectEvolvedSkills } = require('../db/queries');

module.exports = async function getEvolvedSkills(params) {
  try {
    const result = await selectEvolvedSkills(params);
    const skills = result.recordset || [];
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          count:   skills.length,
          skills:  skills.map(s => ({
            id:              s.Id,
            skill_name:      s.SkillName,
            version:         s.Version,
            file_path:       s.FilePath,
            agents_applied:  s.AgentsApplied,
            evolution_delta: s.EvolutionDelta,
            usage_count:     s.UsageCount,
            decay_at:        s.DecayAt,
            is_active:       s.IsActive,
            created_at:      s.CreatedAt,
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
