'use strict';
const { getPool, sql } = require('../db/connection');

/**
 * get_snippets — Recupera snippets de código de la biblioteca JarvisDB.
 * Combina con save_snippet para un ciclo completo de reutilización de código.
 */
module.exports = async function getSnippets(params) {
  try {
    const pool = await getPool();
    const req  = pool.request();
    req.input('Keywords',     sql.NVarChar(500), params.keywords      ?? null);
    req.input('Language',     sql.NVarChar(50),  params.language      ?? null);
    req.input('SnippetType',  sql.NVarChar(50),  params.snippet_type  ?? null);
    req.input('Framework',    sql.NVarChar(100), params.framework     ?? null);
    req.input('VerifiedOnly', sql.Bit,           params.verified_only ? 1 : 0);
    req.input('Top',          sql.Int,           params.max_results   ?? 20);

    const result = await req.execute('sp_GetSnippets');
    const rows   = result.recordset || [];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          count:   rows.length,
          snippets: rows.map(r => ({
            id:          r.Id,
            type:        r.SnippetType,
            name:        r.Name,
            description: r.Description,
            language:    r.Language,
            framework:   r.Framework,
            tags:        r.Tags,
            agent:       r.SourceAgent,
            verified:    r.IsVerified,
            uses:        r.UsageCount,
            code:        r.Code,
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
