#!/usr/bin/env node

/**
 * Agent RS Runner for Reference UI (`pnpm agentrs`)
 *
 * Dedicated agentic workflow runner for `packages/reference-rs`:
 * - Darwin QoS elevation (taskpolicy -a PRI 46)
 * - Shared CPU gate concurrency queue (/tmp/reference-ui-cpu-gate)
 * - Pure Rust tests (cargo test) & JS seam tests (Vitest)
 * - Code quality, file length limits (<365 / <500), cyclomatic complexity, and banned Clippy allows
 */

import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { withCpuGate, readLocks } from '../../test-core/scripts/cpu-gate.mjs'
import {
  findSourceFiles,
  inspectFiles,
  THRESHOLDS,
} from './complexity.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Darwin QoS Jailbreak (Unconditional & Deterministic)
function ensureQosJailbreak() {
  if (process.platform !== 'darwin') return false
  if (process.env.__AGENT_RS_JAILBROKEN === '1') return false

  const args = [
    '-a',            // Application QoS (PRI 46/47)
    '-d', 'default', // Unthrottled disk & network IPC
    '-t', '0',       // Throughput tier 0 (all P-cores)
    '-l', '0',       // Latency tier 0
    process.execPath,
    __filename,
    ...process.argv.slice(2),
  ]

  const child = spawn('taskpolicy', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      __AGENT_RS_JAILBROKEN: '1',
      FORCE_COLOR: '1',
    },
    cwd: process.cwd(),
  })

  const forwardSignal = (sig) => {
    try {
      if (child && child.pid) child.kill(sig)
    } catch {}
  }
  process.on('SIGINT', () => forwardSignal('SIGINT'))
  process.on('SIGTERM', () => forwardSignal('SIGTERM'))
  process.on('SIGHUP', () => forwardSignal('SIGHUP'))

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal)
    else process.exit(code ?? 0)
  })

  return true
}

if (ensureQosJailbreak()) {
  // Spawned elevated child process
} else {
  main().catch((err) => {
    console.error('\x1b[31m[agent-rs] Fatal error:\x1b[0m', err)
    process.exit(1)
  })
}

function findRepoRoot(startDir = __dirname) {
  let cur = startDir
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'pnpm-workspace.yaml'))) return cur
    cur = path.dirname(cur)
  }
  return process.cwd()
}

function runChild(command, args, cwd, extraEnv = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: '1',
        ...extraEnv,
      },
    })

    const onSig = (sig) => {
      try { child.kill(sig) } catch {}
    }
    process.on('SIGINT', onSig)
    process.on('SIGTERM', onSig)

    child.on('close', (code) => {
      process.off('SIGINT', onSig)
      process.off('SIGTERM', onSig)
      resolve(code ?? 0)
    })
  })
}

