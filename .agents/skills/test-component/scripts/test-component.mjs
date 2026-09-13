#!/usr/bin/env node

/**
 * Component Test Runner for Reference UI (`pnpm ct`)
 *
 * Default: colocated Vitest, then Playwright CT on workspace React 19.
 * `--react 17|18|19|all` pins the CT Vite gallery via @ct-runtime packages (no pipeline).
 * Visual snapshots run on React 19 only. Snapshot writes need --update-snapshots --confirm.
 */

import { spawn, spawnSync, execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import net from 'node:net'

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


const SOCKET_PATH = '/tmp/ref-ct-agent.sock'
const DAEMON_PID_FILE = '/tmp/ref-ct-agent.pid'
const QUEUE_DIR = '/tmp/ref-ct-agent-queue'
const LOCK_FILE = path.join(QUEUE_DIR, 'active.lock')
const MAX_CONCURRENCY = Math.min(4, Math.max(1, Math.floor(os.cpus().length * 0.25)))

// Queue Lock Logic
function isPidAlive(pid) {
  if (!pid || typeof pid !== 'number' || isNaN(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err.code === 'EPERM'
  }
}

function withFileMutex(action) {
  const mutexPath = path.join(QUEUE_DIR, '.lock_mutex')
  const startTime = Date.now()
  let acquired = false
  while (!acquired && Date.now() - startTime < 5000) {
    try {
      fs.mkdirSync(mutexPath)
      acquired = true
    } catch {
      try {
        const stat = fs.statSync(mutexPath)
        if (Date.now() - stat.mtimeMs > 5000) {
          fs.rmdirSync(mutexPath)
        }
      } catch {}
      const end = Date.now() + 20
      while (Date.now() < end) {}
    }
  }
  try {
    return action()
  } finally {
    if (acquired) {
      try { fs.rmdirSync(mutexPath) } catch {}
    }
  }
}

async function acquireQueueLock(taskInfo = {}) {
  try {
    fs.mkdirSync(QUEUE_DIR, { recursive: true })
  } catch {}

  const now = Date.now().toString().padStart(16, '0')
  const myPid = process.pid
  const rand = Math.random().toString(36).slice(2, 6)
  const entryFilename = `${now}-${myPid}-${rand}.json`
  const entryPath = path.join(QUEUE_DIR, entryFilename)

  const entryData = {
    pid: myPid,
    createdAt: Date.now(),
    task: taskInfo,
  }

  try {
    fs.writeFileSync(entryPath, JSON.stringify(entryData, null, 2))
  } catch (err) {
    console.warn(`[agent-queue] Warning: Could not write queue entry: ${err.message}`)
  }

  let cleanUpDone = false
  const cleanup = () => {
    if (cleanUpDone) return
    cleanUpDone = true
    try {
      if (fs.existsSync(entryPath)) fs.unlinkSync(entryPath)
    } catch {}
    try {
      withFileMutex(() => {
        if (fs.existsSync(LOCK_FILE)) {
          const raw = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'))
          const parsed = Array.isArray(raw) ? raw : (raw && raw.pid ? [raw] : [])
          const remaining = parsed.filter(l => l.pid !== myPid && isPidAlive(l.pid))
          if (remaining.length === 0) {
            try { fs.unlinkSync(LOCK_FILE) } catch {}
          } else {
            fs.writeFileSync(LOCK_FILE, JSON.stringify(remaining, null, 2))
          }
        }
      })
    } catch {}
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('exit', cleanup)

  let loggedWait = false
  let lastLogTime = 0

  while (true) {
    let files = []
    try {
      files = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json'))
    } catch {}

    const validEntries = []
    for (const f of files) {
      const fPath = path.join(QUEUE_DIR, f)
      try {
        const data = JSON.parse(fs.readFileSync(fPath, 'utf-8'))
        if (isPidAlive(data.pid)) {
          validEntries.push({ file: f, data })
        } else {
          try { fs.unlinkSync(fPath) } catch {}
        }
      } catch {}
    }

    validEntries.sort((a, b) => a.file.localeCompare(b.file))
    const myIndex = validEntries.findIndex(e => e.file === entryFilename)

    let acquired = false
    let activeLocks = []
    let assignedSlot = 0
    withFileMutex(() => {
      if (fs.existsSync(LOCK_FILE)) {
        try {
          const raw = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'))
          const parsed = Array.isArray(raw) ? raw : (raw && raw.pid ? [raw] : [])
          const aliveLocks = parsed.filter(l => isPidAlive(l.pid))
          if (aliveLocks.length !== parsed.length) {
            if (aliveLocks.length === 0) {
              try { fs.unlinkSync(LOCK_FILE) } catch {}
            } else {
              try { fs.writeFileSync(LOCK_FILE, JSON.stringify(aliveLocks, null, 2)) } catch {}
            }
          }
          activeLocks = aliveLocks
        } catch {
          try { fs.unlinkSync(LOCK_FILE) } catch {}
        }
      }

      if (myIndex >= 0 && myIndex < MAX_CONCURRENCY) {
        const usedSlots = new Set(activeLocks.map(l => l.slotIndex))
        for (let i = 0; i < MAX_CONCURRENCY; i++) {
          if (!usedSlots.has(i)) {
            assignedSlot = i
            break
          }
        }
        
        const lockPayload = {
          pid: myPid,
          entryFile: entryFilename,
          acquiredAt: Date.now(),
          task: taskInfo,
          slotIndex: assignedSlot
        }
        const existingIdx = activeLocks.findIndex(l => l.pid === myPid)
        if (existingIdx >= 0) {
          activeLocks[existingIdx] = lockPayload
          assignedSlot = activeLocks[existingIdx].slotIndex
        } else {
          activeLocks.push(lockPayload)
        }
        try {
          fs.writeFileSync(LOCK_FILE, JSON.stringify(activeLocks, null, 2))
        } catch {}
        acquired = true
      }
    })

    if (acquired) {
      if (loggedWait) {
        console.log(`[agent-queue] Turn reached (PID ${myPid}, slot ${assignedSlot + 1}/${MAX_CONCURRENCY}). Starting execution...`)
      }
      return {
        slotIndex: assignedSlot,
        release: async () => {
          cleanup()
          process.off('SIGINT', cleanup)
          process.off('SIGTERM', cleanup)
          process.off('exit', cleanup)
        }
      }
    }

    const queuePos = myIndex >= 0 ? myIndex + 1 : validEntries.length + 1
    const activePids = activeLocks.map(l => l.pid).join(', ') || 'none'
    const nowMs = Date.now()

    if (!loggedWait || nowMs - lastLogTime > 10000) {
      console.log(`[agent-queue] Maximum concurrency reached (${activeLocks.length}/${MAX_CONCURRENCY} active PIDs: ${activePids}). Waiting in queue (position ${queuePos} of ${validEntries.length || 1})...`)
      loggedWait = true
      lastLogTime = nowMs
    }

    await new Promise(r => setTimeout(r, 1000))
  }
}

async function withQueueLock(taskInfo, fn) {
  const { slotIndex, release } = await acquireQueueLock(taskInfo)
  try {
    return await fn(slotIndex)
  } finally {
    await release()
  }
}

function numericExitCode(code) {
  if (typeof code === 'number' && Number.isFinite(code)) return code | 0
  return 1
}

async function startDaemon() {
  if (fs.existsSync(SOCKET_PATH)) {
    const isAlive = await new Promise((resolve) => {
      const probe = net.createConnection(SOCKET_PATH, () => {
        probe.destroy()
        resolve(true)
      })
      probe.on('error', () => {
        try { fs.unlinkSync(SOCKET_PATH) } catch {}
        try { fs.unlinkSync(DAEMON_PID_FILE) } catch {}
        resolve(false)
      })
    })

    if (isAlive) {
      console.log(`[agent-daemon] An agent daemon is already running at ${SOCKET_PATH}.`)
      process.exit(0)
    }
  }

  const queue = []
  const activeJobs = new Set()

  function processQueue() {
    while (activeJobs.size < MAX_CONCURRENCY && queue.length > 0) {
      const job = queue.shift()
      activeJobs.add(job)
      const { socket, req } = job

      queue.forEach((item, idx) => {
        try {
          item.socket.write(JSON.stringify({ type: 'queue', position: idx + 1, total: queue.length }) + '\n')
        } catch {}
      })

      console.log(`
[agent-daemon] Starting execution (${activeJobs.size}/${MAX_CONCURRENCY} active): ${req.cmd} ${req.args.join(' ')}`)
      try {
        socket.write(JSON.stringify({ type: 'start' }) + '\n')
      } catch {}

      let child = null
      let settled = false

      const finishJob = () => {
        if (settled) return
        settled = true
        activeJobs.delete(job)
        processQueue()
      }

      try {
        child = spawn(req.cmd, req.args, {
          stdio: ['ignore', 'pipe', 'pipe'],
          cwd: req.cwd || repoRoot,
          env: { ...process.env, ...req.env, FORCE_COLOR: '1' },
        })

        child.stdout.on('data', (data) => {
          process.stdout.write(data)
          try {
            socket.write(JSON.stringify({ type: 'stdout', data: data.toString() }) + '\n')
          } catch {}
        })

        child.stderr.on('data', (data) => {
          process.stderr.write(data)
          try {
            socket.write(JSON.stringify({ type: 'stderr', data: data.toString() }) + '\n')
          } catch {}
        })

        const onJobEnd = (code, signal) => {
          console.log(`[agent-daemon] Finished with code ${code ?? 0}`)
          try {
            socket.write(JSON.stringify({ type: 'exit', code: numericExitCode(code), signal }) + '\n')
            socket.end()
          } catch {}
          finishJob()
        }

        child.on('exit', onJobEnd)
        child.on('error', (err) => {
          console.error(`[agent-daemon] Process error:`, err)
          try {
            socket.write(JSON.stringify({ type: 'error', error: err.message }) + '\n')
            socket.end()
          } catch {}
          finishJob()
        })
      } catch (err) {
        try {
          socket.write(JSON.stringify({ type: 'error', error: err.message }) + '\n')
          socket.end()
        } catch {}
        finishJob()
      }

      socket.on('close', () => {
        if (activeJobs.has(job) && child) {
          console.log(`[agent-daemon] Client disconnected while job was running. Terminating child process...`)
          try {
            if (child.pid) process.kill(-child.pid, 'SIGTERM')
          } catch {}
          try { child.kill('SIGTERM') } catch {}
          finishJob()
        }
      })
    }
  }

  const server = net.createServer((socket) => {
    let buffer = ''
    socket.on('data', async (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const req = JSON.parse(line.trim())
          const job = { socket, req }
          queue.push(job)

          if (activeJobs.size >= MAX_CONCURRENCY) {
            const pos = queue.length
            console.log(`[agent-daemon] Job queued (position ${pos}): ${req.cmd} ${req.args.join(' ')}`)
            try {
              socket.write(JSON.stringify({ type: 'queue', position: pos, total: queue.length }) + '\n')
            } catch {}
          } else {
            processQueue()
          }

          socket.on('close', () => {
            const idx = queue.indexOf(job)
            if (idx !== -1) {
              queue.splice(idx, 1)
              console.log(`[agent-daemon] Queued job canceled (client disconnected)`)
            }
          })
        } catch (err) {
          try {
            socket.write(JSON.stringify({ type: 'error', error: err.message }) + '\n')
            socket.end()
          } catch {}
        }
      }
    })
  })

  server.listen(SOCKET_PATH, () => {
    fs.writeFileSync(DAEMON_PID_FILE, String(process.pid))
    console.log(`[agent-daemon] Reference UI Agent Daemon listening at ${SOCKET_PATH}`)
    console.log(`[agent-daemon] PID: ${process.pid}`)
    console.log(`[agent-daemon] Parallel execution queue active (max concurrency: ${MAX_CONCURRENCY}). Keep this terminal open to run tasks.`)
  })

  let isCleaningUp = false
  const cleanup = (code = 0) => {
    if (isCleaningUp) return
    isCleaningUp = true
    try { fs.unlinkSync(SOCKET_PATH) } catch {}
    try { fs.unlinkSync(DAEMON_PID_FILE) } catch {}
    try { server.close() } catch {}
    process.exit(code)
  }

  process.on('SIGINT', () => cleanup(0))
  process.on('SIGTERM', () => cleanup(0))
  process.on('SIGHUP', () => cleanup(0))
  process.on('exit', () => {
    try { fs.unlinkSync(SOCKET_PATH) } catch {}
    try { fs.unlinkSync(DAEMON_PID_FILE) } catch {}
  })
}

const repoRoot = findRepoRoot(__dirname)
const libDir = path.join(repoRoot, 'packages/reference-lib')
const playwrightDir = path.join(libDir, 'playwright')
const resultsDir = path.join(playwrightDir, 'test-results')
const resultsJsonPath = path.join(resultsDir, 'results.json')
const vitestJsonPath = path.join(resultsDir, 'vitest.json')
const configPath = path.join(playwrightDir, 'playwright.config.ts')
const CT_PORT = process.env.CT_PORT ? parseInt(process.env.CT_PORT, 10) : 3101
const activeChildPids = new Set()
let ctGalleryOwned = false
let activeSlotPort = null

function usage() {
  console.log(`
Usage: pnpm ct [Component] [options]

  pnpm ct Popover                 Unit then e2e on React 19 (snapshots on)
  pnpm ct Popover --unit        Vitest only (always workspace React 19)
  pnpm ct Popover --e2e        Playwright CT only
  pnpm ct Popover --react 18   CT against @ct-runtime/react-18 (no snapshots)
  pnpm ct Popover --react all   CT on 17, then 18, then 19
  pnpm ct Popover -g "escape"   Name filter (unit -t and Playwright -g)

  --headed                     Playwright headed
  --clean                      Wipe playwright/test-results
  --json                       Machine-readable summary
  --update-snapshots --confirm   Rewrite React 19 baselines (human yes required)

React 17/18/19 are isolated @ct-runtime packages. Not the matrix pipeline.
Visual snapshots are React 19 only. Do not combine --update-snapshots with --react 17 or 18.
`)
}

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
let reactArg = ''

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === 'daemon') {
    startDaemon()
    await new Promise(() => {})
  } else if (arg === '--help' || arg === '-h') {
    usage()
    process.exit(0)
  } else if (arg === '--json') {
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
  } else if (arg === '--react') {
    const next = args[i + 1]
    if (!next || next.startsWith('-')) {
      console.error('[test-component] --react needs 17, 18, 19, or all. Example: pnpm ct Popover --e2e --react 18')
      process.exit(2)
    }
    reactArg = args[++i]
  } else if (arg === '-g' || arg === '--grep') {
    grep = args[++i] || ''
  } else if (!arg.startsWith('-') && !component) {
    component = arg
  } else if (arg.startsWith('-')) {
    console.error(`[test-component] Unknown flag: ${arg}`)
    usage()
    process.exit(2)
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

const CT_REACT_ALL = ['17', '18', '19']

function parseReactRuntimes(raw) {
  if (!raw) return []
  if (raw === 'all') return [...CT_REACT_ALL]
  const versions = raw.split(',').map((s) => s.trim().replace(/^react/i, '')).filter(Boolean)
  for (const v of versions) {
    if (!CT_REACT_ALL.includes(v)) {
      console.error(`[test-component] Unknown React runtime "${v}". Use 17, 18, 19, or all.`)
      process.exit(2)
    }
  }
  return versions
}

const reactRuntimes = parseReactRuntimes(reactArg)

if (updateSnapshots && reactRuntimes.some((v) => v !== '19')) {
  console.error(`
[test-component] Visual snapshots are React 19 only.

Do not pass --update-snapshots with --react 17, 18, or all.
Update baselines on the default runtime:

   pnpm ct ${component || '<Component>'} --e2e --update-snapshots --confirm
`)
  process.exit(2)
}

function assertRuntimeInstalled(runtime) {
  const runtimeDir = path.join(playwrightDir, 'runtimes', `react-${runtime}`)
  const pkg = path.join(runtimeDir, 'package.json')
  if (!fs.existsSync(pkg)) {
    console.error(`[test-component] Missing @ct-runtime/react-${runtime} at ${pkg}. Run pnpm install.`)
    process.exit(2)
  }
  const reactPkg = path.join(runtimeDir, 'node_modules', 'react', 'package.json')
  if (!fs.existsSync(reactPkg)) {
    console.error(`[test-component] @ct-runtime/react-${runtime} has no react install at ${reactPkg}. Run pnpm install.`)
    process.exit(2)
  }
}

if (runE2e) {
  const installed = reactRuntimes.length > 0 ? reactRuntimes : ['19']
  for (const runtime of installed) {
    assertRuntimeInstalled(runtime)
  }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function getPidsOnPort(port) {
  try {
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, { encoding: 'utf-8' }).trim()
    if (!out) return []
    return out.split(/\s+/).map((p) => parseInt(p, 10)).filter((p) => !Number.isNaN(p) && p > 0)
  } catch {
    return []
  }
}

function freePort(port, logPrefix = '[test-component]') {
  const pids = getPidsOnPort(port)
  if (pids.length === 0) return
  for (const pid of pids) {
    try { process.kill(pid, 'SIGTERM') } catch {}
  }
  sleepSync(150)
  for (const pid of getPidsOnPort(port)) {
    try { process.kill(pid, 'SIGKILL') } catch {}
  }
  const start = Date.now()
  while (Date.now() - start < 2000 && getPidsOnPort(port).length > 0) {
    sleepSync(50)
  }
  if (!isJson) {
    console.log(`${logPrefix} Cleared stale listener on port ${port} (terminated PID ${pids.join(', ')})`)
  }
}

function killProcessGroup(pid, signal = 'SIGTERM') {
  if (!pid || typeof pid !== 'number' || pid <= 0) return
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' })
      return
    }
    process.kill(-pid, signal)
  } catch {
    try { process.kill(pid, signal) } catch {}
  }
}

