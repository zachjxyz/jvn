#!/usr/bin/env node

import { execSync, spawn } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform, homedir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, '..');
const TEMPLATE_DIR = join(PKG_ROOT, 'template');
const STACKS_DIR = join(PKG_ROOT, 'stacks');
const ADAPTERS_DIR = join(PKG_ROOT, 'adapters');
const VERSION = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')).version;

// ── Formatting ──────────────────────────────

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

const header = (msg) => console.log(`\n${BOLD}${msg}${RESET}`);
const ok = (msg) => console.log(`  ${GREEN}✓${RESET} ${msg}`);
const warn = (msg) => console.log(`  ${YELLOW}!${RESET} ${msg}`);
const fail = (msg) => { console.log(`  ${RED}✗${RESET} ${msg}`); process.exit(1); };
const info = (msg) => console.log(`  ${DIM}${msg}${RESET}`);

// ── Skill Manifests ─────────────────────────

const SHARED_SKILLS = [
  { name: 'api-design-principles', source: 'wshobson/agents@api-design-principles', label: 'API Design' },
  { name: 'mcp-builder', source: 'anthropics/skills@mcp-builder', label: 'MCP Builder' },
  { name: 'doc-coauthoring', source: 'anthropics/skills@doc-coauthoring', label: 'Doc Coauthoring' },
  { name: 'pdf', source: 'anthropics/skills@pdf', label: 'PDF' },
  { name: 'docx', source: 'anthropics/skills@docx', label: 'DOCX' },
  { name: 'skill-creator', source: 'anthropics/skills@skill-creator', label: 'Skill Creator' },
  { name: 'find-skills', source: 'vercel-labs/skills@find-skills', label: 'Find Skills' },
  { name: 'git-commit', source: 'github/awesome-copilot@git-commit', label: 'Git Commit' },
  { name: 'test-driven-development', source: 'obra/superpowers@test-driven-development', label: 'Test-Driven Development' },
];

const NEXTJS_SKILLS = [
  { name: 'neon-postgres', source: 'neondatabase/agent-skills@neon-postgres', label: 'Neon Postgres' },
  { name: 'better-auth-best-practices', source: 'better-auth/skills@better-auth-best-practices', label: 'Better Auth' },
  { name: 'vercel-react-best-practices', source: 'vercel-labs/agent-skills@vercel-react-best-practices', label: 'React Best Practices' },
  { name: 'vercel-composition-patterns', source: 'vercel-labs/agent-skills@vercel-composition-patterns', label: 'Composition Patterns' },
  { name: 'frontend-design', source: 'anthropics/skills@frontend-design', label: 'Frontend Design' },
  { name: 'web-design-guidelines', source: 'vercel-labs/agent-skills@web-design-guidelines', label: 'Web Design Guidelines' },
  { name: 'webapp-testing', source: 'anthropics/skills@webapp-testing', label: 'Webapp Testing' },
  { name: 'resend', source: 'resend/resend-skills@resend', label: 'Resend Email' },
  { name: 'dogfood', source: 'vercel-labs/agent-browser@dogfood', label: 'Dogfood QA' },
];

const PYTHON_ML_SKILLS = [
  { name: 'fastapi', source: 'fastapi/fastapi@fastapi', label: 'FastAPI' },
  { name: 'supabase-postgres-best-practices', source: 'sickn33/antigravity-awesome-skills@supabase-postgres-best-practices', label: 'Postgres Best Practices' },
  { name: 'python-backend', source: 'jiatastic/open-python-skills@python-backend', label: 'Python Backend' },
];

// ── Stack Profiles ──────────────────────────

const STACKS = {
  nextjs: {
    label: 'Next.js + Neon + Better Auth + Tailwind',
    skills: [...SHARED_SKILLS, ...NEXTJS_SKILLS],
    overlayDir: null,
    agentSwaps: {},
  },
  python: {
    label: 'Python (FastAPI + PostgreSQL + SQLAlchemy + PyTorch)',
    skills: [...SHARED_SKILLS, ...PYTHON_ML_SKILLS],
    overlayDir: 'python',
    agentSwaps: { 'ux-designer': 'data-analyst' },
  },
};