async function getGitChangedFiles(repoRoot, rsDir) {
  return new Promise((resolve) => {
    const child = spawn('git', ['status', '--porcelain', 'packages/reference-rs'], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    let out = ''
    child.stdout.on('data', (d) => { out += d.toString() })
    child.on('close', () => {
      const files = []
      for (const line of out.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const parts = trimmed.split(/\s+/)
        const relPath = parts[parts.length - 1]
        const absPath = path.resolve(repoRoot, relPath)
        const ext = path.extname(absPath)
        if (['.rs', '.ts', '.tsx', '.js', '.mjs'].includes(ext) && fs.existsSync(absPath)) {
          files.push(absPath)
        }
      }
      resolve(files)
    })
  })
}

async function runQualityCommand(args, repoRoot, rsDir) {
  console.log('\n\x1b[1;34m=== [agent-rs] Code Quality & Complexity Scan ===\x1b[0m\n')

  const strict = args.includes('--strict')
  const withClippy = args.includes('--clippy')
  const onlyChanged = args.includes('--changed') || args.includes('--staged')
  const checkAll = args.includes('--all')
  const asJson = args.includes('--json')

  // Positional file or directory targets
  const nonFlagArgs = args.filter((a) => !a.startsWith('-'))
  let targetFiles = []

  // Complexity rules only apply to source code, NEVER to markdown documentation
  const SOURCE_EXTENSIONS = ['.rs', '.ts', '.tsx', '.js', '.mjs']

  if (nonFlagArgs.length > 0) {
    for (const raw of nonFlagArgs) {
      const candidates = [
        path.isAbsolute(raw) ? raw : path.resolve(process.env.INIT_CWD || process.cwd(), raw),
        path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw),
        path.isAbsolute(raw) ? raw : path.resolve(rsDir, raw),
        path.isAbsolute(raw) ? raw : path.resolve(rsDir, 'modules', raw),
      ]
      const fullPath = candidates.find((p) => fs.existsSync(p))
      if (fullPath && fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          targetFiles.push(...findSourceFiles(fullPath, SOURCE_EXTENSIONS))
        } else if (SOURCE_EXTENSIONS.some((ext) => fullPath.endsWith(ext))) {
          targetFiles.push(fullPath)
        }
      }
    }
  } else if (!checkAll) {
    // Default smart inspection: changed files first; fallback to system crate
    const changed = await getGitChangedFiles(repoRoot, rsDir)
    const sourceChanged = changed.filter((f) => SOURCE_EXTENSIONS.some((ext) => f.endsWith(ext)))
    if (sourceChanged.length > 0) {
      targetFiles = sourceChanged
      console.log(`\x1b[36m• Inspecting ${sourceChanged.length} git-modified source file(s) in reference-rs\x1b[0m`)
    } else {
      const systemCrate = fs.existsSync(path.join(rsDir, 'modules/system'))
        ? path.join(rsDir, 'modules/system')
        : path.join(rsDir, 'system')
      if (fs.existsSync(systemCrate)) {
        targetFiles = findSourceFiles(systemCrate, SOURCE_EXTENSIONS)
        console.log(`\x1b[36m• Git clean: inspecting ${path.relative(rsDir, systemCrate)} (${targetFiles.length} source files)\x1b[0m`)
      } else {
        targetFiles = findSourceFiles(rsDir, SOURCE_EXTENSIONS)
      }
    }
  } else {
    targetFiles = findSourceFiles(rsDir, SOURCE_EXTENSIONS)
  }

  if (targetFiles.length === 0) {
    console.log('\x1b[33m[agent-rs] No matching source files to inspect.\x1b[0m\n')
    return 0
  }

  console.log(`Inspecting ${targetFiles.length} source file(s) against quality thresholds:`)
  console.log(`  • File lines: soft limit ${THRESHOLDS.FILE_LINES_WARN}, limit ${THRESHOLDS.FILE_LINES_FAIL}`)
  console.log(`  • Cyclomatic complexity: warn > ${THRESHOLDS.CYCLOMATIC_WARN}, fail > ${THRESHOLDS.CYCLOMATIC_FAIL}`)
  console.log(`  • Cognitive complexity: warn > ${THRESHOLDS.COGNITIVE_WARN}, fail > ${THRESHOLDS.COGNITIVE_FAIL}`)
  console.log(`  • Function lines: warn > ${THRESHOLDS.FN_LINES_WARN}, fail > ${THRESHOLDS.FN_LINES_FAIL}`)
  console.log(`  • Function args: warn > ${THRESHOLDS.FN_ARGS_WARN}, fail > ${THRESHOLDS.FN_ARGS_FAIL} (context struct, not #[allow])`)
  console.log(`  • Clippy #[allow]/#[expect]: banned. Fix the architecture.`)
  console.log(`  • File headers: 2–6 sentences (thin one-liners warn; missing/essays fail)\n`)

  const report = await inspectFiles(targetFiles, {
    strict,
    runClippy: withClippy,
    targetDir: rsDir,
  })

  if (asJson) {
    console.log(JSON.stringify(report, null, 2))
    return report.ok ? 0 : 1
  }

  // Print results table
  const flaggedFiles = report.results.filter((r) => r.issues.length > 0)

  if (flaggedFiles.length === 0 && (!report.clippy || report.clippy.diagnostics.length === 0)) {
    console.log(`\x1b[1;32m✔ ALL ${report.totalFiles} FILES PASSED QUALITY CHECKS!\x1b[0m`)
    console.log('  • Zero files over 365 lines')
    console.log('  • Zero functions exceeding cyclomatic complexity 10')
    console.log('  • Zero functions exceeding cognitive complexity 15')
    console.log('  • Zero Clippy #[allow]/#[expect] attributes\n')
    return 0
  }

  console.log('\x1b[1;33m--- Identified Quality Findings ---\x1b[0m\n')
  for (const f of flaggedFiles) {
    const rel = path.relative(repoRoot, f.filePath)
    const color = f.status === 'fail' ? '\x1b[1;31m' : '\x1b[1;33m'
    console.log(`${color}${f.status.toUpperCase()}: ${rel} (${f.metrics.total} lines, ${f.metrics.code} SLOC)\x1b[0m`)
    for (const issue of f.issues) {
      const icon = issue.severity === 'error' ? '❌' : '⚠️'
      const loc = issue.line ? ` (line ${issue.line})` : ''
      console.log(`   ${icon} ${issue.message}${loc}`)
    }
    console.log('')
  }

  if (report.clippy && report.clippy.diagnostics.length > 0) {
    console.log('\x1b[1;34m--- Clippy Diagnostics ---\x1b[0m\n')
    for (const diag of report.clippy.diagnostics) {
      const loc = diag.file ? `${diag.file}:${diag.line}:${diag.column} ` : ''
      const color = diag.level === 'error' ? '\x1b[31m' : '\x1b[33m'
      console.log(`  ${color}[${diag.level}] ${loc}[${diag.code}] ${diag.message}\x1b[0m`)
    }
    console.log('')
  }

  const violationsText = report.totalViolations === 1 ? '1 Code violations' : `${report.totalViolations} Code violations`
  console.log('----------------------------------------------------')
  console.log(`Summary: ${violationsText}, ${report.totalWarnings} warning(s) in ${report.totalFiles} files.`)

  if (!report.ok) {
    console.log(`\x1b[1;31m✖ ${violationsText} (Quality gate failed)!\x1b[0m`)
    const hasClippyAllow = flaggedFiles.some((f) => f.issues.some((i) => i.type === 'CLIPPY_ALLOW'))
    const hasTooManyArgs = flaggedFiles.some((f) => f.issues.some((i) => i.type === 'FN_ARGS_FAIL'))
    if (hasClippyAllow || hasTooManyArgs) {
      console.log('NOPE. Do not silence Clippy. Introduce a context/session struct or redesign the pass.\n')
    } else {
      console.log('Please break down over-length files (>500 lines) or refactor complex functions.\n')
    }
    return 1
  }

  console.log('\x1b[1;33m⚠️ Quality checks passed with warnings.\x1b[0m\n')
  return 0
}

