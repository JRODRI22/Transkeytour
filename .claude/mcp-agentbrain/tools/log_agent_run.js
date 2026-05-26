'use strict';
const { insertAgentHistory, checkRecentAgentStart } = require('../db/queries');

/** Ventana de deduplicación: ignorar 'started' duplicado para el mismo agente+proyecto dentro de N segundos */
const DEDUP_WINDOW_SECONDS = 60;

module.exports = async function logAgentRun(params) {
  try {
    // ── Guard básico ─────────────────────────────────────────────────────────
    if (!params.agent_name?.trim() || !params.project_name?.trim()) {
      return {
        content: [{ type: 'text', text: JSON.stringify({
          success: false,
          error:   'agent_name y project_name son OBLIGATORIOS en log_agent_run.',
          hint:    'Ejemplo: log_agent_run({ agent_name: "BackendAgent", project_name: "DeUnaCR", status: "started", phase: "BE" })',
        }) }],
        isError: true,
      };
    }

    // ── Deduplicación: evitar entradas 'started' duplicadas en menos de 60s ──
    if (params.status === 'started') {
      const recent = await checkRecentAgentStart(
        params.agent_name, params.project_name, DEDUP_WINDOW_SECONDS
      );
      if (recent) {
        return {
          content: [{ type: 'text', text: JSON.stringify({
            success:      true,
            deduplicated: true,
            message:      `${params.agent_name} ya tiene un 'started' reciente (<${DEDUP_WINDOW_SECONDS}s) en "${params.project_name}" — entrada omitida para evitar duplicados.`,
            existing_run: recent.RunId,
            hint:         'Llama log_agent_run con status="completed" o status="failed" cuando el agente termine.',
          }) }],
        };
      }
    }

    // ── Insert normal ─────────────────────────────────────────────────────────
    const id = await insertAgentHistory(params);
    const verb = params.status === 'started'   ? 'iniciado'   :
                 params.status === 'completed' ? 'completado' :
                 params.status === 'failed'    ? 'fallido'    : 'en gate';

    return {
      content: [{ type: 'text', text: JSON.stringify({
        success:    true,
        history_id: id,
        message:    `${params.agent_name} ${verb} en proyecto "${params.project_name}"`,
        status:     params.status,
        phase:      params.phase || null,
      }) }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
      isError: true,
    };
  }
};
