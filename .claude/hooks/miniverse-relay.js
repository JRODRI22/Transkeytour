#!/usr/bin/env node
/**
 * miniverse-relay.js — Claude Code hook relay para pixel world
 *
 * Recibe el payload JSON de Claude Code via stdin y lo retransmite
 * al JarvisDB HTTP server (puerto 3001) que lo reenvía a Miniverse.
 *
 * Configurado en .claude/settings.json → hooks PreToolUse / PostToolUse / Stop / etc.
 *
 * Claude Code pasa el hook data en stdin como JSON:
 *  { hook_event_name, tool_name, session_id, message, ... }
 */

'use strict';

const http = require('http');

const JARVIS_PORT = process.env.JARVIS_HTTP_PORT || 3001;

const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  let payload = {};
  try {
    payload = JSON.parse(Buffer.concat(chunks).toString() || '{}');
  } catch (_) {}

  // Normalizar campos: Claude Code puede enviar hook_event_name o event
  if (!payload.event && payload.hook_event_name) {
    payload.event = payload.hook_event_name;
  }

  const body = JSON.stringify(payload);

  const req = http.request({
    hostname: 'localhost',
    port:     JARVIS_PORT,
    path:     '/api/hooks/claude-code',
    method:   'POST',
    headers: {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }, (res) => {
    res.resume(); // drain
  });

  req.on('error', () => {
    // Silencioso — el servidor puede no estar corriendo
  });

  req.setTimeout(500, () => req.destroy());
  req.end(body);
});