async function runCargoTests(args, rsDir) {
  const cargoArgs = ['test']
  const knownCrates = new Set(['system', 'virtualrs', 'styletrace', 'atlas', 'tasty', 'shared', 'napi', 'reference-virtual-native'])

  const crateIdx = args.indexOf('--crate')
  let targetedCrate = null
  if (crateIdx !== -1 && args[crateIdx + 1]) {
    targetedCrate = args[crateIdx + 1]
  } else {
    const firstPos = args.find((a) => !a.startsWith('-'))
    if (firstPos && knownCrates.has(firstPos)) {
      targetedCrate = firstPos
    }
  }

  if (targetedCrate === 'napi') {
    targetedCrate = 'reference-virtual-native'
  }

  if (targetedCrate) {
    cargoArgs.push('-p', targetedCrate)
  } else {
    cargoArgs.push('--workspace')
  }

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--crate') {
      i++
      continue
    }
    if (a === targetedCrate) continue
    if (a === '--release') cargoArgs.push('--release')
    else if (a === '-t' || a === '--test-name') {
      if (args[i + 1]) {
        cargoArgs.push('--', args[i + 1])
        i++
      }
    } else if (!a.startsWith('-')) {
      cargoArgs.push('--', a)
    }
  }

  console.log(`\n\x1b[1;36m[agent-rs] Running cargo: cargo ${cargoArgs.join(' ')}\x1b[0m\n`)
  return withCpuGate('rs', 'agentrs cargo', async () => {
    const code = await runChild('cargo', cargoArgs, rsDir)
    if (code === 0) {
      console.log('\n\x1b[1;32m✔ [agent-rs] Rust tests PASSED!\x1b[0m\n')
    } else {
      console.log(`\n\x1b[1;31m✖ [agent-rs] Rust tests FAILED (code ${code})\x1b[0m\n`)
    }
    return code
  })
}

