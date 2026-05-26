'use strict';
const { insertLesson } = require('../db/queries');

module.exports = async function saveLesson(params) {
  // Validación: scope='project' sin project_name es un error de datos
  if (params.scope === 'project' && !params.project_name) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        success: false,
        error: 'project_name es OBLIGATORIO cuando scope="project". Pasa el nombre exacto del proyecto activo (ej: "DeUnaCR", "TaskStars").',
        hint:   'Si la lección aplica a todos los proyectos, usa scope="global" o scope="stack".',
      }) }],
      isError: true,
    };
  }

  try {
    const newId = await insertLesson(params);
    const projectLabel = params.project_name || '(global)';
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          id:      newId,
          message: `Lección guardada: [${params.severity.toUpperCase()}] ${params.title}`,
          scope:   params.scope,
          project: projectLabel,
          warning: (!params.project_name && params.scope !== 'global')
            ? 'project_name no fue provisto — lección guardada como global. Si es específica de un proyecto, recrea con project_name correcto.'
            : undefined,
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
