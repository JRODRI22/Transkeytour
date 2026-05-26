'use strict';
const { getPool, sql } = require('../db/connection');

/**
 * get_knowledge — Consulta entradas de AI_Knowledge.
 * Filtra por categoría y/o palabras clave en el título, tags y contenido.
 */
module.exports = async function getKnowledge({ category = null, keywords = null, top = 20 } = {}) {
  const pool = await getPool();
  const req  = pool.request();
  req.input('Category', sql.NVarChar(100), category ?? null);
  req.input('Keywords', sql.NVarChar(300), keywords ?? null);
  req.input('Top',      sql.Int,           Math.min(Math.max(+top || 20, 1), 100));
  const result = await req.execute('sp_GetKnowledge');
  const items = result.recordset ?? [];
  return { content: [{ type: 'text', text: JSON.stringify({ success: true, count: items.length, items }) }] };
};