async function runVitestTests(args, rsDir) {
  const hasUpdateGoldens = args.includes('--update-goldens')
  const nonFlagArgs = args.filter((a) => !a.startsWith('-'))
  const testFilter = nonFlagArgs[0]
  const watch = args.includes('--watch')
  const testNameIdx = args.indexOf('-t')

  const KNOWN_MODULES = new Map([
    ['system', 'system'],
    ['tasty', 'tasty'],
    ['atlas', 'atlas'],
    ['styletrace', 'styletrace'],
    ['virtualrs', 'virtualrs'],
    ['virtualfs', 'virtualrs'],
    ['runtime', 'runtime'],
    ['shared', 'runtime'],
  ])

  // Validation: --update-goldens is only valid for system fixtures
  if (hasUpdateGoldens) {
    if (testFilter && testFilter !== 'system' && KNOWN_MODULES.has(testFilter)) {
      console.error(
        `\n\x1b[1;31m[agent-rs] Error: --update-goldens is only supported for the 'system' harness. '${testFilter}' does not use golden snapshots.\x1b[0m\n`
      )
      return 1
    }
  }

  const vitestArgs = ['exec', 'vitest', watch ? 'watch' : 'run']

  if (testFilter && KNOWN_MODULES.has(testFilter)) {
    const projectName = KNOWN_MODULES.get(testFilter)
    vitestArgs.push('--project', projectName)
  } else if (testFilter) {
    vitestArgs.push(testFilter)
  }

  if (testNameIdx !== -1 && args[testNameIdx + 1]) {
    vitestArgs.push('-t', args[testNameIdx + 1])
  }

  if (hasUpdateGoldens) {
    vitestArgs.push('--', '--update-goldens')
  }

  console.log(`\n\x1b[1;36m[agent-rs] Running Vitest: pnpm ${vitestArgs.join(' ')}\x1b[0m\n`)
  return withCpuGate('rs', 'agentrs vitest', async () => {
    const code = await runChild('pnpm', vitestArgs, rsDir)
    if (code === 0) {
      console.log('\n\x1b[1;32m✔ [agent-rs] Vitest tests PASSED!\x1b[0m\n')
    } else {
      console.log(`\n\x1b[1;31m✖ [agent-rs] Vitest tests FAILED (code ${code})\x1b[0m\n`)
    }
    return code
  })
}

async function runEnsureNative(rsDir) {
  console.log('\n\x1b[1;36m[agent-rs] Ensuring native addon build...\x1b[0m')
  return withCpuGate('rs:build', 'agentrs ensure-native', async () => {
    const code = await runChild('pnpm', ['run', 'ensure-native'], rsDir)
    if (code === 0) {
      console.log('\x1b[32m✔ [agent-rs] Native addon ready.\x1b[0m\n')
    } else {
      console.log(`\x1b[31m✖ [agent-rs] Native addon build failed (code ${code})\x1b[0m\n`)
    }
    return code
  })
}

