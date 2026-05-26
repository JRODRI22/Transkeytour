'use strict';
const { selectStatisticsV2 } = require('../db/queries');

module.exports = async function getStatistics(params) {
  try {
    const result = await selectStatisticsV2(params);

    // Recordset[0] = general stats
    const stats = result.recordsets[0]?.[0] || {};
    // Recordset[1] = token metrics (30 días)
    const tokens = result.recordsets[1]?.[0] || {};
    // Recordset[2] = top agents
    const topAgents = result.recordsets[2] || [];
    // Recordset[3] = lessons by type
    const lessonsByType = result.recordsets[3] || [];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          scope:   params.project_name || 'global',
          stats: {
            total_lessons:         stats.TotalLessons          || 0,
            total_patterns:        stats.TotalPatterns         || 0,
            total_decisions:       stats.TotalDecisions        || 0,
            total_snippets:        stats.TotalSnippets         || 0,
            total_memory_notes:    stats.TotalMemoryNotes       || 0,
            active_projects:       stats.ActiveProjects        || 0,
            total_tokens_saved:    stats.TotalTokensSavedProjects || 0,
            successful_runs:       stats.SuccessfulRuns        || 0,
            failed_runs:           stats.FailedRuns            || 0,
            active_skills:         stats.ActiveSkills          || 0,
            active_evolved_skills: stats.ActiveEvolvedSkills   || 0,
            most_used_pattern:     stats.MostUsedPattern       || null,
          },
          token_metrics_30d: {
            sessions_tracked:      tokens.SessionsTracked      || 0,
            total_tokens_consumed: tokens.TotalTokensConsumed  || 0,
            total_tokens_saved:    tokens.TotalTokensSavedMetrics || 0,
            avg_tokens_per_session:tokens.AvgTokensPerSession  || 0,
            sessions_using_memory: tokens.SessionsUsingMemory  || 0,
          },
          top_agents:     topAgents.map(a => ({
            agent:    a.AgentName,
            runs:     a.RunCount,
            success:  a.SuccessCount,
            failed:   a.FailCount,
            avg_sec:  a.AvgDurationSec ? Math.round(a.AvgDurationSec) : null,
          })),
          lessons_by_type: lessonsByType.map(l => ({ type: l.LessonType, count: l.Count })),
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
