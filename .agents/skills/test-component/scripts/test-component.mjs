#!/usr/bin/env node

/**
 * Component Test Runner for Reference UI
 *
 * Default loop: colocated Vitest unit tests, then Playwright CT in __e2e__.
 * Harvests video, screenshots, and visual-snapshot expected/actual/diff paths.
 */

import { spawnSync, execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function ensureQosJailbreak() {
  if (process.platform !== 'darwin') return false
  if (process.env.__AGENT_CLI_JAILBROKEN === '1') return false

  const args = [
    '-a',
    '-d', 'default',
    '-t', '0',
    '-l', '0',
    process.execPath,
    __filename,
    ...process.argv.slice(2),
  ]

  const child = spawnSync('taskpolicy', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      __AGENT_CLI_JAILBROKEN: '1',
      FORCE_COLOR: '1',
    },
    cwd: process.cwd(),
  })

  process.exit(child.status ?? 0)
}

ensureQosJailbreak()

export function findRepoRoot(startDir = __dirname) {
  let cur = startDir
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'pnpm-workspace.yaml'))) return cur
    cur = path.dirname(cur)
  }
  return process.cwd()
}

function resolveAttachmentPath(attachment) {
  if (!attachment?.path) return null
  return path.resolve(attachment.path)
}

function isSnapshotName(name = '') {
  const n = name.toLowerCase()
  return n === 'expected' || n === 'actual' || n === 'diff' || n.includes('expected') || n.includes('actual') || n.includes('diff')
}

const repoRoot = findRepoRoot(__dirname)
const libDir = path.join(repoRoot, 'packages/reference-lib')
const playwrightDir = path.join(libDir, 'playwright')
const resultsDir = path.join(playwrightDir, 'test-results')
const resultsJsonPath = path.join(resultsDir, 'results.json')
const vitestJsonPath = path.join(resultsDir, 'vitest.json')
const configPath = path.join(playwrightDir, 'playwright.config.ts')

const args = process.argv.slice(2)
let component = ''
let grep = ''
let isJson = false
let isClean = false
let isHeaded = false
let updateSnapshots = false
let confirmSnapshotUpdate = false
let runUnit = true
let runE2e = true
let unitOnly = false
let e2eOnly = false

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--json') {
    isJson = true
  } else if (arg === '--clean') {
    isClean = true
  } else if (arg === '--headed') {
    isHeaded = true
  } else if (arg === '--update-snapshots' || arg === '-u') {
    updateSnapshots = true
  } else if (arg === '--confirm') {
    confirmSnapshotUpdate = true
  } else if (arg === '--unit') {
    unitOnly = true
  } else if (arg === '--e2e') {
    e2eOnly = true
  } else if (arg === '-g' || arg === '--grep') {
    grep = args[++i] || ''
  } else if (!arg.startsWith('-') && !component) {
    component = arg
  }
}

if (updateSnapshots && !confirmSnapshotUpdate) {
  console.error(`
[test-component] Refusing --update-snapshots without human verification.

Only update snapshots if they are genuinely updating styling, and it always has human verification.

1. Show expected / actual / diff in chat.
2. Wait for an explicit human yes.
3. Then re-run:
   pnpm ct ${component || '<Component>'} --e2e --update-snapshots --confirm
`)
  process.exit(2)
}

if (unitOnly && !e2eOnly) runE2e = false
if (e2eOnly && !unitOnly) runUnit = false

if (isClean && fs.existsSync(resultsDir)) {
  fs.rmSync(resultsDir, { recursive: true, force: true })
}

fs.mkdirSync(resultsDir, { recursive: true })
for (const p of [resultsJsonPath, vitestJsonPath]) {
  if (fs.existsSync(p)) {
    try {
      fs.unlinkSync(p)
    } catch {}
  }
}

let pnpmCmd = 'pnpm'
try {
  pnpmCmd = execSync('which pnpm', { encoding: 'utf-8' }).trim() || 'pnpm'
} catch {}

function spawnPnpm(pnpmArgs, { cwd, extraEnv = {} } = {}) {
  return spawnSync(pnpmCmd, pnpmArgs, {
    cwd,
    env: {
      ...process.env,
      FORCE_COLOR: '1',
      ...extraEnv,
    },
    stdio: isJson ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf-8',
  })
}

let unitResult = {
  ran: false,
  ok: true,
  passed: 0,
  failed: 0,
  total: 0,
  tests: [],
  error: null,
}