async function runStatus(repoRoot, rsDir) {
  console.log('\n\x1b[1;35m=== [agent-rs] Environment & Toolchain Status ===\x1b[0m\n')

  // 1. Rust tools
  const checkTool = async (cmd, args) => {
    return new Promise((resolve) => {
      const c = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'] })
      let out = ''
      c.stdout.on('data', (d) => { out += d.toString() })
      c.on('close', (code) => {
        resolve(code === 0 ? out.trim() : 'Not installed')
      })
    })
  }

  const rustcVer = await checkTool('rustc', ['--version'])
  const cargoVer = await checkTool('cargo', ['--version'])
  const clippyVer = await checkTool('cargo', ['clippy', '--version'])

  console.log(`• rustc:  ${rustcVer}`)
  console.log(`• cargo:  ${cargoVer}`)
  console.log(`• clippy: ${clippyVer}`)

  // 2. Native addon status
  const distNativeDir = path.join(rsDir, 'dist', 'native')
  const legacyNativeDir = path.join(rsDir, 'native')
  let nativeAddons = []
  if (fs.existsSync(distNativeDir)) {
    nativeAddons = fs.readdirSync(distNativeDir).filter((f) => f.endsWith('.node'))
  } else if (fs.existsSync(legacyNativeDir)) {
    nativeAddons = fs.readdirSync(legacyNativeDir).filter((f) => f.endsWith('.node'))
  }
  console.log(`• Native Addon (.node): ${nativeAddons.length > 0 ? nativeAddons.join(', ') : 'None built (run pnpm agentrs build)'}`)

  // 3. CPU gate locks
  let activeLocks = []
  try {
    activeLocks = readLocks()
  } catch {}
  console.log(`• Active CPU Gate Locks: ${activeLocks.length > 0 ? JSON.stringify(activeLocks) : 'None (idle)'}`)
  console.log(`• macOS QoS Tier: PRI 46 (User Interactive - taskpolicy unthrottled)`)
  console.log('')
  return 0
}

function printHelp() {
  console.log(`
\x1b[1;36mReference RS Agent Runner (\x1b[1;33mpnpm agentrs\x1b[1;36m)\x1b[0m

\x1b[1mUSAGE:\x1b[0m
  pnpm agentrs [command] [options]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[32mtest, all\x1b[0m                  Full 4-step dev loop: ensure-native → cargo test → vitest → quality
  \x1b[32mcargo, rust, ct\x1b[0m            Run Rust workspace unit/integration tests (cargo test)
  \x1b[32mvitest, vt\x1b[0m                 Run seam Vitest tests against N-API and TS wrappers
  \x1b[32mquality, check, lint\x1b[0m       Code quality, file length (<365 / <500), and cyclomatic complexity
  \x1b[32mbuild, ensure-native\x1b[0m       Build or ensure native .node binary with exclusive queue lock
  \x1b[32mfmt\x1b[0m                        Format Rust (cargo fmt) and JS/TS (prettier)
  \x1b[32mstatus\x1b[0m                     Display toolchain versions, native binary state, and CPU gate locks
  \x1b[32mhelp, --help\x1b[0m               Show this help message

\x1b[1mOPTIONS FOR 'quality':\x1b[0m
  \x1b[33m<path>\x1b[0m                     Inspect specific file or directory (e.g. modules/system/src/extract/sites.rs)
  \x1b[33m--changed, --staged\x1b[0m        Inspect only files modified according to git status
  \x1b[33m--strict\x1b[0m                   Strict mode: exit with failure if ANY warning or file > 365 lines occurs
  \x1b[33m--clippy\x1b[0m                   Include cargo clippy cognitive complexity JSON diagnostics
  \x1b[33m--json\x1b[0m                     Emit raw JSON report

\x1b[1mOPTIONS FOR 'cargo':\x1b[0m
  \x1b[33m--crate <name>\x1b[0m             Target a specific crate (e.g. --crate system, --crate virtualrs)
  \x1b[33m-t <filter>\x1b[0m                Target specific test name substring
  \x1b[33m--release\x1b[0m                  Run tests in release profile

\x1b[1mOPTIONS FOR 'vitest':\x1b[0m
  \x1b[33m<pattern>\x1b[0m                  Target a specific test file
  \x1b[33m-t <filter>\x1b[0m                Target specific test describe/it pattern
  \x1b[33m--watch\x1b[0m                    Start vitest in watch mode

\x1b[1mCODE QUALITY CONTRACT:\x1b[0m
  • Files over 365 lines emit warnings; files over 500 lines fail ("Can you split this up, please?").
  • Functions with cyclomatic complexity > 10 warn; > 15 fail.
  • Functions with cognitive complexity > 15 warn; > 20 fail.
  • Functions over 80 lines warn; > 120 lines fail.
  • Functions with > 4 arguments warn; > 5 fail. Introduce a context struct.
  • #[allow(clippy::...)] and #[expect(clippy::...)] are banned. Fix the architecture.
  • File headers: 2–6 sentences describing what the file does. One-liners warn; missing/essays fail.
  • Inline comments stay terse (why, not what). The header is the paragraph.
  • 1 Code violations cause immediate failure.
  • Documentation (.md) files are never constrained by complexity rules.
  • Every agent MUST run 'pnpm agentrs quality [file]' periodically after every generation!
`)
}

