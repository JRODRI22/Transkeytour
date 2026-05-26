'use strict';
const { selectContext } = require('../db/queries');

/**
 * get_context — Herramienta clave para ahorro de tokens.
 * Retorna contexto relevante (lecciones + patrones) para la tarea actual.
 * Usado por OrchestratorAgent al inicio de cada sesión ANTES de cargar CLAUDE-*.md.
 * Si retorna >= 3 resultados relevantes → NO cargar archivos Markdown completos.
 */
module.exports = async function getContext(params) {
  try {
    const result = await selectContext(params);

    const lessons  = result.recordsets[0] || [];
    const patterns = result.recordsets[1] || [];

    // Calcular tokens estimados ahorrados (cargar CLAUDE-*.md completos ≈ 800-2000 tokens)
    // vs. este contexto compacto ≈ 100-300 tokens
    const contextTokens = Math.round((JSON.stringify({ lessons, patterns }).length) / 4);
    const fullFilesTokens = 1200; // estimado de cargar los 4 CLAUDE-*.md
    const tokensSaved = Math.max(0, fullFilesTokens - contextTokens);

    // Formatear respuesta compacta
    const formattedLessons = lessons.map(l => ({
      type:    l.ResultType,
      kind:    l.LessonType,
      title:   l.Title,
      summary: l.Description?.substring(0, 150),
      fix:     l.Fix?.substring(0, 100) || null,
      tags:    l.Tags || null,
      age:     daysSince(l.CreatedAt),
    }));

    const formattedPatterns = patterns.map(p => ({
      id:         p.PatternId,
      name:       p.Name,
      lang:       p.Language,
      summary:    p.Description?.substring(0, 120),
      why:        p.WhyItWorks?.substring(0, 100) || null,
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          lessons_count:    formattedLessons.length,
          patterns_count:   formattedPatterns.length,
          tokens_saved:     tokensSaved,
          recommendation:   formattedLessons.length >= 3
            ? 'SKIP_CLAUDE_FILES: contexto suficiente desde DB'
            : 'LOAD_CLAUDE_FILES: proyecto nuevo o sin contexto suficiente en DB',
          lessons:  formattedLessons,
          patterns: formattedPatterns,
        }),
      }],
    };
  } catch (err) {
    // Si la DB falla, el sistema debe continuar con CLAUDE-*.md normales
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: err.message,
          recommendation: 'LOAD_CLAUDE_FILES: DB no disponible — usar archivos locales',
        }),
      }],
    };
  }
};

function daysSince(date) {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