if (runUnit) {
  const vitestArgs = ['exec', 'vitest', 'run', '--reporter=default', '--reporter=json', '--outputFile', vitestJsonPath]
  if (component) {
    vitestArgs.push(`src/components/${component}`)
  }
  if (grep) {
    vitestArgs.push('-t', grep)
  }

  if (!isJson) {
    console.log('\n=======================================================')
    console.log(` Unit (Vitest): ${component || 'All'} `)
    console.log('=======================================================')
  }

  const child = spawnPnpm(vitestArgs, { cwd: libDir })
  unitResult.ran = true
  unitResult.ok = child.status === 0

  if (fs.existsSync(vitestJsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(vitestJsonPath, 'utf-8'))
      const tests = []
      const suites = parsed.testResults || parsed
      const collect = (suite) => {
        if (!suite) return
        if (Array.isArray(suite.assertionResults)) {
          for (const t of suite.assertionResults) {
            tests.push({
              title: t.title || t.fullName,
              file: suite.name || suite.file,
              status: t.status,
              durationMs: t.duration,
              error: t.failureMessages?.[0] || null,
            })
          }
        }
        for (const childSuite of suite.suites || []) collect(childSuite)
      }
      if (Array.isArray(suites)) {
        for (const s of suites) collect(s)
      }
      unitResult.tests = tests
      unitResult.total = tests.length || parsed.numTotalTests || 0
      unitResult.passed = tests.filter((t) => t.status === 'passed').length || parsed.numPassedTests || 0
      unitResult.failed = tests.filter((t) => t.status === 'failed').length || parsed.numFailedTests || 0
    } catch (err) {
      unitResult.error = err.message
    }
  }

  if (!unitResult.ok && !isJson) {
    console.log('\n✖ Unit tests failed. Continuing to e2e unless --unit was passed.')
  }
}

const e2eRuns = []
let e2eChildStatus = 0
let e2eRan = false

if (runE2e) {
  const pwArgs = ['exec', 'playwright', 'test', '-c', configPath]
  if (component) {
    pwArgs.push(`src/components/${component}/__e2e__`)
  }
  if (grep) {
    pwArgs.push('-g', grep)
  }
  if (isHeaded) {
    pwArgs.push('--headed')
  }
  if (updateSnapshots) {
    pwArgs.push('--update-snapshots')
  }
  pwArgs.push('--reporter=list,json')

  if (!isJson) {
    console.log('\n=======================================================')
    console.log(` E2E (Playwright CT): ${component || 'All'} `)
    console.log('=======================================================')
  }

  const child = spawnPnpm(pwArgs, {
    cwd: libDir,
    extraEnv: { PLAYWRIGHT_JSON_OUTPUT_NAME: resultsJsonPath },
  })
  e2eRan = true
  e2eChildStatus = child.status ?? 0

  let parsedResults = null
  if (fs.existsSync(resultsJsonPath)) {
    try {
      parsedResults = JSON.parse(fs.readFileSync(resultsJsonPath, 'utf-8'))
    } catch (err) {
      if (!isJson) {
        console.warn(`[test-component] Warning: Could not parse results.json: ${err.message}`)
      }
    }
  }

  function extractTests(suite) {
    if (!suite) return
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const t of spec.tests || []) {
          for (const result of t.results || []) {
            let videoPath = null
            let screenshotPath = null
            let snapshotExpected = null
            let snapshotActual = null
            let snapshotDiff = null

            for (const attachment of result.attachments || []) {
              const resolved = resolveAttachmentPath(attachment)
              if (!resolved) continue
              const name = (attachment.name || '').toLowerCase()
              if (name === 'video' || attachment.contentType?.includes('video')) {
                videoPath = resolved
              } else if (name === 'expected') {
                snapshotExpected = resolved
              } else if (name === 'actual') {
                snapshotActual = resolved
              } else if (name === 'diff') {
                snapshotDiff = resolved
              } else if (!isSnapshotName(name) && (name === 'screenshot' || attachment.contentType?.includes('image'))) {
                screenshotPath = resolved
              }
            }

            if (!videoPath || !screenshotPath) {
              const testDirMatch = fs.existsSync(resultsDir)
                ? fs.readdirSync(resultsDir).find((d) =>
                    d.includes((spec.title || '').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 30)),
                  )
                : null

              if (testDirMatch) {
                const fullDir = path.join(resultsDir, testDirMatch)
                if (fs.existsSync(fullDir) && fs.statSync(fullDir).isDirectory()) {
                  const files = fs.readdirSync(fullDir)
                  if (!videoPath) {
                    const v = files.find((f) => f.endsWith('.webm'))
                    if (v) videoPath = path.join(fullDir, v)
                  }
                  if (!screenshotPath) {
                    const s = files.find((f) => f.endsWith('.png'))
                    if (s) screenshotPath = path.join(fullDir, s)
                  }
                  if (!snapshotDiff) {
                    const diff = files.find((f) => f.includes('diff') && f.endsWith('.png'))
                    if (diff) snapshotDiff = path.join(fullDir, diff)
                  }
                }
              }
            }

            e2eRuns.push({
              title: spec.title,
              file: spec.file,
              status: result.status,
              durationMs: result.duration,
              videoPath,
              screenshotPath,
              snapshotExpected,
              snapshotActual,
              snapshotDiff,
              error: result.error?.message || null,
            })
          }
        }
      }
    }

    for (const childSuite of suite.suites || []) {
      extractTests(childSuite)
    }
  }

  if (parsedResults?.suites) {
    for (const s of parsedResults.suites) {
      extractTests(s)
    }
  }
}

