'use strict';
const { getPool, sql } = require('../db/connection');

/**
 * save_knowledge — Guarda o actualiza una entrada en AI_Knowledge.
 * La tabla sirve como base de conocimiento global del sistema
 * (convenciones, arquitectura, referencias, HOW-TOs).
 */
module.exports = async function saveKnowledge({ category, title, content, tags = null } = {}) {
  if (!category || !title || !content) {
    return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'category, title, and content are required' }) }] };
  }

  const pool = await getPool();
  const req  = pool.request();
  req.input('Category', sql.NVarChar(100),      category);
  req.input('Title',    sql.NVarChar(300),      title);
  req.input('Content',  sql.NVarChar(sql.MAX),  content);
  req.input('Tags',     sql.NVarChar(500),      tags ?? null);
  const result = await req.execute('sp_SaveKnowledge');
  const saved = result.recordset?.[0]?.AffectedRows ?? 1;
  return { content: [{ type: 'text', text: JSON.stringify({ success: true, saved }) }] };
};
