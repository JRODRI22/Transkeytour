/**
 * seed-skills.js
 * Puebla la tabla Skills en JarvisDB con todas las skills del sistema.
 * Usa los datos del skills-registry.md para asignar agentes a cada skill.
 * Ejecutar: node seed-skills.js
 */
'use strict';

const path  = require('path');
const fs    = require('fs');
const { getPool, sql, closePool } = require('./db/connection');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const SKILLS_REGISTRY = path.join(__dirname, '..', 'skills-registry.md');

// Mapping skill -> agentes (del skills-registry.md)
const agentMap = {
  'brainstorming':               'ArchitectAgent,FeatureDevAgent',
  'writing-plans':               'ArchitectAgent',
  'sql-server-best-practices':   'DatabaseAgent',
  'systematic-debugging':        'DatabaseAgent,BackendAgent,IntegrationAgent,DebugAgent,FeatureDevAgent,TestMasterAgent',
  'frontend-pro':                'FrontendAgent,IntegrationAgent,DesignStudioAgent',
  'requesting-code-review':      'ReviewAgent',
  'receiving-code-review':       'ReviewAgent',
  'verification-before-completion': 'DevOpsAgent,CIPipelineAgent',
  'test-driven-development':     'QAAgent,FeatureDevAgent,TestMasterAgent',
  'doc-coauthoring':             'DocsAgent',
  'api-discovery':               'APIDiscoveryAgent',
  '3d-animation-design':         'DesignStudioAgent',
  'ui-ux-pro-max':               'DesignStudioAgent',
  'frontend-design':             'FrontendAgent,DesignStudioAgent',
  'frontend-patterns':           'FrontendAgent',
  'vercel-react-best-practices': 'FrontendAgent',
  'supabase-postgres-best-practices': 'DatabaseAgent',
};

// Mapping skill -> category
const categoryMap = {
  'sql-server-best-practices':   'db',
  'supabase-postgres-best-practices': 'db',
  'systematic-debugging':        'general',
  'verification-before-completion': 'general',
  'test-driven-development':     'qa',
  'webapp-testing':              'qa',
  'frontend-pro':                'frontend',
  'frontend-design':             'frontend',
  'frontend-patterns':           'frontend',
  'vercel-react-best-practices': 'frontend',
  'vercel-composition-patterns': 'frontend',
  'vercel-react-native-skills':  'frontend',
  'next-best-practices':         'frontend',
  'next-cache-components':       'frontend',
  'next-upgrade':                'frontend',
  'ui-ux-pro-max':               'design',
  '3d-animation-design':         'design',
  'canvas-design':               'design',
  'ckm-design':                  'design',
  'ckm-banner-design':           'design',
  'ckm-slides':                  'design',
  'ckm-ui-styling':              'design',
  'theme-factory':               'design',
  'algorithmic-art':             'design',
  'doc-coauthoring':             'docs',
  'docx':                        'docs',
  'pdf':                         'docs',
  'pptx':                        'docs',
  'xlsx':                        'docs',
  'internal-comms':              'docs',
  'writing-plans':               'planning',
  'brainstorming':               'planning',
  'dispatching-parallel-agents': 'planning',
  'executing-plans':             'planning',
  'subagent-driven-development': 'planning',
  'using-git-worktrees':         'devops',
  'finishing-a-development-branch': 'devops',
  'deploy-to-vercel':            'devops',
  'azure-deploy':                'devops',
  'azure-prepare':               'devops',
  'azure-validate':              'devops',
  'azure-diagnostics':           'devops',
  'azure-cost-optimization':     'devops',
  'azure-compliance':            'devops',
  'azure-compute':               'devops',
  'azure-storage':               'devops',
  'azure-messaging':             'devops',
  'azure-upgrade':               'devops',
  'azure-cloud-migrate':         'devops',
  'azure-aigateway':             'devops',
  'azure-ai':                    'devops',
  'azure-kusto':                 'devops',
  'azure-quotas':                'devops',
  'azure-rbac':                  'devops',
  'azure-resource-lookup':       'devops',
  'azure-resource-visualizer':   'devops',
  'appinsights-instrumentation': 'devops',
  'security-auditor':            'security',
  'mcp-builder':                 'backend',
  'claude-api':                  'backend',
  'agent-browser':               'backend',
  'electron':                    'backend',
  'api-discovery':               'backend',
  'requesting-code-review':      'general',
  'receiving-code-review':       'general',
  'skill-authoring':             'general',
  'skill-creator':               'general',
  'using-superpowers':           'general',
};

async function extractDescription(skillDir) {
  const skillMd = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMd)) return '(No description)';
  try {
    const content = fs.readFileSync(skillMd, 'utf-8');
    // Try to find description in frontmatter
    const frontmatterMatch = content.match(/^---[\s\S]*?description:\s*["']?(.+?)["']?\n/m);
    if (frontmatterMatch) return frontmatterMatch[1].trim().slice(0, 900);
    // Try first non-empty, non-# line after frontmatter
    const lines = content.replace(/^---[\s\S]*?---/m, '').split('\n');
    for (const line of lines) {
      const clean = line.replace(/^#+\s*/, '').trim();
      if (clean.length > 10) return clean.slice(0, 900);
    }
    return skillDir.split(path.sep).pop();
  } catch { return '(Error reading skill)'; }
}

async function main() {
  console.log('Seeding Skills table...');
  
  const skillDirs = fs.readdirSync(SKILLS_DIR)
    .filter(d => fs.statSync(path.join(SKILLS_DIR, d)).isDirectory());

  const pool = await getPool();
  let inserted = 0, updated = 0, skipped = 0;

  for (const skillName of skillDirs) {
    const skillDir = path.join(SKILLS_DIR, skillName);
    const filePath = path.join(skillDir, 'SKILL.md');
    const description = await extractDescription(skillDir);
    const agents  = agentMap[skillName]  || null;
    const category = categoryMap[skillName] || 'general';

    try {
      const req = pool.request();
      req.input('SkillName',   sql.NVarChar(100),  skillName);
      req.input('Description', sql.NVarChar(1000), description);
      req.input('FilePath',    sql.NVarChar(500),  filePath);
      req.input('AgentsCsv',   sql.NVarChar(500),  agents);
      req.input('Category',    sql.NVarChar(50),   category);

      const res = await req.query(`
        IF EXISTS (SELECT 1 FROM dbo.Skills WHERE SkillName = @SkillName)
          UPDATE dbo.Skills
          SET Description = @Description, FilePath = @FilePath,
              AgentsCsv = @AgentsCsv, Category = @Category, UpdatedAt = SYSUTCDATETIME()
          WHERE SkillName = @SkillName
        ELSE
          INSERT INTO dbo.Skills (SkillName, Description, FilePath, AgentsCsv, Category)
          VALUES (@SkillName, @Description, @FilePath, @AgentsCsv, @Category)
      `);
      
      console.log(`  ✓ ${skillName} (${category}${agents ? ' → ' + agents.split(',').length + ' agents' : ''})`);
      inserted++;
    } catch (err) {
      console.error(`  ✗ ${skillName}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\nDone: ${inserted} skills seeded, ${skipped} failed`);
  await closePool();
}

main().catch(e => { console.error(e.message); process.exit(1); });
