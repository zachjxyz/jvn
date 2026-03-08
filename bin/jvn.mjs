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
const VERSION = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')).version;

// ── Formatting ──────────────────────────────

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const header = (msg) => console.log(`\n${BOLD}${msg}${RESET}`);
const ok = (msg) => console.log(`  ${GREEN}✓${RESET} ${msg}`);
const warn = (msg) => console.log(`  ${YELLOW}!${RESET} ${msg}`);
const fail = (msg) => { console.log(`  ${RED}✗${RESET} ${msg}`); process.exit(1); };
const info = (msg) => console.log(`  ${DIM}${msg}${RESET}`);

// ── Skill Manifest ──────────────────────────

const SKILLS = [
  { name: 'neon-postgres', source: 'neondatabase/agent-skills@neon-postgres', label: 'Neon Postgres' },
  { name: 'better-auth-best-practices', source: 'better-auth/skills@better-auth-best-practices', label: 'Better Auth' },
  { name: 'vercel-react-best-practices', source: 'vercel-labs/agent-skills@vercel-react-best-practices', label: 'React Best Practices' },
  { name: 'vercel-composition-patterns', source: 'vercel-labs/agent-skills@vercel-composition-patterns', label: 'Composition Patterns' },
  { name: 'frontend-design', source: 'anthropics/skills@frontend-design', label: 'Frontend Design' },
  { name: 'web-design-guidelines', source: 'vercel-labs/agent-skills@web-design-guidelines', label: 'Web Design Guidelines' },
  { name: 'api-design-principles', source: 'wshobson/agents@api-design-principles', label: 'API Design' },
  { name: 'webapp-testing', source: 'anthropics/skills@webapp-testing', label: 'Webapp Testing' },
  { name: 'mcp-builder', source: 'anthropics/skills@mcp-builder', label: 'MCP Builder' },
  { name: 'doc-coauthoring', source: 'anthropics/skills@doc-coauthoring', label: 'Doc Coauthoring' },
  { name: 'pdf', source: 'anthropics/skills@pdf', label: 'PDF' },
  { name: 'docx', source: 'anthropics/skills@docx', label: 'DOCX' },
  { name: 'resend', source: 'resend/resend-skills@resend', label: 'Resend Email' },
  { name: 'skill-creator', source: 'anthropics/skills@skill-creator', label: 'Skill Creator' },
  { name: 'find-skills', source: 'vercel-labs/skills@find-skills', label: 'Find Skills' },
  { name: 'git-commit', source: 'github/awesome-copilot@git-commit', label: 'Git Commit' },
  { name: 'test-driven-development', source: 'obra/superpowers@test-driven-development', label: 'Test-Driven Development' },
  { name: 'dogfood', source: 'vercel-labs/agent-browser@dogfood', label: 'Dogfood QA' },
];

// ── Dotfile Rename Map ──────────────────────

const RENAME_MAP = {
  'dot-gitignore': '.gitignore',
  'dot-gitignore-root': '.gitignore',
  'dot-mcp.json': '.mcp.json',
};

// ── .gitignore entries jvn must ensure exist ─

const GITIGNORE_ENTRIES = ['.agents', '.claude', '.specify', 'constitution.md', 'reports/'];

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

