/**
 * db/connection.js — Pool de conexión a SQL Server
 * Usa Windows Authentication (msnodesqlv8) — sin credenciales en texto plano.
 * El pool se reutiliza para todas las herramientas MCP del servidor.
 */

'use strict';

const sql = require('mssql/msnodesqlv8');

const server   = process.env.JARVISDB_SERVER   || '127.0.0.1,1433';
const database = process.env.JARVISDB_DATABASE || 'JarvisDB';

const config = {
  connectionString:
    `Driver={ODBC Driver 18 for SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`,
  pool: {
    max:               5,
    min:               1,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 10000,
  requestTimeout:    30000,
};

/** @type {import('mssql').ConnectionPool | null} */
let pool = null;

/** Número máximo de reintentos de conexión */
const MAX_RETRIES = 3;

/**
 * Obtiene (o crea) el pool de conexión con auto-reconexión.
 * Maneja pool desconectados o en estado inválido automáticamente.
 * @returns {Promise<import('mssql').ConnectionPool>}
 */
async function getPool() {
  // Pool válido y conectado → reusar
  if (pool && pool.connected && !pool.connecting) return pool;

  // Pool en estado inválido → limpiar antes de reconectar
  if (pool && !pool.connected) {
    try { await pool.close(); } catch (_) { /* ignorar error al cerrar */ }
    pool = null;
  }

  // Reconectar con reintentos exponenciales
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      pool = await sql.connect(config);
      if (attempt > 1) {
        process.stderr.write(`[JarvisDB] Pool reconectado en intento ${attempt}\n`);
      }
      return pool;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        const delay = attempt * 1000; // 1s, 2s, 3s
        process.stderr.write(`[JarvisDB] Conexión fallida (intento ${attempt}), reintentando en ${delay}ms...\n`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw new Error(`No se pudo conectar a SQL Server tras ${MAX_RETRIES} intentos: ${lastError?.message}`);
}

/**
 * Cierra el pool de conexión (llamar en SIGINT/SIGTERM).
 */
async function closePool() {
  if (pool) {
    try { await pool.close(); } catch (_) { /* ignorar */ }
    pool = null;
  }
}

module.exports = { getPool, closePool, sql };