// ── Agent Adapters ──────────────────────────

const AGENT_ADAPTERS = {
  claude: {
    label: 'Claude Code',
    configDir: '.claude',
    instructionsFile: 'CLAUDE.md',
    hasSubAgents: true,
    hasCommands: true,
    hasSkills: true,
    hasSettings: true,
    installSkills: true,
    specKitAi: 'claude',
    reportCmd: ['claude', '--print', '/report'],
    reportFixCmd: (id) => ['claude', '--print', `/report-fix ${id}`],
    checkFn: () => claudeExists(),
    checkFailMsg: 'Claude Code not found. Install: npm install -g @anthropic-ai/claude-code',
    startCmd: 'claude',
  },
  codex: {
    label: 'Codex CLI',
    configDir: '.codex',
    instructionsFile: 'AGENTS.md',
    hasSubAgents: false,
    hasCommands: false,
    hasSkills: false,
    hasSettings: false,
    installSkills: false,
    specKitAi: 'codex',
    reportCmd: ['codex', '-q', 'Analyze this project and generate a SWOT report. Save it to reports/ with a timestamped filename.'],
    reportFixCmd: (id) => ['codex', '-q', `Read the report at reports/${id}.md and fix the identified issues, prioritized by severity.`],
    checkFn: () => commandExists('codex'),
    checkFailMsg: 'Codex CLI not found. Install: npm install -g @openai/codex',
    startCmd: 'codex',
  },
};

// ── Dotfile Rename Map ──────────────────────

const RENAME_MAP = {
  'dot-gitignore': '.gitignore',
  'dot-gitignore-root': '.gitignore',
  'dot-mcp.json': '.mcp.json',
};

// ── Spinner ─────────────────────────────────

function createSpinner(message) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  let elapsed = 0;

  const interval = setInterval(() => {
    elapsed += 100;
    const secs = Math.floor(elapsed / 1000);
    const time = secs > 0 ? ` ${DIM}(${secs}s)${RESET}` : '';
    process.stdout.write(`\r  ${GREEN}${frames[i]}${RESET} ${message}${time}  `);
    i = (i + 1) % frames.length;
  }, 100);

  return {
    stop(finalMessage) {
      clearInterval(interval);
      process.stdout.write(`\r  ${GREEN}✓${RESET} ${finalMessage}\n`);
    },
    fail(finalMessage) {
      clearInterval(interval);
      process.stdout.write(`\r  ${RED}✗${RESET} ${finalMessage}\n`);
    },
  };
}

// ── Utilities ───────────────────────────────