function copyDirRecursive(src, dest, { force = false, dryRun = false } = {}) {
  let copied = 0;
  let skipped = 0;

  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destName = RENAME_MAP[entry.name] || entry.name;
    const destPath = join(dest, destName);

    if (entry.isDirectory()) {
      if (!dryRun) mkdirSync(destPath, { recursive: true });
      const sub = copyDirRecursive(srcPath, destPath, { force, dryRun });
      copied += sub.copied;
      skipped += sub.skipped;
    } else {
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

function ensureGitignoreEntries(dir, { dryRun = false } = {}) {
  const gitignorePath = join(dir, '.gitignore');
  const existing = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf8') : '';
  const lines = existing.split('\n').map((l) => l.trim());

  const missing = GITIGNORE_ENTRIES.filter((entry) => !lines.includes(entry));
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

// ── Commands ────────────────────────────────

function printHelp() {
  console.log(`
${BOLD}jvn${RESET} — Spec-driven development with Claude Code
Named after John von Neumann, who wrote the spec that defined computing.

${BOLD}Usage:${RESET}
  jvn                          Set up spec-driven dev in current directory
  jvn --dry-run                Show what would happen without doing anything
  jvn --report                 Generate a project analysis report
  jvn --report-fix <id>        Fix issues from a report (@latest or report-MMDDyy-HHmmss)

${BOLD}Setup flags:${RESET}
  --force                      Overwrite existing files (default: skip)
  --skip-skills                Skip skill installation
  --skip-speckit               Skip Spec-Kit initialization

${BOLD}Info:${RESET}
  --version, -v                Print version
  --help, -h                   Print this help

${BOLD}After setup:${RESET}
  claude                       Start Claude Code, then:
    /spec "feature"            Describe what you want to build
    /design                    Create the technical plan
    /build                     Implement it phase by phase
`);
}

function printVersion() {
  console.log(`jvn v${VERSION}`);
}

async function runSetup({ dryRun = false, force = false, skipSkills = false, skipSpeckit = false } = {}) {
  console.log('');
  console.log(`${BOLD} jvn${RESET}${DIM} — John von Neumann${RESET}`);
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

  if (!claudeExists()) fail('Claude Code not found. Install: npm install -g @anthropic-ai/claude-code');
  if (!dryRun) ok('Claude Code found');
  else info('Claude Code found');

  const specify = specifyCmd();
  if (!specify) fail('Spec-Kit not found. Install: pipx install specify-cli');
  if (!dryRun) ok('Spec-Kit (specify) found');
  else info('Spec-Kit (specify) found');

  // ── Copy Template ──────────────────────

  header('Copying template files...');

  const { copied, skipped } = copyDirRecursive(TEMPLATE_DIR, process.cwd(), { force, dryRun });

  if (!dryRun) {
    ok(`Copied ${copied} files (skipped ${skipped} existing)`);
  } else {
    info(`Would copy ${copied} files (skip ${skipped} existing)`);
  }

  // ── Ensure .gitignore entries ──────────

  const { added: gitignoreAdded } = ensureGitignoreEntries(process.cwd(), { dryRun });

  if (gitignoreAdded > 0) {
    if (!dryRun) ok(`Added ${gitignoreAdded} entries to .gitignore`);
    else info(`Would add ${gitignoreAdded} entries to .gitignore`);
  } else {
    if (!dryRun) ok('.gitignore already has jvn entries');
    else info('.gitignore already has jvn entries');
  }

  // ── Install Skills ─────────────────────

  if (!skipSkills) {
    header('Installing required skills...');

    let installed = 0;
    let skillsSkipped = 0;

    for (const skill of SKILLS) {
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
  }

  // ── Spec-Kit ───────────────────────────

  if (!skipSpeckit) {
    header('Setting up Spec-Kit...');

    const scriptType = platform() === 'win32' ? 'ps' : 'sh';
    const cmd = `${specify} init --here --ai claude --ai-skills --script ${scriptType} --force --no-git`;

    if (dryRun) {
      info(`Would run: ${cmd}`);
    } else {
      const spinner = createSpinner('Downloading and configuring Spec-Kit...');
      try {
        await new Promise((resolve, reject) => {
          const child = spawn(specify, [
            'init', '--here', '--ai', 'claude', '--ai-skills',
            '--script', scriptType, '--force', '--no-git'
          ], { stdio: 'ignore', cwd: process.cwd() });
          child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
          child.on('error', reject);
        });
        spinner.stop('Spec-Kit initialized (9 workflow skills added)');
      } catch {
        spinner.fail('Spec-Kit init had issues. You may need to run it manually.');
      }
    }
  }

  // ── Constitution ───────────────────────

  header('Configuring constitution...');

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
    console.log(`  Run ${BOLD}jvn${RESET} (without --dry-run) to execute.`);
  } else {
    console.log(`${BOLD} Ready!${RESET}`);
    console.log("  Run 'claude' to start, then:");
    console.log('');
    console.log('    /spec "what you want to build"   → create a feature spec');
    console.log('    /design                           → create the technical plan');
    console.log('    /build                            → implement it');
    console.log('');
    console.log('  Constitution is pre-configured.');
    console.log('  Edit .specify/memory/constitution.md to customize.');
  }
  console.log('─────────────────────────────────────────────');
}

function runReport() {
  console.log('');
  console.log(`${BOLD} jvn${RESET}${DIM} — project report${RESET}`);
  console.log('─────────────────────────────────────────────');

  mkdirSync(join(process.cwd(), 'reports'), { recursive: true });

  const spinner = createSpinner('Claude is analyzing your project...');

  const child = spawn('claude', ['--print', '/report'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  let output = '';
  child.stdout.on('data', (data) => { output += data.toString(); });
  child.stderr.on('data', (data) => { output += data.toString(); });

  child.on('error', () => {
    spinner.fail('Could not launch Claude Code. Is it installed?');
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code === 0) {
      // Find the report file that was just created
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

function runReportFix(reportId) {
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

  const spinner = createSpinner(`Claude is fixing issues from ${resolvedId}...`);

  const child = spawn('claude', ['--print', `/report-fix ${resolvedId}`], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  let output = '';
  child.stdout.on('data', (data) => { output += data.toString(); });
  child.stderr.on('data', (data) => { output += data.toString(); });

  child.on('error', () => {
    spinner.fail('Could not launch Claude Code. Is it installed?');
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

if (args.includes('--report-fix')) {
  const idx = args.indexOf('--report-fix');
  runReportFix(args[idx + 1]);
} else if (args.includes('--report')) {
  runReport();
} else {
  await runSetup({
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    skipSkills: args.includes('--skip-skills'),
    skipSpeckit: args.includes('--skip-speckit'),
  });
}