function teardownActiveChildren(signal = 'SIGKILL') {
  for (const pid of [...activeChildPids]) {
    killProcessGroup(pid, signal)
  }
  activeChildPids.clear()
}

function startParentDeathWatch(childPid) {
  if (process.platform === 'win32' || !childPid || childPid <= 0) return null
  const parentPid = process.pid
  const watcher = spawn('/bin/sh', ['-c', [
    `while kill -0 ${parentPid} 2>/dev/null; do sleep 1; done`,
    `kill -TERM -- -${childPid} 2>/dev/null || kill -TERM ${childPid} 2>/dev/null`,
    'sleep 0.4',
    `kill -KILL -- -${childPid} 2>/dev/null || kill -KILL ${childPid} 2>/dev/null`,
  ].join('\n')], {
    detached: true,
    stdio: 'ignore',
  })
  watcher.unref()
  return watcher
}

function stopParentDeathWatch(watcher) {
  if (!watcher?.pid) return
  try { process.kill(watcher.pid, 'SIGKILL') } catch {}
}

function cleanupCtGallery() {
  teardownActiveChildren('SIGKILL')
  if (!ctGalleryOwned) return
  if (activeSlotPort) {
    try { freePort(activeSlotPort) } catch {}
    activeSlotPort = null
  }
}

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