function commandExists(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    // Windows fallback
    try {
      execSync(`where ${cmd}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

function claudeExists() {
  if (commandExists('claude')) return true;
  const localPath = join(homedir(), '.claude', 'local', 'claude');
  return existsSync(localPath);
}

function specifyCmd() {
  if (commandExists('specify')) return 'specify';
  const localPath = join(homedir(), '.local', 'bin', 'specify');
  if (existsSync(localPath)) return localPath;
  return null;
}

function skillInstalled(name) {
  const skillDir = join(homedir(), '.claude', 'skills', name);
  return existsSync(skillDir);
}

function copyDirRecursive(src, dest, { force = false, dryRun = false, skipDirs = [], skipFiles = [] } = {}) {
  let copied = 0;
  let skipped = 0;

  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destName = RENAME_MAP[entry.name] || entry.name;
    const destPath = join(dest, destName);

    if (entry.isDirectory()) {
      if (skipDirs.includes(entry.name)) {
        skipped++;
        if (dryRun) info(`  skip dir: ${entry.name} (not supported by agent)`);
        continue;
      }
      if (!dryRun) mkdirSync(destPath, { recursive: true });
      const sub = copyDirRecursive(srcPath, destPath, { force, dryRun, skipDirs, skipFiles });
      copied += sub.copied;
      skipped += sub.skipped;
    } else {
      if (skipFiles.includes(entry.name)) {
        skipped++;
        if (dryRun) info(`  skip: ${entry.name} (not supported by agent)`);
        continue;
      }
      if (existsSync(destPath) && !force) {
        skipped++;
        if (dryRun) info(`  skip: ${destPath} (exists)`);
      } else {
        copied++;
        if (dryRun) {
          info(`  copy: ${destPath}`);
        } else {
          mkdirSync(dirname(destPath), { recursive: true });
          cpSync(srcPath, destPath);
        }
      }
    }
  }

  return { copied, skipped };
}

function ensureGitignoreEntries(dir, adapter, { dryRun = false } = {}) {
  const entries = ['.agents', adapter.configDir, '.specify', 'constitution.md', 'reports/'];
  const gitignorePath = join(dir, '.gitignore');
  const existing = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf8') : '';
  const lines = existing.split('\n').map((l) => l.trim());

  const missing = entries.filter((entry) => !lines.includes(entry));
  if (missing.length === 0) return { added: 0 };

  if (dryRun) return { added: missing.length };

  const block = `\n# jvn\n${missing.join('\n')}\n`;

  if (existing) {
    appendFileSync(gitignorePath, block);
  } else {
    writeFileSync(gitignorePath, block.trimStart());
  }

  return { added: missing.length };
}

function getFlagValue(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  const val = args[idx + 1];
  if (val.startsWith('--')) return null;
  return val;
}

// ── Commands ────────────────────────────────

function printHelp() {
  const stackList = Object.entries(STACKS).map(([k, v]) => `    ${k.padEnd(18)} ${v.label}`).join('\n');
  const agentList = Object.entries(AGENT_ADAPTERS).map(([k, v]) => `    ${k.padEnd(18)} ${v.label}`).join('\n');

  console.log(`
${BOLD}jvn${RESET} — Spec-driven development for AI coding agents
Named after John von Neumann, who wrote the spec that defined computing.

${BOLD}Usage:${RESET}
  jvn                          Set up spec-driven dev in current directory
  jvn --dry-run                Show what would happen without doing anything
  jvn --report                 Generate a project analysis report
  jvn --report-fix <id>        Fix issues from a report (@latest or report-MMDDyy-HHmmss)

${BOLD}Profile flags:${RESET}
  --stack <name>               Tech stack profile (default: nextjs)
  --agent <name>               AI coding agent (default: claude)

${BOLD}Available stacks:${RESET}
${stackList}

${BOLD}Available agents:${RESET}
${agentList}

${BOLD}Setup flags:${RESET}
  --force                      Overwrite existing files (default: skip)
  --skip-skills                Skip skill installation
  --skip-speckit               Skip Spec-Kit initialization

${BOLD}Info:${RESET}
  --version, -v                Print version
  --help, -h                   Print this help

${BOLD}Examples:${RESET}
  jvn                          Next.js + Claude Code (default)
  jvn --stack python           Python + Claude Code
  jvn --agent codex            Next.js + Codex CLI
  jvn --stack python --agent codex
                               Python + Codex CLI
`);
}

function printVersion() {
  console.log(`jvn v${VERSION}`);
}

async function runSetup({ dryRun = false, force = false, skipSkills = false, skipSpeckit = false, stackName = 'nextjs', agentName = 'claude' } = {}) {
  const stack = STACKS[stackName];
  const adapter = AGENT_ADAPTERS[agentName];

  if (!stack) fail(`Unknown stack: ${stackName}. Available: ${Object.keys(STACKS).join(', ')}`);
  if (!adapter) fail(`Unknown agent: ${agentName}. Available: ${Object.keys(AGENT_ADAPTERS).join(', ')}`);

  const isDefault = stackName === 'nextjs' && agentName === 'claude';

  console.log('');
  console.log(`${BOLD} jvn${RESET}${DIM} — John von Neumann${RESET}`);
  if (!isDefault) {
    console.log(`  ${CYAN}stack${RESET} ${stack.label}`);
    console.log(`  ${CYAN}agent${RESET} ${adapter.label}`);
  }
  console.log('─────────────────────────────────────────────');

  if (dryRun) {
    console.log(`${YELLOW}  DRY RUN — no changes will be made${RESET}`);
  }

  // ── Prerequisites ───────────────────────

  header('Checking prerequisites...');

  if (!commandExists('node')) fail('Node.js not found. Install from https://nodejs.org');
  if (!dryRun) ok(`Node.js found (${process.version})`);
  else info(`Node.js found (${process.version})`);

  if (!commandExists('npx')) fail('npx not found. Comes with Node.js');
  if (!dryRun) ok('npx available');
  else info('npx available');

  if (!adapter.checkFn()) fail(adapter.checkFailMsg);
  if (!dryRun) ok(`${adapter.label} found`);
  else info(`${adapter.label} found`);

  const specify = specifyCmd();
  if (!specify) fail('Spec-Kit not found. Install: pipx install specify-cli');
  if (!dryRun) ok('Spec-Kit (specify) found');
  else info('Spec-Kit (specify) found');

  // ── Copy Template ──────────────────────

  header('Copying template files...');

  // Determine what to skip based on agent adapter capabilities
  const skipTemplateDirs = [];
  const skipTemplateFiles = [];

  if (!adapter.hasSubAgents) skipTemplateDirs.push('agents');
  if (!adapter.hasCommands) skipTemplateDirs.push('commands');
  if (!adapter.hasSkills) skipTemplateDirs.push('skills');
  if (!adapter.hasSettings) skipTemplateFiles.push('settings.json');
  if (agentName !== 'claude') skipTemplateFiles.push('CLAUDE.md');

  if (agentName === 'claude') {
    // Claude: copy template as-is (base .claude/ directory)
    const { copied, skipped } = copyDirRecursive(TEMPLATE_DIR, process.cwd(), {
      force, dryRun, skipDirs: skipTemplateDirs, skipFiles: skipTemplateFiles,
    });

    if (!dryRun) ok(`Copied ${copied} files (skipped ${skipped} existing)`);
    else info(`Would copy ${copied} files (skip ${skipped} existing)`);
  } else {
    // Non-Claude agent: copy template but transform .claude/ → adapter.configDir
    // First, copy non-.claude files from template
    let totalCopied = 0;
    let totalSkipped = 0;

    for (const entry of readdirSync(TEMPLATE_DIR, { withFileTypes: true })) {
      if (entry.name === '.claude') continue; // Handle separately
      if (entry.name === 'CLAUDE.md') continue; // Replaced by adapter-specific file

      const srcPath = join(TEMPLATE_DIR, entry.name);
      const destName = RENAME_MAP[entry.name] || entry.name;
      const destPath = join(process.cwd(), destName);

      if (entry.isDirectory()) {
        if (!dryRun) mkdirSync(destPath, { recursive: true });
        const sub = copyDirRecursive(srcPath, destPath, { force, dryRun });
        totalCopied += sub.copied;
        totalSkipped += sub.skipped;
      } else {
        if (existsSync(destPath) && !force) {
          totalSkipped++;
          if (dryRun) info(`  skip: ${destPath} (exists)`);
        } else {
          totalCopied++;
          if (dryRun) {
            info(`  copy: ${destPath}`);
          } else {
            mkdirSync(dirname(destPath), { recursive: true });
            cpSync(srcPath, destPath);
          }
        }
      }
    }

    // Copy .claude/ contents to adapter.configDir (if agent has any features)
    const templateClaudeDir = join(TEMPLATE_DIR, '.claude');
    if (existsSync(templateClaudeDir) && (adapter.hasSubAgents || adapter.hasCommands || adapter.hasSkills || adapter.hasSettings)) {
      const adapterDir = join(process.cwd(), adapter.configDir);
      if (!dryRun) mkdirSync(adapterDir, { recursive: true });
      const sub = copyDirRecursive(templateClaudeDir, adapterDir, {
        force, dryRun, skipDirs: skipTemplateDirs, skipFiles: skipTemplateFiles,
      });
      totalCopied += sub.copied;
      totalSkipped += sub.skipped;
    }

    // Copy adapter-specific instructions file (e.g., AGENTS.md for Codex)
    const adapterInstructionsSrc = join(ADAPTERS_DIR, agentName,
      stack.overlayDir ? `${adapter.instructionsFile.replace('.md', '')}.${stack.overlayDir}.md` : adapter.instructionsFile
    );
    const adapterInstructionsFallback = join(ADAPTERS_DIR, agentName, adapter.instructionsFile);
    const instructionsSrc = existsSync(adapterInstructionsSrc) ? adapterInstructionsSrc : adapterInstructionsFallback;
    const instructionsDest = join(process.cwd(), adapter.instructionsFile);

    if (existsSync(instructionsSrc)) {
      if (existsSync(instructionsDest) && !force) {
        totalSkipped++;
        if (dryRun) info(`  skip: ${instructionsDest} (exists)`);
      } else {
        totalCopied++;
        if (dryRun) {
          info(`  copy: ${instructionsDest}`);
        } else {
          cpSync(instructionsSrc, instructionsDest);
        }
      }
    }

    if (!dryRun) ok(`Copied ${totalCopied} files (skipped ${totalSkipped} existing)`);
    else info(`Would copy ${totalCopied} files (skip ${totalSkipped} existing)`);
  }

  // ── Stack Overlay ─────────────────────

  if (stack.overlayDir) {
    header(`Applying ${stackName} stack...`);

    const overlayPath = join(STACKS_DIR, stack.overlayDir);
    if (!existsSync(overlayPath)) fail(`Stack overlay directory not found: ${overlayPath}`);

    // For Claude agent, overlay directly
    // For other agents, skip .claude/ subdirectories they don't support
    const { copied: overlayCopied, skipped: overlaySkipped } = copyDirRecursive(overlayPath, process.cwd(), {
      force: true, // Stack overlays always overwrite base template files
      dryRun,
      skipDirs: skipTemplateDirs,
      skipFiles: skipTemplateFiles,
    });

    if (!dryRun) ok(`Applied ${stackName} stack (${overlayCopied} files)`);
    else info(`Would apply ${stackName} stack (${overlayCopied} files)`);
  }

  // ── Ensure .gitignore entries ──────────

  const { added: gitignoreAdded } = ensureGitignoreEntries(process.cwd(), adapter, { dryRun });

  if (gitignoreAdded > 0) {
    if (!dryRun) ok(`Added ${gitignoreAdded} entries to .gitignore`);
    else info(`Would add ${gitignoreAdded} entries to .gitignore`);
  } else {
    if (!dryRun) ok('.gitignore already has jvn entries');
    else info('.gitignore already has jvn entries');
  }

  // ── Install Skills ─────────────────────

  if (!skipSkills && adapter.installSkills) {
    header('Installing required skills...');

    let installed = 0;
    let skillsSkipped = 0;

    for (const skill of stack.skills) {
      if (skillInstalled(skill.name)) {
        skillsSkipped++;
        continue;
      }

      if (dryRun) {
        info(`Would install: ${skill.label} (${skill.source})`);
        installed++;
        continue;
      }

      const label = skill.label.padEnd(40);
      process.stdout.write(`  ↓ ${label}`);
      try {
        execSync(`npx skills add ${skill.source} -g -y`, { stdio: 'ignore' });
        console.log(` ${GREEN}✓${RESET}`);
        installed++;
      } catch {
        console.log(` ${RED}✗${RESET}`);
        warn(`Failed to install ${skill.name}. Run manually: npx skills add ${skill.source} -g -y`);
      }
    }

    if (!dryRun) ok(`Installed ${installed} skills (skipped ${skillsSkipped} already installed)`);
    else info(`Would install ${installed} skills (skip ${skillsSkipped} already installed)`);
  } else if (!adapter.installSkills && !skipSkills) {
    header('Skills...');
    if (!dryRun) ok(`${adapter.label} does not use skills — skipping`);
    else info(`${adapter.label} does not use skills — skipping`);
  }

  // ── Spec-Kit ───────────────────────────

  if (!skipSpeckit) {
    header('Setting up Spec-Kit...');

    const scriptType = platform() === 'win32' ? 'ps' : 'sh';
    const aiFlag = adapter.specKitAi;
    const cmd = `${specify} init --here --ai ${aiFlag} --ai-skills --script ${scriptType} --force --no-git`;

    if (dryRun) {
      info(`Would run: ${cmd}`);
    } else {
      const spinner = createSpinner('Downloading and configuring Spec-Kit...');
      try {
        await new Promise((resolve, reject) => {
          const child = spawn(specify, [
            'init', '--here', '--ai', aiFlag, '--ai-skills',
            '--script', scriptType, '--force', '--no-git'
          ], { stdio: 'ignore', cwd: process.cwd() });
          child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
          child.on('error', reject);
        });
        spinner.stop(`Spec-Kit initialized for ${adapter.label} (9 workflow skills added)`);
      } catch {
        spinner.fail('Spec-Kit init had issues. You may need to run it manually.');
      }
    }
  }

  // ── Constitution ───────────────────────

  header('Configuring constitution...');

  // Stack overlay may have placed a constitution.md — prefer that, then local, then template default
  const constitutionLocal = join(process.cwd(), 'constitution.md');
  const constitutionTemplate = join(TEMPLATE_DIR, 'constitution.md');
  const constitutionSrc = existsSync(constitutionLocal) ? constitutionLocal : constitutionTemplate;
  const constitutionDst = join(process.cwd(), '.specify', 'memory', 'constitution.md');

  if (existsSync(constitutionSrc)) {
    if (dryRun) {
      info(`Would install constitution at .specify/memory/constitution.md`);
    } else {
      mkdirSync(dirname(constitutionDst), { recursive: true });
      cpSync(constitutionSrc, constitutionDst);
      ok(`Constitution installed at .specify/memory/constitution.md`);
    }
  } else {
    warn('constitution.md not found. Skipping.');
  }

  // ── Git Init ───────────────────────────

  header('Initializing git...');

  if (dryRun) {
    info('Would initialize fresh git repository');
  } else {
    if (!existsSync(join(process.cwd(), '.git'))) {
      try {
        execSync('git init -q', { stdio: 'ignore' });
        ok('Fresh repository initialized');
      } catch {
        warn('Git init failed. Initialize manually with: git init');
      }
    } else {
      ok('Git repository already exists');
    }
  }

  // ── Done ───────────────────────────────

  console.log('');
  if (dryRun) {
    console.log(`${BOLD} Dry run complete.${RESET} No changes were made.`);
    console.log(`  Run ${BOLD}jvn${isDefault ? '' : ` --stack ${stackName} --agent ${agentName}`}${RESET} (without --dry-run) to execute.`);
  } else {
    console.log(`${BOLD} Ready!${RESET}`);
    if (adapter.hasCommands) {
      console.log(`  Run '${adapter.startCmd}' to start, then:`);
      console.log('');
      console.log('    /spec "what you want to build"   → create a feature spec');
      console.log('    /design                           → create the technical plan');
      console.log('    /build                            → implement it');
    } else {
      console.log(`  Run '${adapter.startCmd}' to start coding.`);
      console.log('  Use spec-kit CLI directly for the workflow:');
      console.log('');
      console.log('    specify specify "feature"         → create a feature spec');
      console.log('    specify plan                      → create the technical plan');
      console.log('    specify implement                 → implement it');
    }
    console.log('');
    console.log('  Constitution is pre-configured.');
    console.log('  Edit .specify/memory/constitution.md to customize.');
  }
  console.log('─────────────────────────────────────────────');
}

function runReport(agentName = 'claude') {
  const adapter = AGENT_ADAPTERS[agentName];
  if (!adapter) fail(`Unknown agent: ${agentName}. Available: ${Object.keys(AGENT_ADAPTERS).join(', ')}`);

  console.log('');
  console.log(`${BOLD} jvn${RESET}${DIM} — project report${RESET}`);
  console.log('─────────────────────────────────────────────');

  mkdirSync(join(process.cwd(), 'reports'), { recursive: true });

  const [cmd, ...cmdArgs] = adapter.reportCmd;
  const spinner = createSpinner(`${adapter.label} is analyzing your project...`);

  const child = spawn(cmd, cmdArgs, {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  let output = '';
  child.stdout.on('data', (data) => { output += data.toString(); });
  child.stderr.on('data', (data) => { output += data.toString(); });

  child.on('error', () => {
    spinner.fail(`Could not launch ${adapter.label}. Is it installed?`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code === 0) {
      const reportsDir = join(process.cwd(), 'reports');
      const reports = existsSync(reportsDir)
        ? readdirSync(reportsDir).filter(f => f.startsWith('report-') && f.endsWith('.md')).sort().reverse()
        : [];
      const reportFile = reports.length > 0 ? `reports/${reports[0]}` : 'reports/';

      spinner.stop(`Report generated at ${BOLD}${reportFile}${RESET}`);
      console.log('');
      console.log(`  Run ${BOLD}jvn --report-fix @latest${RESET} to fix identified issues.`);
      console.log('─────────────────────────────────────────────');
    } else {
      spinner.fail('Report generation failed');
      if (output.trim()) console.log(`\n${DIM}${output.trim()}${RESET}`);
    }
    process.exit(code ?? 0);
  });
}

function runReportFix(reportId, agentName = 'claude') {
  const adapter = AGENT_ADAPTERS[agentName];
  if (!adapter) fail(`Unknown agent: ${agentName}. Available: ${Object.keys(AGENT_ADAPTERS).join(', ')}`);

  if (!reportId) {
    fail('Usage: jvn --report-fix <@latest or report-MMDDyy-HHmmss>');
  }

  // Resolve @latest
  let resolvedId = reportId;
  if (reportId === '@latest') {
    const reportsDir = join(process.cwd(), 'reports');
    if (!existsSync(reportsDir)) fail('No reports/ directory found. Run jvn --report first.');

    const reports = readdirSync(reportsDir)
      .filter(f => f.startsWith('report-') && f.endsWith('.md'))
      .sort()
      .reverse();

    if (reports.length === 0) fail('No reports found. Run jvn --report first.');
    resolvedId = reports[0].replace('.md', '');
    info(`Resolved @latest → ${resolvedId}`);
  }

  console.log('');
  console.log(`${BOLD} jvn${RESET}${DIM} — report fix${RESET}`);
  console.log('─────────────────────────────────────────────');

  const [cmd, ...cmdArgs] = adapter.reportFixCmd(resolvedId);
  const spinner = createSpinner(`${adapter.label} is fixing issues from ${resolvedId}...`);

  const child = spawn(cmd, cmdArgs, {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  let output = '';
  child.stdout.on('data', (data) => { output += data.toString(); });
  child.stderr.on('data', (data) => { output += data.toString(); });

  child.on('error', () => {
    spinner.fail(`Could not launch ${adapter.label}. Is it installed?`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code === 0) {
      spinner.stop('Fixes applied');
      console.log('');
      console.log(`  Run ${BOLD}jvn --report${RESET} again to verify improvements.`);
      console.log('─────────────────────────────────────────────');
    } else {
      spinner.fail('Fix process failed');
      if (output.trim()) console.log(`\n${DIM}${output.trim()}${RESET}`);
    }
    process.exit(code ?? 0);
  });
}

// ── Detect Agent from Project ───────────────

function detectAgent() {
  if (existsSync(join(process.cwd(), '.codex'))) return 'codex';
  if (existsSync(join(process.cwd(), 'AGENTS.md')) && !existsSync(join(process.cwd(), 'CLAUDE.md'))) return 'codex';
  return 'claude';
}

// ── Argument Parsing ────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  printVersion();
  process.exit(0);
}

const stackArg = getFlagValue(args, '--stack') ?? 'nextjs';
const agentArg = getFlagValue(args, '--agent') ?? (args.includes('--report') || args.includes('--report-fix') ? detectAgent() : 'claude');

if (args.includes('--report-fix')) {
  const idx = args.indexOf('--report-fix');
  runReportFix(args[idx + 1], agentArg);
} else if (args.includes('--report')) {
  runReport(agentArg);
} else {
  await runSetup({
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    skipSkills: args.includes('--skip-skills'),
    skipSpeckit: args.includes('--skip-speckit'),
    stackName: stackArg,
    agentName: agentArg,
  });
}