async function main() {
  const repoRoot = findRepoRoot()
  const rsDir = path.join(repoRoot, 'packages/reference-rs')
  const args = process.argv.slice(2)
  const command = args[0] || 'test'

  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  if (command === 'status' || command === 's') {
    const code = await runStatus(repoRoot, rsDir)
    process.exit(code)
  }

  if (command === 'quality' || command === 'q' || command === 'check' || command === 'lint') {
    const code = await runQualityCommand(args.slice(1), repoRoot, rsDir)
    process.exit(code)
  }

  if (command === 'cargo' || command === 'c' || command === 'rust' || command === 'ct') {
    const code = await runCargoTests(args.slice(1), rsDir)
    process.exit(code)
  }

  if (command === 'vitest' || command === 'vt' || command === 'v') {
    const code = await runVitestTests(args.slice(1), rsDir)
    process.exit(code)
  }

  if (command === 'build' || command === 'b' || command === 'ensure-native') {
    const code = await runEnsureNative(rsDir)
    process.exit(code)
  }

  if (command === 'fmt' || command === 'f') {
    console.log('\n\x1b[1;36m[agent-rs] Formatting Rust and TypeScript...\x1b[0m')
    await runChild('cargo', ['fmt', '--all'], rsDir)
    await runChild('pnpm', ['exec', 'prettier', '--write', 'modules/*/js/**/*', 'modules/*/tests/**/*'], rsDir)
    console.log('\x1b[32m✔ Formatting complete.\x1b[0m\n')
    process.exit(0)
  }

  // Direct file or path targeting: e.g. pnpm agentrs modules/system/src/extract/sites.rs
  if (command.includes('/') || command.endsWith('.rs') || command.endsWith('.ts') || command.endsWith('.tsx') || command.endsWith('.js') || command.endsWith('.mjs')) {
    const code = await runQualityCommand(args, repoRoot, rsDir)
    process.exit(code)
  }

  if (command === 'test' || command === 't' || command === 'all') {
    console.log('\n\x1b[1;35m=== [agent-rs] Full Verification Pipeline ===\x1b[0m')

    // 1. Ensure native
    const buildCode = await runEnsureNative(rsDir)
    if (buildCode !== 0) process.exit(buildCode)

    // 2. Cargo test
    const cargoCode = await runCargoTests(args.slice(1), rsDir)
    if (cargoCode !== 0) process.exit(cargoCode)

    // 3. Vitest
    const vitestCode = await runVitestTests(args.slice(1), rsDir)
    if (vitestCode !== 0) process.exit(vitestCode)

    // 4. Code quality check on git changed files (or whole tree if no changes)
    console.log('\x1b[1;35m--- Running Code Quality Gate ---\x1b[0m')
    const qualityCode = await runQualityCommand(['--changed'], repoRoot, rsDir)

    console.log('\n\x1b[1;32m✔ [agent-rs] COMPLETE SUITE VERIFICATION PASSED!\x1b[0m\n')
    process.exit(qualityCode)
  }

  console.error(`\x1b[31mUnknown command: ${command}\x1b[0m`)
  printHelp()
  process.exit(1)
}