let interrupted = false

function spawnPnpmDetached(pnpmArgs, { cwd, extraEnv = {} } = {}) {
  return new Promise((resolve) => {
    const child = spawn(pnpmCmd, pnpmArgs, {
      cwd,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
        ...extraEnv,
      },
      stdio: isJson ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      detached: process.platform !== 'win32',
    })

    if (child.pid) activeChildPids.add(child.pid)
    const parentDeathWatch = startParentDeathWatch(child.pid)
    let settled = false

    const killTree = (sig = 'SIGTERM') => {
      if (child.pid) killProcessGroup(child.pid, sig)
      try { child.kill(sig) } catch {}
    }

    const finish = (status) => {
      if (settled) return
      settled = true
      stopParentDeathWatch(parentDeathWatch)
      if (child.pid) activeChildPids.delete(child.pid)
      process.off('SIGINT', onSig)
      process.off('SIGTERM', onSig)
      process.off('SIGHUP', onSig)
      resolve({ status: typeof status === 'number' ? status : 1 })
    }

    const onSig = () => {
      interrupted = true
      killTree('SIGTERM')
      setTimeout(() => {
        killTree('SIGKILL')
        if (activeSlotPort) {
          try { freePort(activeSlotPort) } catch {}
          activeSlotPort = null
        }
      }, 400)
    }

    process.on('SIGINT', onSig)
    process.on('SIGTERM', onSig)
    process.on('SIGHUP', onSig)

    child.on('exit', (code) => finish(code ?? 1))
    child.on('error', () => finish(1))
  })
}

