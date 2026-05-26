#!/usr/bin/env node
/**
 * observe.js — PreToolUse / PostToolUse hook for VS Code Copilot
 * Captures tool uses and outcomes to build observations.jsonl per project.
 * This feeds the EvolutionAgent's instinct system.
 * 
 * Storage: .claude/projects/<project-name>/observations.jsonl
 * Reads current project from .claude/state.json if it exists (fallback: "global")
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(process.cwd(), '.claude', 'state.json');
const PROJECTS_DIR = path.join(process.cwd(), '.claude', 'projects');

function getProjectName() {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return (state.project || '').replace(/[^a-zA-Z0-9_-]/g, '-') || 'global';
  } catch {
    return 'global';
  }
}

function appendObservation(observation) {
  const projectName = getProjectName();
  const projectDir = path.join(PROJECTS_DIR, projectName);

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  const obsFile = path.join(projectDir, 'observations.jsonl');
  const line = JSON.stringify(observation) + '\n';

  try {
    fs.appendFileSync(obsFile, line, 'utf8');
  } catch {
    // Non-critical: ignore write failures
  }
}

function shouldTrack(toolName) {
  // Track agent-relevant operations, skip low-value reads
  const trackedTools = [
    'run_in_terminal', 'bash', 'shell',
    'replace_string_in_file', 'multi_replace_string_in_file',
    'create_file', 'write_file',
    'semantic_search', 'grep_search',
  ];
  return trackedTools.includes(toolName);
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
    if (!shouldTrack(toolName)) process.exit(0);

    const isPost = !!data.tool_result;
    const obs = {
      ts: new Date().toISOString(),
      phase: isPost ? 'post' : 'pre',
      tool: toolName,
      // Truncate inputs to avoid junk data — max 200 chars
      input_summary: JSON.stringify(data.tool_input || {}).substring(0, 200),
    };

    if (isPost) {
      const result = data.tool_result || {};
      const resultStr = JSON.stringify(result).substring(0, 200);
      obs.outcome = resultStr.includes('error') || resultStr.includes('Error') ? 'error' : 'success';
      obs.result_summary = resultStr;
    }

    appendObservation(obs);
    process.exit(0);
  });
}

main();
