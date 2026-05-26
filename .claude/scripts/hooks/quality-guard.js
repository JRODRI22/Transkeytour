#!/usr/bin/env node
/**
 * quality-guard.js — PostToolUse hook for VS Code Copilot
 * Detects console.log in JS/TS files and hardcoded credentials after write operations.
 * 
 * Called by VS Code Copilot as PostToolUse for file write/edit operations.
 * Input: JSON on stdin with { tool_name, tool_input, tool_result }
 * Output: warnings on stderr (non-blocking)
 */

const fs = require('fs');
const path = require('path');

const CONSOLE_LOG_PATTERN = /console\.(log|debug|info|warn|error)\s*\(/g;
const CREDENTIAL_PATTERNS = [
  /password\s*=\s*["'][^"']{3,}/i,
  /api[_-]?key\s*=\s*["'][^"']{8,}/i,
  /secret\s*=\s*["'][^"']{8,}/i,
  /token\s*=\s*["'][^"']{8,}/i,
  /connectionstring\s*=\s*["'][^"']{15,}/i,
];

const JS_TS_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];

function checkFile(filePath) {
  const warnings = [];

  if (!filePath || !fs.existsSync(filePath)) return warnings;

  const ext = path.extname(filePath).toLowerCase();
  if (!JS_TS_EXTENSIONS.includes(ext)) return warnings;

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return warnings;
  }

  // Check console.log
  const consoleMatches = content.match(CONSOLE_LOG_PATTERN);
  if (consoleMatches && consoleMatches.length > 0) {
    warnings.push(`⚠️  [quality-guard] ${consoleMatches.length} console.log/debug found in ${path.basename(filePath)} — remove before production`);
  }

  // Check hardcoded credentials
  for (const pattern of CREDENTIAL_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(`🚨 [quality-guard] Possible hardcoded credential detected in ${path.basename(filePath)} — use env vars or appsettings.json`);
      break; // One warning per file is enough
    }
  }

  return warnings;
}

function main() {
  let input = '';
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    let data = {};
    try {
      data = JSON.parse(input);
    } catch {
      process.exit(0);
    }

    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};

    // Only check on file write/edit operations
    const isWriteOp = ['write_file', 'edit_file', 'replace_string_in_file',
                        'create_file', 'multi_replace_string_in_file'].includes(toolName);
    if (!isWriteOp) process.exit(0);

    const filePath = toolInput.filePath || toolInput.path || '';
    const warnings = checkFile(filePath);

    if (warnings.length > 0) {
      warnings.forEach(w => process.stderr.write(w + '\n'));
    }

    // Exit 0 = non-blocking warning (don't stop the tool)
    process.exit(0);
  });
}

main();
