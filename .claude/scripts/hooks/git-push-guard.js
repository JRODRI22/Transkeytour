#!/usr/bin/env node
/**
 * git-push-guard.js — PreToolUse hook for VS Code Copilot
 * Blocks dangerous git push operations:
 * - Checks .env is not staged
 * - Warns if commit message is empty
 * - Warns on force push to main/master
 * 
 * Input: JSON on stdin with { tool_name, tool_input }
 * Output: exit 0 = allow, exit 2 = block with message
 */

const { execSync } = require('child_process');

function getOutput(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
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
    const command = (toolInput.command || toolInput.cmd || '').toLowerCase();

    // Only intercept Bash/shell tool calls
    if (!['run_in_terminal', 'bash', 'shell'].includes(toolName)) process.exit(0);

    // Only check git push commands
    if (!command.includes('git push') && !command.includes('git commit')) process.exit(0);

    const cwd = process.cwd();
    const errors = [];
    const warnings = [];

    if (command.includes('git push')) {
      // Check .env is not staged
      const staged = getOutput('git diff --cached --name-only', cwd);
      if (staged.includes('.env') && !staged.includes('.env.example')) {
        errors.push('🚨 [git-guard] .env file is staged! Remove with: git reset HEAD .env');
      }

      // Check force push to main/master
      if (command.includes('--force') || command.includes('-f')) {
        const branch = getOutput('git rev-parse --abbrev-ref HEAD', cwd);
        if (branch === 'main' || branch === 'master') {
          errors.push(`🚨 [git-guard] Force push to ${branch} is BLOCKED. Use a feature branch.`);
        }
      }
    }

    if (command.includes('git commit')) {
      // Warn if no -m flag and no staged changes
      const staged = getOutput('git diff --cached --name-only', cwd);
      if (!staged && !command.includes('--allow-empty')) {
        warnings.push('⚠️  [git-guard] Nothing staged for commit. Run: git add <files>');
      }
    }

    if (errors.length > 0) {
      errors.forEach(e => process.stderr.write(e + '\n'));
      // Exit 2 = block the tool call in VS Code Copilot hooks
      process.exit(2);
    }

    if (warnings.length > 0) {
      warnings.forEach(w => process.stderr.write(w + '\n'));
    }

    process.exit(0);
  });
}

main();
