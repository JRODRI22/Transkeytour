#!/usr/bin/env node
/**
 * destructive-guard.js — PreToolUse hook for VS Code Copilot
 * Blocks or warns on destructive commands that could cause irreversible data loss.
 *
 * Blocked (exit 2 — hard block):
 *   - Format-Volume, diskpart, format c: (disk operations)
 *   - DROP DATABASE (entire database)
 *   - DELETE FROM <table> without WHERE clause
 *   - bcdedit (bootloader edits)
 *   - DROP TABLE (Art. V Constitución — Zero Data Loss)
 *   - TRUNCATE TABLE (Art. V Constitución — Zero Data Loss)
 *
 * Warned (exit 1 — soft warn, user can proceed):
 *   - rm -rf / Remove-Item -Recurse -Force (non-temp paths)
 *   - dotnet ef database drop
 *   - docker system prune
 *
 * Input:  JSON on stdin { tool_name, tool_input }
 * Output: exit 0 = allow | exit 1 = warn | exit 2 = block
 */

function main() {
  let input = '';
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    let data = {};
    try { data = JSON.parse(input); } catch { process.exit(0); }

    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};

    // Only intercept shell/terminal commands
    if (!['run_in_terminal', 'bash', 'shell'].includes(toolName)) process.exit(0);

    const raw = (toolInput.command || toolInput.cmd || toolInput.input || '');
    const cmd = raw.toLowerCase();

    if (!cmd) process.exit(0);

    // ─── HARD BLOCKS ─────────────────────────────────────────────────────────

    // Disk formatting / low-level disk operations
    if (/\bformat-volume\b/.test(cmd) || /\bdiskpart\b/.test(cmd) || /\bformat\s+[a-z]:\b/.test(cmd)) {
      output('block', '🛑 [destructive-guard] Operación de disco bloqueada.',
        `Comando: ${raw}\n\nLas operaciones de formato de disco son irreversibles.\nSi necesitas ejecutar esto, hazlo MANUALMENTE en una terminal separada.`);
      process.exit(2);
    }

    // Bootloader edits
    if (/\bbcdedit\b/.test(cmd)) {
      output('block', '🛑 [destructive-guard] Edición de bootloader bloqueada.',
        `Comando: ${raw}\n\nbcdedit puede dejar el sistema sin arranque si se usa incorrectamente.\nEjecuta manualmente si es necesario.`);
      process.exit(2);
    }

    // DROP DATABASE
    if (/drop\s+database\b/.test(cmd)) {
      output('block', '🛑 [destructive-guard] DROP DATABASE bloqueado.',
        `Comando: ${raw}\n\nEliminar una base de datos es IRREVERSIBLE.\nSi necesitas esto, confirma explícitamente con el usuario primero.`);
      process.exit(2);
    }

    // DELETE FROM without WHERE (regex: DELETE FROM <something> NOT followed by WHERE)
    if (/delete\s+from\s+\w+\s*;/.test(cmd) || /delete\s+from\s+\w+\s*$/.test(cmd)) {
      output('block', '🛑 [destructive-guard] DELETE sin WHERE bloqueado.',
        `Comando: ${raw}\n\nUn DELETE sin cláusula WHERE borra TODA la tabla.\nAgrega WHERE o ejecuta manualmente si realmente quieres vaciar la tabla.`);
      process.exit(2);
    }

    // ─── SOFT WARNINGS ───────────────────────────────────────────────────────

    // rm -rf (skip safe temp paths)
    const rmRfMatch = /\brm\s+-[^\s]*r[^\s]*f|remove-item\s+.*-recurse\s+.*-force|remove-item\s+.*-force\s+.*-recurse/.test(cmd);
    if (rmRfMatch) {
      const safePaths = ['/tmp', '/temp', 'node_modules', 'bin/', 'obj/', '\\bin\\', '\\obj\\', '.git/objects/pack', '__pycache__'];
      const isSafe = safePaths.some(p => cmd.includes(p));
      if (!isSafe) {
        output('warn', '⚠️ [destructive-guard] Eliminación recursiva detectada.',
          `Comando: ${raw}\n\nEsto eliminará archivos/carpetas recursivamente de forma irreversible.\nVerifica que la ruta sea correcta antes de continuar.`);
        // exit 1 = warn but allow in most Copilot hook implementations
        process.exit(1);
      }
    }

    // DROP TABLE — BLOQUEADO: pérdida irreversible de datos (Art. V Constitución)
    if (/drop\s+table\b/.test(cmd)) {
      output('block', '🛑 [destructive-guard] DROP TABLE BLOQUEADO.',
        `Comando: ${raw}\n\nDROP TABLE elimina la tabla y TODOS sus datos permanentemente (irreversible).\nEsta acción está BLOQUEADA por la Constitución del proyecto (Art. V — Zero Data Loss).\n\nAlternativas:\n  • Soft delete: agregar columna IsDeleted y filtrar en queries\n  • Renombrar tabla: sp_rename 'OldTable', 'OldTable_backup'\n  • Backup explícito antes: SELECT * INTO OldTable_backup FROM OldTable`);
      process.exit(2);
    }

    // TRUNCATE TABLE — BLOQUEADO: pérdida masiva de datos (Art. V Constitución)
    if (/truncate\s+table\b/.test(cmd)) {
      output('block', '🛑 [destructive-guard] TRUNCATE TABLE BLOQUEADO.',
        `Comando: ${raw}\n\nTRUNCATE TABLE vacía TODOS los registros sin posibilidad de rollback.\nEsta acción está BLOQUEADA por la Constitución del proyecto (Art. V — Zero Data Loss).\n\nAlternativas:\n  • DELETE con WHERE: eliminar registros específicos con condición\n  • Soft delete: UPDATE tabla SET IsDeleted = 1 WHERE <condición>\n  • Si es seed: usar un script de seed controlado con verificación previa`);
      process.exit(2);
    }

    // dotnet ef database drop
    if (/dotnet\s+ef\s+database\s+drop/.test(cmd)) {
      output('warn', '⚠️ [destructive-guard] dotnet ef database drop detectado.',
        `Comando: ${raw}\n\nEsto eliminará la base de datos de desarrollo.\nAsegúrate de que no hay datos importantes y de que puedes reconstruirla.`);
      process.exit(1);
    }

    // docker system prune
    if (/docker\s+system\s+prune/.test(cmd)) {
      output('warn', '⚠️ [destructive-guard] docker system prune detectado.',
        `Comando: ${raw}\n\nEsto eliminará imágenes, contenedores detenidos y volúmenes no utilizados.\nPuede liberar espacio pero también borrar datos de volúmenes de desarrollo.`);
      process.exit(1);
    }

    // git clean -fd (removes untracked files)
    if (/git\s+clean\s+.*-f/.test(cmd)) {
      output('warn', '⚠️ [destructive-guard] git clean -f detectado.',
        `Comando: ${raw}\n\nEsto eliminará archivos no rastreados por git (irreversible).\nEjecuta "git clean -n" primero para ver qué se eliminará.`);
      process.exit(1);
    }

    process.exit(0);
  });
}

function output(level, title, detail) {
  const icon = level === 'block' ? '🛑' : '⚠️';
  console.log(JSON.stringify({
    decision: level === 'block' ? 'block' : 'warn',
    reason: `${title}\n\n${detail}`
  }));
}

main();