const e2ePassed = e2eRuns.filter((t) => t.status === 'passed').length
const e2eFailed = e2eRuns.filter((t) => t.status === 'failed' || t.status === 'timedOut').length
const e2eOk = !e2eRan || (e2eChildStatus === 0 && e2eFailed === 0)
const ok = unitResult.ok && e2eOk

if (isJson) {
  console.log(
    JSON.stringify(
      {
        ok,
        component: component || 'all',
        unit: unitResult,
        e2e: {
          ran: e2eRan,
          ok: e2eOk,
          passed: e2ePassed,
          failed: e2eFailed,
          total: e2eRuns.length,
          tests: e2eRuns,
        },
      },
      null,
      2,
    ),
  )
} else {
  if (e2eRan) {
    console.log('\n=======================================================')
    console.log(` Component Test Verification: ${component || 'All'} `)
    console.log('=======================================================')

    if (e2eRuns.length === 0) {
      console.log(`No component tests (__e2e__/*.ct.spec.ts) found matching: ${component || '*'}`)
    } else {
      for (const t of e2eRuns) {
        const mark = t.status === 'passed' ? '✔' : '✖'
        const statusLabel = t.status.toUpperCase()
        console.log(`\n${mark} [${statusLabel}] ${t.title} (${t.durationMs}ms)`)
        if (t.videoPath) {
          console.log(`  🎥 Video:      ${t.videoPath}`)
        }
        if (t.screenshotPath) {
          console.log(`  📸 Screenshot: ${t.screenshotPath}`)
        }
        if (t.snapshotDiff || t.snapshotActual || t.snapshotExpected) {
          console.log('  🖼  Snapshot mismatch:')
          if (t.snapshotExpected) console.log(`     expected: ${t.snapshotExpected}`)
          if (t.snapshotActual) console.log(`     actual:   ${t.snapshotActual}`)
          if (t.snapshotDiff) console.log(`     diff:     ${t.snapshotDiff}`)
        }
        if (t.error) {
          console.log(`  ⚠ Error:      ${t.error}`)
        }
      }

      console.log('\n-------------------------------------------------------')
      console.log(`E2E: ${e2eRuns.length} | Passed: ${e2ePassed} | Failed: ${e2eFailed}`)
      if (unitResult.ran) {
        console.log(`Unit: ${unitResult.ok ? 'passed' : 'failed'} | ${unitResult.total} tests`)
      }
      console.log('-------------------------------------------------------')

      if (e2eRuns.some((t) => t.videoPath)) {
        console.log('\n💡 Agents: `view_file` each video.webm to verify motion and exit transitions.')
      }
      if (e2eRuns.some((t) => t.snapshotDiff)) {
        console.log('💡 Agents: `view_file` snapshot diff/actual/expected. Do not update baselines yet.')
        console.log('   Only update snapshots if they are genuinely updating styling, and it always has human verification.')
        console.log('   After an explicit human yes: pnpm ct <Component> --e2e --update-snapshots --confirm')
      }
    }
  } else if (unitResult.ran) {
    console.log('\n-------------------------------------------------------')
    console.log(`Unit: ${unitResult.ok ? 'passed' : 'failed'} | ${unitResult.total} tests`)
    console.log('-------------------------------------------------------')
  }
}

if (!ok) process.exit(1)
process.exit(0)
