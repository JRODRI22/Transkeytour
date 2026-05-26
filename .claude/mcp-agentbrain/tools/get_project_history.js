'use strict';
const { selectProjectHistory } = require('../db/queries');

module.exports = async function getProjectHistory(params) {
  try {
    const result = await selectProjectHistory(params);
    const rows = result.recordset || [];
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          project: params.project_name,
          total_runs: rows.length,
          history: rows.map(r => ({
            agent:    r.AgentName,
            status:   r.Status,
            phase:    r.Phase,
            duration: r.DurationSeconds ? `${r.DurationSeconds}s` : null,
            tokens:   r.TokensEstimate,
            retries:  r.RetryAttempt,
            started:  r.StartedAt,
            error:    r.ErrorMessage || null,
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