process.on('exit', () => {
  cleanupCtGallery()
})

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

function extractTests(suite, react) {
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
            react,
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
    extractTests(childSuite, react)
  }
}

async function runE2eSuites() {
  if (!runE2e) return

  const e2eTargets = reactRuntimes.length > 0 ? reactRuntimes : [null]
  ctGalleryOwned = true

  for (const runtime of e2eTargets) {
    if (interrupted) break

    const pwArgs = ['exec', 'playwright', 'test', '-c', configPath]
    if (component) {
      pwArgs.push(`${component}/__e2e__`)
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

    const label = runtime ? `react${runtime}` : 'react19'
    const runtimeResultsPath = path.join(resultsDir, runtime ? `results-${component || 'all'}-react${runtime}.json` : `results-${component || 'all'}.json`)

    if (!isJson) {
      console.log('\n=======================================================')
      console.log(` E2E (Playwright CT): ${component || 'All'} [${label}] `)
      if (runtime && runtime !== '19') {
        console.log(' Visual snapshots: skipped (React 19 only)')
      }
      console.log('=======================================================')
    }

    await withQueueLock({ cmd: 'playwright', component }, async (slotIndex) => {
      let currentPort = 3101 + slotIndex
      activeSlotPort = currentPort
      freePort(currentPort)

      const extraEnv = {
        PLAYWRIGHT_JSON_OUTPUT_NAME: runtimeResultsPath,
        CT_PORT: String(currentPort),
      }
      if (runtime) {
        extraEnv.CT_REACT = runtime
      }

      const child = await spawnPnpmDetached(pwArgs, {
        cwd: libDir,
        extraEnv,
      })
      e2eRan = true
      if ((child.status ?? 0) !== 0) e2eChildStatus = child.status ?? 1

      freePort(currentPort)
      activeSlotPort = null
    })

    let parsedResults = null
    if (fs.existsSync(runtimeResultsPath)) {
      try {
        parsedResults = JSON.parse(fs.readFileSync(runtimeResultsPath, 'utf-8'))
      } catch (err) {
        if (!isJson) {
          console.warn(`[test-component] Warning: Could not parse results.json: ${err.message}`)
        }
      }
    }

    if (parsedResults?.suites) {
      for (const s of parsedResults.suites) {
        extractTests(s, label)
      }
    }
  }
}

await runE2eSuites()

const e2ePassed = e2eRuns.filter((t) => t.status === 'passed').length
const e2eFailed = e2eRuns.filter((t) => t.status === 'failed' || t.status === 'timedOut').length
const e2eOk = !e2eRan || (!interrupted && e2eChildStatus === 0 && e2eFailed === 0)
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
          react: reactRuntimes.length > 0 ? reactRuntimes.map((v) => `react${v}`) : ['react19'],
          snapshots: reactRuntimes.length === 0 || reactRuntimes.includes('19'),
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
        const reactLabel = t.react ? ` ${t.react}` : ''
        console.log(`\n${mark} [${statusLabel}]${reactLabel} ${t.title} (${t.durationMs}ms)`)
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
      const byReact = new Map()
      for (const t of e2eRuns) {
        const key = t.react || 'react19'
        const row = byReact.get(key) || { passed: 0, failed: 0 }
        if (t.status === 'passed') row.passed++
        else row.failed++
        byReact.set(key, row)
      }
      for (const [key, row] of byReact) {
        console.log(`  ${key}: ${row.passed} passed | ${row.failed} failed`)
      }
      if (unitResult.ran) {
        console.log(`Unit: ${unitResult.ok ? 'passed' : 'failed'} | ${unitResult.total} tests (workspace React 19)`)
      }
      console.log('-------------------------------------------------------')

      if (e2eRuns.some((t) => t.videoPath)) {
        console.log('\n💡 Agents: `view_file` each video.webm to verify motion and exit transitions.')
      }
      if (e2eRuns.some((t) => t.react && t.react !== 'react19')) {
        console.log('💡 Visual snapshots are skipped on React 17/18. Compare paint drift on React 19.')
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

if (interrupted) process.exit(130)
if (!ok) process.exit(1)
process.exit(0)
