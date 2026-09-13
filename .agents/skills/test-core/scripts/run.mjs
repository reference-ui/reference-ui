#!/usr/bin/env node

/**
 * test-core: Miniature Agent CLI & Pipeline Runner
 *
 * Not a component skill. This is the core/matrix verification runner
 * (`pnpm agent`) for packages/reference-core and matrix/*.
 *
 * Provides:
 * 1. Automatic macOS Darwin QoS Jailbreak (elevates child process from PRI 31 to PRI 46/47 via `taskpolicy -a`).
 * 2. Unbuffered output stream filtering (prevents \r carriage-return spinners from freezing in IDE logs).
 * 3. Targeted matrix testing commands.
 * 4. Optional Terminal Bridge Daemon mode (delegates jobs to external user terminal if running).
 */

import { spawn, spawnSync, execSync } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { withCpuGate } from './cpu-gate.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Locate repository root dynamically
export function findRepoRoot(startDir = __dirname) {
  let cur = startDir
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'pnpm-workspace.yaml'))) return cur
    cur = path.dirname(cur)
  }
  return process.cwd()
}

const repoRoot = findRepoRoot(__dirname)
const SOCKET_PATH = '/tmp/reference-ui-agent.sock'
const DAEMON_PID_FILE = '/tmp/reference-ui-agent.pid'
const QUEUE_DIR = '/tmp/reference-ui-agent-queue'
const LOCK_FILE = path.join(QUEUE_DIR, 'active.lock')
export const MAX_CONCURRENCY = Math.max(1, Math.floor(os.cpus().length / 2))

/** Drop act()/Dagger noise after this so the agent stdout pipe cannot stay open. */
const MAX_STDERR_BYTES = 256 * 1024
const CHILD_DRAIN_MS = 300
const activeChildPids = new Set()

function numericExitCode(code) {
  if (typeof code === 'number' && Number.isFinite(code)) return code | 0
  return 1
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

/**
 * Cursor abort SIGKILLs the agent (no JS hooks). `detached: true` puts pnpm in
 * its own group, so that kill used to leave Dagger/Queue running. This watcher
 * lives in a third group, polls the agent PID, and SIGKILLs the child group
 * once the agent is gone.
 */
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

function printAgentBanner(ok, message) {
  const bar = '======================================================='
  if (ok) {
    console.log(`\n${bar}`)
    console.log(`✔ [agent] ${message}`)
    console.log(`${bar}\n`)
  } else {
    console.error(`\n${bar}`)
    console.error(`✖ [agent] ${message}`)
    console.error(`${bar}\n`)
  }
}

function finishAgent({ ok, message, code, killPort = false }) {
  printAgentBanner(ok, message)
  if (!ok || killPort) {
    try { freePort(4173) } catch {}
    try { clearServerState() } catch {}
  }
  if (!ok) teardownActiveChildren('SIGKILL')
  process.exit(ok ? 0 : numericExitCode(code))
}

function looksLikePipelineTest(cmd, args = []) {
  const all = [cmd, ...args].filter(Boolean)
  const joined = all.join(' ')
  if (/\bpipeline\s+test(:matrix)?\b/.test(joined)) return true
  if (cmd === 'pnpm' && args[0] === 'pipeline' && (args[1] === 'test' || args[1] === 'test:matrix')) return true
  return false
}

// 2. Darwin QoS Jailbreak (Unconditional & Deterministic)
function ensureQosJailbreak() {
  if (process.platform !== 'darwin') return false
  if (process.env.__AGENT_CLI_JAILBROKEN === '1') return false

  // Elevate priority unconditionally using taskpolicy -a (User Interactive Application tier)
  // -d default: clears IOPOL_THROTTLE on disk and network IPC
  // -t 0 / -l 0: throughput tier 0 (schedules across all Performance P-cores)
  const args = [
    '-a', // Application QoS & resource management (PRI 46/47)
    '-d', 'default', // Unthrottled disk I/O
    '-t', '0', // Throughput tier 0 (all P-cores)
    '-l', '0', // Latency tier 0 (lowest latency)
    process.execPath,
    __filename,
    ...process.argv.slice(2),
  ]

  const child = spawn('taskpolicy', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      __AGENT_CLI_JAILBROKEN: '1',
      FORCE_COLOR: '1',
    },
    cwd: process.cwd(),
  })
  const jailbreakWatch = startParentDeathWatch(child.pid)

  const forwardSignal = (sig) => {
    try {
      if (child && child.pid) child.kill(sig)
    } catch {}
  }
  process.on('SIGINT', () => forwardSignal('SIGINT'))
  process.on('SIGTERM', () => forwardSignal('SIGTERM'))
  process.on('SIGHUP', () => forwardSignal('SIGHUP'))

  child.on('exit', (code, signal) => {
    stopParentDeathWatch(jailbreakWatch)
    if (signal) {
      process.kill(process.pid, signal)
    } else {
      process.exit(numericExitCode(code))
    }
  })

  // Indicate that parent spawned child and should not continue
  return true
}

// 3. Status Inspector
function getSystemStatus() {
  let pri = 'unknown'
  let flags = 'unknown'
  try {
    const psOut = execSync(`ps -o pri=,flags= -p ${process.pid}`, { encoding: 'utf-8' }).trim()
    const parts = psOut.split(/\s+/)
    pri = parts[0]
    flags = parts[1]
  } catch {}

  let dockerContext = 'unavailable'
  let dockerOk = false
  try {
    dockerContext = execSync('docker context show', { encoding: 'utf-8' }).trim()
    execSync('docker version', { stdio: 'ignore' })
    dockerOk = true
  } catch {}

  let verdaccioOk = false
  try {
    execSync('curl -s -f -o /dev/null http://127.0.0.1:4873/-/ping', { timeout: 1500 })
    verdaccioOk = true
  } catch {}

  let daemonActive = false
  if (fs.existsSync(SOCKET_PATH)) {
    let daemonPid = null
    if (fs.existsSync(DAEMON_PID_FILE)) {
      try {
        daemonPid = parseInt(fs.readFileSync(DAEMON_PID_FILE, 'utf-8').trim(), 10)
      } catch {}
    }

    if (daemonPid && isPidAlive(daemonPid)) {
      daemonActive = true
    } else {
      // Stale socket or dead daemon PID
      try { fs.unlinkSync(SOCKET_PATH) } catch {}
      try { fs.unlinkSync(DAEMON_PID_FILE) } catch {}
      daemonActive = false
    }
  }

  const queueInfo = getQueueStatus()

  return {
    pid: process.pid,
    platform: process.platform,
    qosPriority: pri,
    processFlags: flags,
    jailbroken: process.env.__AGENT_CLI_JAILBROKEN === '1' || parseInt(pri, 10) >= 46,
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    dockerContext,
    dockerOk,
    verdaccioOk,
    daemonActive,
    queueInfo,
  }
}

// 4. Cross-Process Queue Queue Manager
function isPidAlive(pid) {
  if (!pid || typeof pid !== 'number' || isNaN(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err.code === 'EPERM'
  }
}

function getQueueStatus() {
  let activeLocks = []
  let pendingCount = 0
  if (fs.existsSync(QUEUE_DIR)) {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        const raw = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'))
        const parsed = Array.isArray(raw) ? raw : (raw && raw.pid ? [raw] : [])
        activeLocks = parsed.filter(l => isPidAlive(l.pid))
      }
      const activePids = new Set(activeLocks.map(l => l.pid))
      const files = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json'))
      for (const f of files) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(QUEUE_DIR, f), 'utf-8'))
          if (isPidAlive(data.pid) && !activePids.has(data.pid)) {
            pendingCount++
          }
        } catch {}
      }
    } catch {}
  }
  return {
    activeLocks,
    activeLock: activeLocks[0] || null,
    pendingCount,
    maxConcurrency: MAX_CONCURRENCY,
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
    // 1. Prune dead entries in QUEUE_DIR
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
      } catch {
        // If file is corrupt or empty, ignore
      }
    }

    // Sort valid entries by filename (which starts with zero-padded timestamp)
    validEntries.sort((a, b) => a.file.localeCompare(b.file))

    const myIndex = validEntries.findIndex(e => e.file === entryFilename)

    // 2. Check active lock and acquire if myIndex < MAX_CONCURRENCY
    let acquired = false
    let activeLocks = []
    withFileMutex(() => {
      if (fs.existsSync(LOCK_FILE)) {
        try {
          const raw = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'))
          const parsed = Array.isArray(raw) ? raw : (raw && raw.pid ? [raw] : [])
          const aliveLocks = parsed.filter(l => isPidAlive(l.pid))
          if (aliveLocks.length !== parsed.length) {
            const stalePids = parsed.filter(l => !isPidAlive(l.pid)).map(l => l.pid)
            console.log(`[agent-queue] Stale lock(s) detected (PID ${stalePids.join(', ')} no longer running). Pruning.`)
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

      // If myIndex < MAX_CONCURRENCY, you can acquire the lock!
      if (myIndex >= 0 && myIndex < MAX_CONCURRENCY) {
        const lockPayload = {
          pid: myPid,
          entryFile: entryFilename,
          acquiredAt: Date.now(),
          task: taskInfo,
        }
        const existingIdx = activeLocks.findIndex(l => l.pid === myPid)
        if (existingIdx >= 0) {
          activeLocks[existingIdx] = lockPayload
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
        console.log(`[agent-queue] Turn reached (PID ${myPid}, slot ${myIndex + 1}/${MAX_CONCURRENCY}). Starting execution...`)
      }
      return async () => {
        cleanup()
        process.off('SIGINT', cleanup)
        process.off('SIGTERM', cleanup)
        process.off('exit', cleanup)
      }
    }

    // We are waiting
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
  const release = await acquireQueueLock(taskInfo)
  try {
    return await fn()
  } finally {
    await release()
  }
}

// 5. Stream unbuffering and process lifecycle helper for spawn
function spawnWithCleanStream(cmd, args, options = {}) {
  return new Promise((resolve) => {
    const spawnCmd = process.platform === 'darwin' ? 'taskpolicy' : cmd
    const spawnArgs = process.platform === 'darwin'
      ? ['-a', '-d', 'default', '-t', '0', '-l', '0', cmd, ...args]
      : args

    const child = spawn(spawnCmd, spawnArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      env: {
        ...process.env,
        ...options.env,
        FORCE_COLOR: '1',
      },
      cwd: options.cwd || repoRoot,
    })

    if (child.pid) activeChildPids.add(child.pid)
    const parentDeathWatch = startParentDeathWatch(child.pid)

    let signalReceived = null
    let settled = false
    let stderrBytes = 0
    let stderrTruncated = false
    let drainTimer = null

    const killTree = (sig = 'SIGTERM') => {
      if (child.pid) killProcessGroup(child.pid, sig)
      try { child.kill(sig) } catch {}
    }

    const settle = (code, signal) => {
      if (settled) return
      settled = true
      stopParentDeathWatch(parentDeathWatch)
      if (drainTimer) {
        clearTimeout(drainTimer)
        drainTimer = null
      }
      try { child.stdout?.removeAllListeners('data') } catch {}
      try { child.stderr?.removeAllListeners('data') } catch {}
      try { child.stdout?.destroy() } catch {}
      try { child.stderr?.destroy() } catch {}
      if (child.pid) activeChildPids.delete(child.pid)
      process.off('SIGINT', onSigInt)
      process.off('SIGTERM', onSigTerm)
      process.off('SIGHUP', onSigTerm)
      resolve({
        code: typeof code === 'number' ? code : 1,
        signal: signal || signalReceived,
        childPid: child.pid,
      })
    }

    const onSigInt = () => {
      signalReceived = 'SIGINT'
      killTree('SIGINT')
    }
    const onSigTerm = () => {
      signalReceived = 'SIGTERM'
      killTree('SIGTERM')
    }

    process.on('SIGINT', onSigInt)
    process.on('SIGTERM', onSigTerm)
    process.on('SIGHUP', onSigTerm)

    const cleanLine = (chunk, isStderr = false) => {
      if (settled) return
      if (isStderr) {
        stderrBytes += chunk.length
        if (stderrBytes > MAX_STDERR_BYTES) {
          if (!stderrTruncated) {
            stderrTruncated = true
            process.stderr.write(`\n[agent] stderr truncated after ${MAX_STDERR_BYTES} bytes so the tool pipe cannot hang.\n`)
          }
          return
        }
      }

      const str = chunk.toString()
      const lines = str.split('\r')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.includes('\n')) {
          const sublines = line.split('\n')
          for (let j = 0; j < sublines.length; j++) {
            if (j > 0) {
              (isStderr ? process.stderr : process.stdout).write('\n')
            }
            (isStderr ? process.stderr : process.stdout).write(sublines[j])
            if (options.onLine) {
              try { options.onLine(sublines[j], isStderr) } catch {}
            }
          }
        } else if (line.trim().length > 0) {
          if (!process.stdout.isTTY) {
            (isStderr ? process.stderr : process.stdout).write(`[agent] ${line.trim()}\n`)
          } else {
            (isStderr ? process.stderr : process.stdout).write(line)
          }
          if (options.onLine) {
            try { options.onLine(line.trim(), isStderr) } catch {}
          }
        }
      }
    }

    child.stdout.on('data', (chunk) => cleanLine(chunk, false))
    child.stderr.on('data', (chunk) => cleanLine(chunk, true))

    child.on('exit', (code, signal) => {
      drainTimer = setTimeout(() => {
        if (child.exitCode === null && child.pid) killTree('SIGKILL')
        settle(code, signal)
      }, CHILD_DRAIN_MS)
    })

    child.on('error', (err) => {
      console.error(`[agent] Failed to execute ${cmd}:`, err.message)
      settle(1, signalReceived)
    })
  })
}

// Helper to inspect and free local ports (e.g. Vite test servers on 4173)
export function getPidsOnPort(port) {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: 'utf-8' }).trim()
    if (!out) return []
    return out.split(/\s+/).map(p => parseInt(p, 10)).filter(p => !isNaN(p) && p > 0)
  } catch {
    return []
  }
}

export function freePort(port, logPrefix = '[agent]') {
  const pids = getPidsOnPort(port)
  if (pids.length > 0) {
    for (const pid of pids) {
      try {
        process.kill(pid, 'SIGTERM')
      } catch {}
    }
    // Check if any PID remains and force kill
    try {
      const remaining = getPidsOnPort(port)
      for (const pid of remaining) {
        try {
          process.kill(pid, 'SIGKILL')
        } catch {}
      }
    } catch {}
    console.log(`${logPrefix} Cleared stale listener on port ${port} (terminated PID ${pids.join(', ')})`)
  }
}

function getLatestSrcMtime(dir) {
  let latest = 0
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const ent of entries) {
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        const sub = getLatestSrcMtime(full)
        if (sub > latest) latest = sub
      } else if (ent.isFile() && (ent.name.endsWith('.ts') || ent.name.endsWith('.tsx') || ent.name.endsWith('.css'))) {
        const stat = fs.statSync(full)
        if (stat.mtimeMs > latest) latest = stat.mtimeMs
      }
    }
  } catch {}
  return latest
}

async function ensureLibBuild(options = {}) {
  const distPath = path.join(repoRoot, 'packages/reference-lib/dist/index.mjs')
  const distExists = fs.existsSync(distPath)
  let distMtime = 0
  if (distExists) {
    try { distMtime = fs.statSync(distPath).mtimeMs } catch {}
  }

  const srcDir = path.join(repoRoot, 'packages/reference-lib/src')
  const srcMtime = getLatestSrcMtime(srcDir)
  const isStale = !distExists || srcMtime > distMtime

  if (options.forceBuild) {
    console.log('[agent] Full rebuild of @reference-ui/lib requested...')
    const buildRes = await runCommand('pnpm', ['--filter', '@reference-ui/lib', 'run', 'build'], {
      env: { REF_PIPELINE_SKIP_DEPENDENCY_BUILDS: '1' },
      skipQueue: true,
    })
    if (buildRes.code !== 0) {
      console.error('[agent] Error: Failed to build @reference-ui/lib.')
      return false
    }
    console.log('[agent] ✔ @reference-ui/lib full build complete.\n')
  } else if (isStale) {
    console.log('[agent] ⚡ Source files changed. Fast compiling @reference-ui/lib bundle (~400ms)...')
    const tsupRes = await runCommand('pnpm', ['--filter', '@reference-ui/lib', 'exec', 'tsup'], {
      skipQueue: true,
    })
    if (tsupRes.code !== 0) {
      console.error('[agent] Fast tsup compile failed, falling back to full build...')
      const fullRes = await runCommand('pnpm', ['--filter', '@reference-ui/lib', 'run', 'build'], {
        env: { REF_PIPELINE_SKIP_DEPENDENCY_BUILDS: '1' },
        skipQueue: true,
      })
      if (fullRes.code !== 0) return false
    }
    console.log('[agent] ✔ @reference-ui/lib bundle updated.\n')
  }
  return true
}

// 6. Terminal Bridge Daemon
async function startDaemon() {
  if (fs.existsSync(SOCKET_PATH)) {
    // Check if an existing daemon is alive
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

      // Notify all remaining waiting clients of updated queue positions
      queue.forEach((item, idx) => {
        try {
          item.socket.write(JSON.stringify({ type: 'queue', position: idx + 1, total: queue.length }) + '\n')
        } catch {}
      })

      console.log(`\n[agent-daemon] Starting execution (${activeJobs.size}/${MAX_CONCURRENCY} active): ${req.cmd} ${req.args.join(' ')}`)
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
    console.log(`[agent-daemon] PID: ${process.pid} (Interactive priority: PRI ${getSystemStatus().qosPriority})`)
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

// 7. Execute via daemon or fallback to direct execution with cross-process Queue queue
async function runCommand(cmd, args, options = {}) {
  const executeDirect = () => {
    if (options.skipQueue) {
      return spawnWithCleanStream(cmd, args, options)
    }
    return withQueueLock({ cmd, args }, () => spawnWithCleanStream(cmd, args, options))
  }

  if (fs.existsSync(SOCKET_PATH)) {
    return new Promise((resolve) => {
      let completed = false
      let buffer = ''
      const client = net.createConnection(SOCKET_PATH, () => {
        console.log(`[agent] Connected to terminal daemon at ${SOCKET_PATH}`)
        client.write(JSON.stringify({ cmd, args, cwd: options.cwd || repoRoot, env: options.env, pid: process.pid }) + '\n')
      })

      client.on('data', (chunk) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const msg = JSON.parse(line.trim())
            if (msg.type === 'queue') {
              console.log(`[agent-queue] Another test is currently running in daemon. Waiting in queue (position ${msg.position} of ${msg.total})...`)
            }
            if (msg.type === 'start') {
              console.log(`[agent-queue] Turn reached in daemon. Executing test...`)
            }
            if (msg.type === 'stdout') {
              process.stdout.write(msg.data)
              if (options.onLine) {
                const sublines = msg.data.split('\n')
                for (const sl of sublines) {
                  if (sl.trim()) {
                    try { options.onLine(sl, false) } catch {}
                  }
                }
              }
            }
            if (msg.type === 'stderr') {
              process.stderr.write(msg.data)
              if (options.onLine) {
                const sublines = msg.data.split('\n')
                for (const sl of sublines) {
                  if (sl.trim()) {
                    try { options.onLine(sl, true) } catch {}
                  }
                }
              }
            }
            if (msg.type === 'exit') {
              completed = true
              client.end()
              resolve({ code: msg.code })
            }
            if (msg.type === 'error') {
              completed = true
              client.end()
              console.error(`[agent] Daemon error: ${msg.error}`)
              resolve({ code: 1 })
            }
          } catch {}
        }
      })

      client.on('close', () => {
        if (!completed) {
          console.log('[agent] Daemon connection closed without completion signal, falling back to direct execution...')
          resolve(executeDirect())
        }
      })

      client.on('error', () => {
        console.log('[agent] Daemon unreachable, cleaning stale socket and falling back to direct execution...')
        try { fs.unlinkSync(SOCKET_PATH) } catch {}
        try { fs.unlinkSync(DAEMON_PID_FILE) } catch {}
        resolve(executeDirect())
      })
    })
  }

  return executeDirect()
}

// 8. CLI Actions
async function actionStatus() {
  const status = getSystemStatus()
  const queueDesc = status.queueInfo?.activeLocks?.length
    ? `Active (${status.queueInfo.activeLocks.length}/${status.queueInfo.maxConcurrency || MAX_CONCURRENCY} slots, PIDs: ${status.queueInfo.activeLocks.map(l => l.pid).join(', ')}) (${status.queueInfo.pendingCount} waiting)`
    : status.queueInfo?.activeLock
      ? `Active PID ${status.queueInfo.activeLock.pid} (${status.queueInfo.pendingCount} waiting)`
      : `Idle (${status.queueInfo?.pendingCount || 0} waiting)`

  console.log('\n========================================')
  console.log(' Reference UI Agent Environment Status  ')
  console.log('========================================')
  console.log(`Platform:          ${status.platform} (${status.cpus} CPUs, ${status.cpuModel})`)
  console.log(`Darwin Priority:   PRI ${status.qosPriority} (Flags: ${status.processFlags})`)
  console.log(`QoS Jailbroken:    ${status.jailbroken ? '✔ YES (Application tier, unthrottled)' : '✖ NO (Clamped)'}`)
  console.log(`Queue Queue:        ${queueDesc}`)
  console.log(`Docker Runtime:    ${status.dockerOk ? `✔ Active (${status.dockerContext})` : '✖ Inactive'}`)
  console.log(`Verdaccio Registry:${status.verdaccioOk ? '✔ Active (http://127.0.0.1:4873)' : '✖ Inactive'}`)
  console.log(`Terminal Bridge:   ${status.daemonActive ? `✔ Connected (${SOCKET_PATH})` : '○ Idle (Direct Mode)'}`)
  console.log('========================================\n')
}

function normalizeTestArgs(rawArgs) {
  const normalized = []
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i]
    if (arg === 'matrix') continue
    if (!arg.startsWith('-')) {
      // Positional package name e.g. "lib" or "@matrix/lib"
      const pkg = arg.startsWith('@matrix/') ? arg : `@matrix/${arg}`
      normalized.push(`--packages=${pkg}`)
    } else {
      normalized.push(arg)
    }
  }
  return normalized
}

async function actionTest(args) {
  const normalizedArgs = normalizeTestArgs(args)
  const pnpmArgs = ['pipeline', 'test', ...normalizedArgs]
  return withCpuGate('exclusive', 'agent test', async () => {
    return withQueueLock({ cmd: 'agent test', args: pnpmArgs }, async () => {
      console.log(`[agent] Executing unthrottled: pnpm ${pnpmArgs.join(' ')}`)
      const result = await runCommand('pnpm', pnpmArgs, { skipQueue: true })
      const exitCode = numericExitCode(result.code)
      if (exitCode !== 0) {
        finishAgent({
          ok: false,
          message: `Matrix test suite FAILED (exit code ${exitCode}).`,
          code: exitCode,
          killPort: true,
        })
      }
      finishAgent({
        ok: true,
        message: 'Matrix test suite PASSED successfully.',
        code: 0,
      })
    })
  })
}

// 9. Native Playwright & Vitest Runners
const SERVER_STATE_FILE = path.join(os.tmpdir(), 'reference-ui-playwright-server.json')

function getRunningServerState() {
  if (fs.existsSync(SERVER_STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SERVER_STATE_FILE, 'utf-8'))
      const pids = getPidsOnPort(4173)
      if (pids.length > 0 && data.package) {
        return { ...data, pids }
      }
    } catch {}
  }
  return null
}

function saveServerState(pkg) {
  try {
    const pids = getPidsOnPort(4173)
    if (pids.length > 0) {
      fs.writeFileSync(SERVER_STATE_FILE, JSON.stringify({
        package: pkg,
        pids,
        updatedAt: Date.now(),
      }, null, 2))
    }
  } catch {}
}

function clearServerState() {
  try { if (fs.existsSync(SERVER_STATE_FILE)) fs.unlinkSync(SERVER_STATE_FILE) } catch {}
}

export function isKnownPackage(name) {
  if (!name || typeof name !== 'string') return false
  const clean = name.trim().replace(/^@matrix\//, '').replace(/^matrix\//, '')
  return fs.existsSync(path.join(repoRoot, 'matrix', clean))
}

function findSpecByTestId(testId) {
  if (!testId || typeof testId !== 'string') return null
  const clean = testId.trim()
  // Must look like a test case ID (e.g. OV-OUT-01, OV-DOM-05, TOAST-02)
  const isCaseId = /^[A-Z]{2,}(?:-[A-Z0-9]+)+$/i.test(clean) || clean.toUpperCase().startsWith('OV-')
  if (!isCaseId) return null

  const matrixDir = path.join(repoRoot, 'matrix')
  if (!fs.existsSync(matrixDir)) return null
  const pkgs = fs.readdirSync(matrixDir)
  for (const pkg of pkgs) {
    const e2eDir = path.join(matrixDir, pkg, 'tests', 'e2e')
    if (fs.existsSync(e2eDir)) {
      const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.spec.ts') || f.endsWith('.spec.js'))
      for (const f of files) {
        const fullPath = path.join(e2eDir, f)
        const content = fs.readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (line.includes(clean) && (line.includes('test(') || line.includes('test.only(') || line.includes('test.describe('))) {
            return {
              pkg: `matrix/${pkg}`,
              target: `tests/e2e/${f}:${i + 1}`,
              file: `tests/e2e/${f}`,
              line: i + 1,
              testTitle: line.trim(),
            }
          }
        }
      }
    }
  }
  return null
}

function findSpecByPathOrName(query) {
  const [targetPath, linePart] = query.split(':')
  let pkgHint = null
  let filePart = targetPath
  if (targetPath.includes('/')) {
    const segments = targetPath.split('/')
    if (segments[0] === 'matrix') {
      pkgHint = segments[1]
      filePart = segments.slice(2).join('/')
    } else {
      pkgHint = segments[0]
      filePart = segments.slice(1).join('/')
    }
  }

  const cleanName = filePart.replace(/\.spec\.(ts|js)$/, '').replace(/^.*[/\\]/, '').toLowerCase()
  const matrixDir = path.join(repoRoot, 'matrix')
  if (!fs.existsSync(matrixDir)) return null
  const pkgs = fs.readdirSync(matrixDir)

  const sortedPkgs = pkgHint
    ? pkgs.sort((a, b) => (a === pkgHint ? -1 : b === pkgHint ? 1 : 0))
    : pkgs

  for (const pkg of sortedPkgs) {
    if (pkgHint && pkg !== pkgHint && !pkg.includes(pkgHint)) continue
    const e2eDir = path.join(matrixDir, pkg, 'tests', 'e2e')
    if (fs.existsSync(e2eDir)) {
      const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.spec.ts') || f.endsWith('.spec.js'))
      for (const f of files) {
        const base = f.replace(/\.spec\.(ts|js)$/, '').toLowerCase()
        if (f === filePart || base === cleanName || base.includes(cleanName)) {
          if (linePart) {
            const fullPath = path.join(e2eDir, f)
            const content = fs.readFileSync(fullPath, 'utf-8')
            const lines = content.split('\n')
            const targetLine = parseInt(linePart, 10)
            if (targetLine > 0 && targetLine <= lines.length) {
              return {
                pkg: `matrix/${pkg}`,
                target: `tests/e2e/${f}:${targetLine}`,
                file: `tests/e2e/${f}`,
                line: targetLine,
              }
            }
          } else {
            return {
              pkg: `matrix/${pkg}`,
              target: `tests/e2e/${f}`,
              file: `tests/e2e/${f}`,
              line: null,
            }
          }
        }
      }
    }
  }
  return null
}

function findVitestTarget(query) {
  const normalized = query.replace(/^\.\//, '')
  if (normalized.startsWith('packages/')) {
    const parts = normalized.split('/')
    const pkgDir = `${parts[0]}/${parts[1]}`
    const fileRel = parts.slice(2).join('/')
    return { pkg: pkgDir, fileRel }
  }

  const clean = query.replace(/\.test\.(tsx?|jsx?)$/, '')
  const compDir = path.join(repoRoot, 'packages/reference-lib/src/components', clean)
  if (fs.existsSync(compDir)) {
    const testFile1 = path.join(compDir, `${clean}.test.tsx`)
    const testFile2 = path.join(compDir, '__tests__', `${clean}.test.tsx`)
    if (fs.existsSync(testFile1)) {
      return { pkg: 'packages/reference-lib', fileRel: path.relative(path.join(repoRoot, 'packages/reference-lib'), testFile1) }
    }
    if (fs.existsSync(testFile2)) {
      return { pkg: 'packages/reference-lib', fileRel: path.relative(path.join(repoRoot, 'packages/reference-lib'), testFile2) }
    }
  }

  const searchDir = path.join(repoRoot, 'packages/reference-lib/src')
  if (fs.existsSync(searchDir)) {
    const findMatch = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const ent of entries) {
        const full = path.join(dir, ent.name)
        if (ent.isDirectory()) {
          const found = findMatch(full)
          if (found) return found
        } else if (ent.isFile() && (ent.name === `${clean}.test.tsx` || ent.name === `${clean}.test.ts` || (ent.name.toLowerCase().includes(clean.toLowerCase()) && (ent.name.endsWith('.test.tsx') || ent.name.endsWith('.test.ts'))))) {
          return full
        }
      }
      return null
    }

    const match = findMatch(searchDir)
    if (match) {
      return { pkg: 'packages/reference-lib', fileRel: path.relative(path.join(repoRoot, 'packages/reference-lib'), match) }
    }
  }

  return null
}

async function actionPlaywright(rawArgs = []) {
  if (rawArgs.includes('--clean')) {
    freePort(4173)
    clearServerState()
    console.log('[agent] Freed port 4173 and cleared persistent server state.\n')
    if (rawArgs.length === 1) return
  }

  let targetPackage = null
  let forceBuild = false
  let skipBuild = false
  let cleanServer = false
  let isSingleTest = false
  let targetSpec = null
  const playwrightArgs = []

  let i = 0
  while (i < rawArgs.length) {
    const arg = rawArgs[i]
    if (arg === '--clean' || arg === '--kill-server') {
      cleanServer = true
      i++
      continue
    }
    if (arg === '--build') {
      forceBuild = true
      i++
      continue
    }
    if (arg === '--no-build') {
      skipBuild = true
      i++
      continue
    }
    if (arg === '--dir') {
      targetPackage = rawArgs[i + 1]
      i += 2
      continue
    }
    if (arg.startsWith('--dir=')) {
      targetPackage = arg.slice('--dir='.length)
      i++
      continue
    }

    if (['-g', '--grep', '-p', '--project', '--reporter', '--workers', '-j', '--timeout', '--output'].includes(arg)) {
      playwrightArgs.push(arg)
      if (i + 1 < rawArgs.length) {
        playwrightArgs.push(rawArgs[i + 1])
        i += 2
        continue
      }
      i++
      continue
    }

    if (!targetPackage && !arg.startsWith('-')) {
      // 0. Known matrix package check (e.g. overlays, lib, primitives)
      if (isKnownPackage(arg)) {
        targetPackage = arg
        i++
        continue
      }

      // 1. Direct test ID match (e.g. OV-OUT-01, OV-LAYER-02)
      const testIdMatch = findSpecByTestId(arg)
      if (testIdMatch) {
        targetPackage = testIdMatch.pkg
        targetSpec = testIdMatch.target
        isSingleTest = true
        console.log(`[agent] 🎯 Matched test ID '${arg}' → ${testIdMatch.pkg} ${testIdMatch.target}`)
        i++
        continue
      }

      // 2. Direct spec name, file:line, or component match (e.g. overlay:196, toast)
      const specMatch = findSpecByPathOrName(arg)
      if (specMatch) {
        targetPackage = specMatch.pkg
        targetSpec = specMatch.target
        if (specMatch.line) isSingleTest = true
        console.log(`[agent] 🎯 Matched spec '${arg}' → ${specMatch.pkg} ${specMatch.target}`)
        i++
        continue
      }

      targetPackage = arg
      i++
      continue
    }

    playwrightArgs.push(arg)
    i++
  }

  // Resolve target directory
  let resolvedTarget = null
  if (targetPackage) {
    let clean = targetPackage.trim()
    if (clean.startsWith('@matrix/')) {
      clean = clean.replace('@matrix/', '')
    }
    if (clean === 'overlays') resolvedTarget = 'matrix/overlays'
    else if (clean === 'lib') resolvedTarget = 'matrix/lib'
    else if (clean === 'primitives') resolvedTarget = 'matrix/primitives'
    else if (clean.startsWith('matrix/')) resolvedTarget = clean
    else if (fs.existsSync(path.join(repoRoot, 'matrix', clean))) resolvedTarget = `matrix/${clean}`
    else if (fs.existsSync(path.join(repoRoot, clean))) resolvedTarget = clean
  }

  if (targetSpec) {
    playwrightArgs.unshift(targetSpec)
  } else if (!resolvedTarget) {
    // If not resolved yet, infer from spec file arguments
    for (const arg of playwrightArgs) {
      if (arg.endsWith('.spec.ts') || arg.endsWith('.spec.js') || arg.includes('.spec.')) {
        if (fs.existsSync(path.join(repoRoot, 'matrix/overlays', arg.split(':')[0]))) {
          resolvedTarget = 'matrix/overlays'
          break
        } else if (fs.existsSync(path.join(repoRoot, 'matrix/lib', arg.split(':')[0]))) {
          resolvedTarget = 'matrix/lib'
          break
        }
      }
    }

    // If still not resolved, check grep pattern
    if (!resolvedTarget) {
      const grepIdx = playwrightArgs.findIndex(a => a === '-g' || a === '--grep')
      const grepPattern = grepIdx !== -1 ? playwrightArgs[grepIdx + 1] || '' : ''
      const grepMatch = findSpecByTestId(grepPattern)
      if (grepMatch) {
        resolvedTarget = grepMatch.pkg
      } else if (grepPattern.startsWith('OV-') || grepPattern.toLowerCase().includes('overlay')) {
        resolvedTarget = 'matrix/overlays'
      } else {
        resolvedTarget = 'matrix/overlays'
      }
    }
  }

  const fullTargetDir = path.join(repoRoot, resolvedTarget)
  if (!fs.existsSync(fullTargetDir)) {
    console.error(`[agent] Error: Target matrix directory not found: ${resolvedTarget}`)
    console.error(`[agent] Available matrix packages include: overlays, lib, primitives, tokens, etc.`)
    process.exit(1)
  }

  return withCpuGate('exclusive', 'agent playwright', async () => {
    return withQueueLock({ cmd: 'agent playwright', args: rawArgs }, async () => {
      // 1. Build check
      if (!skipBuild) {
        const ok = await ensureLibBuild({ forceBuild })
        if (!ok) process.exit(1)
      }
  
      // 2. Concurrency tuning:
      // When targeting a single test (by line number or test ID), run with 1 worker to eliminate multi-process spawn overhead.
      // When running multiple tests, auto-tune to hardware worker capacity (up to 8 workers on 32-core machine).
      if (!isSingleTest) {
        for (const a of playwrightArgs) {
          if (a.includes('.spec.') && a.includes(':')) isSingleTest = true
        }
      }
  
      // Read package playwright.config.ts if present to respect declared worker/parallel settings
      let configWorkers = null
      let configParallel = null
      const configPath = path.join(fullTargetDir, 'playwright.config.ts')
      if (fs.existsSync(configPath)) {
        const configText = fs.readFileSync(configPath, 'utf-8')
        const wMatch = configText.match(/workers\s*:\s*(\d+)/)
        if (wMatch) configWorkers = parseInt(wMatch[1], 10)
        if (configText.includes('fullyParallel: false')) configParallel = false
        if (configText.includes('fullyParallel: true')) configParallel = true
      }
  
      const hasWorkersArg = playwrightArgs.some(a => a === '--workers' || a.startsWith('--workers=') || a === '-j')
      if (!hasWorkersArg) {
        if (isSingleTest) {
          playwrightArgs.push('--workers=1')
        } else {
          // Concurrency hardware auto-tuning:
          // Schedule across available CPU cores (4-8 workers on workstation hardware)
          const cpus = os.cpus().length
          const hwWorkers = Math.min(8, Math.max(4, Math.floor(cpus / 4)))
          const workersToUse = (configWorkers && configWorkers > 1) ? configWorkers : hwWorkers
          playwrightArgs.push(`--workers=${workersToUse}`)
        }
      }
  
      const hasSerialArg = playwrightArgs.some(a => a === '--serial' || a === '--no-parallel')
      const hasParallelArg = playwrightArgs.some(a => a === '--fully-parallel')
      if (!isSingleTest && !hasSerialArg && !hasParallelArg) {
        if (configParallel !== false) {
          playwrightArgs.push('--fully-parallel')
        }
      }
  
      // 3. Port & Warm Server Management:
      // Reuse running Vite server if already active for the same package to cut run times to ~3.7s!
      const runningServer = getRunningServerState()
      if (cleanServer) {
        freePort(4173)
        clearServerState()
      } else if (runningServer) {
        if (runningServer.package === resolvedTarget) {
          console.log(`[agent] ⚡ Reusing warm Vite server on port 4173 for ${resolvedTarget} (fast iteration mode)`)
        } else {
          console.log(`[agent] Switching test package (${runningServer.package} → ${resolvedTarget}). Refreshing port 4173...`)
          freePort(4173)
          clearServerState()
        }
      } else {
        freePort(4173)
      }
  
      console.log(`\n========================================`)
      console.log(` Running Native Playwright: ${resolvedTarget}`)
      if (playwrightArgs.length > 0) {
        console.log(` Filter / Args: ${playwrightArgs.join(' ')}`)
      }
      console.log(`========================================\n`)
  
      let passedCount = 0
      let failedCount = 0
      let skippedCount = 0
      let totalDuration = ''
      let suiteSummaryFound = false
  
      const onLine = (line) => {
        const passMatch = line.match(/(\d+)\s+passed/i)
        if (passMatch) {
          passedCount = parseInt(passMatch[1], 10)
          suiteSummaryFound = true
        }
        const failMatch = line.match(/(\d+)\s+failed/i)
        if (failMatch) {
          failedCount = parseInt(failMatch[1], 10)
          suiteSummaryFound = true
        }
        const skipMatch = line.match(/(\d+)\s+(?:skipped|did not run)/i)
        if (skipMatch) {
          skippedCount = parseInt(skipMatch[1], 10)
        }
        const durMatch = line.match(/\(([\d.]+(?:s|ms|m))\)/)
        if (durMatch && suiteSummaryFound) {
          totalDuration = durMatch[1]
        }
      }
  
      const pnpmArgs = ['--dir', resolvedTarget, 'exec', 'playwright', 'test', ...playwrightArgs]
      const res = await runCommand('pnpm', pnpmArgs, {
        onLine,
        skipQueue: true,
        cwd: repoRoot,
      })
  
      // Update warm server state for fast follow-up runs
      if (cleanServer) {
        freePort(4173)
        clearServerState()
      } else {
        saveServerState(resolvedTarget)
      }
  
      // Signal & result evaluation:
      const allPassed = (passedCount > 0 && failedCount === 0) || (suiteSummaryFound && failedCount === 0)
  
      if (allPassed) {
        finishAgent({
          ok: true,
          message: `Playwright suite PASSED: ${passedCount} passed (0 failed)${totalDuration ? ` in ${totalDuration}` : ''}`,
          code: 0,
        })
      } else if (failedCount > 0) {
        finishAgent({
          ok: false,
          message: `Playwright suite FAILED: ${failedCount} failed (${passedCount} passed)${totalDuration ? ` in ${totalDuration}` : ''}`,
          code: res.code,
          killPort: true,
        })
      } else if (res.code === 0) {
        finishAgent({
          ok: true,
          message: 'Playwright completed successfully (code 0).',
          code: 0,
        })
      } else {
        finishAgent({
          ok: false,
          message: `Playwright suite FAILED (exit code ${numericExitCode(res.code)}).`,
          code: res.code,
          killPort: true,
        })
      }
    })
  })
}

async function actionVitest(rawArgs = []) {
  let targetPackage = null
  const vitestArgs = []

  let i = 0
  while (i < rawArgs.length) {
    const arg = rawArgs[i]
    if (arg === '--dir') {
      targetPackage = rawArgs[i + 1]
      i += 2
      continue
    }
    if (arg.startsWith('--dir=')) {
      targetPackage = arg.slice('--dir='.length)
      i++
      continue
    }
    if (['-t', '--testNamePattern', '-c', '--config', '--reporter', '-r', '--project'].includes(arg)) {
      vitestArgs.push(arg)
      if (i + 1 < rawArgs.length) {
        vitestArgs.push(rawArgs[i + 1])
        i += 2
        continue
      }
      i++
      continue
    }

    if (!targetPackage && !arg.startsWith('-')) {
      targetPackage = arg
      i++
      continue
    }
    vitestArgs.push(arg)
    i++
  }

  let resolvedTarget = 'packages/reference-lib'
  if (targetPackage) {
    if (isKnownPackage(targetPackage)) {
      const clean = targetPackage.trim().replace(/^@matrix\//, '')
      resolvedTarget = clean.startsWith('matrix/') ? clean : `matrix/${clean}`
    } else {
      // 1. Direct file or component match
      const match = findVitestTarget(targetPackage)
      if (match) {
        resolvedTarget = match.pkg
        vitestArgs.unshift(match.fileRel)
        console.log(`[agent] 🎯 Matched Vitest target '${targetPackage}' → ${match.pkg} ${match.fileRel}`)
      } else {
        let clean = targetPackage.trim()
        if (clean === '@reference-ui/lib') {
          resolvedTarget = 'packages/reference-lib'
        } else if (clean === 'core' || clean === '@reference-ui/core') {
          resolvedTarget = 'packages/reference-core'
        } else if (clean.startsWith('matrix/')) {
          resolvedTarget = clean
        } else if (clean.startsWith('@matrix/')) {
          resolvedTarget = `matrix/${clean.replace('@matrix/', '')}`
        } else if (fs.existsSync(path.join(repoRoot, 'packages', clean))) {
          resolvedTarget = `packages/${clean}`
        } else if (fs.existsSync(path.join(repoRoot, clean))) {
          resolvedTarget = clean
        } else {
          // Assume it's a test name pattern filter
          vitestArgs.unshift('-t', targetPackage)
        }
      }
    }
  }


  const fullTargetDir = path.join(repoRoot, resolvedTarget)
  if (!fs.existsSync(fullTargetDir)) {
    console.error(`[agent] Error: Target directory not found: ${resolvedTarget}`)
    process.exit(1)
  }

  return withQueueLock({ cmd: 'agent vitest', args: rawArgs }, async () => {
    console.log(`\n========================================`)
    console.log(` Running Native Vitest: ${resolvedTarget}`)
    if (vitestArgs.length > 0) {
      console.log(` Filter / Args: ${vitestArgs.join(' ')}`)
    }
    console.log(`========================================\n`)

    const isWatch = vitestArgs.includes('--watch') || vitestArgs.includes('-w')
    const pnpmArgs = ['--dir', resolvedTarget, 'exec', 'vitest', ...(isWatch ? [] : ['run']), ...vitestArgs]

    let passedTests = 0
    let failedTests = 0
    const onLine = (line) => {
      const passMatch = line.match(/Tests\s+.*(\d+)\s+passed/i)
      if (passMatch) passedTests = parseInt(passMatch[1], 10)
      const failMatch = line.match(/Tests\s+.*(\d+)\s+failed/i)
      if (failMatch) failedTests = parseInt(failMatch[1], 10)
    }

    const res = await runCommand('pnpm', pnpmArgs, {
      onLine,
      skipQueue: true,
      cwd: repoRoot,
    })

    if (res.code === 0) {
      finishAgent({
        ok: true,
        message: `Vitest suite PASSED in ${resolvedTarget}`,
        code: 0,
      })
    } else {
      finishAgent({
        ok: false,
        message: `Vitest suite FAILED in ${resolvedTarget} (code ${numericExitCode(res.code)})`,
        code: res.code,
      })
    }
  })
}

// 10. Programmatic Matrix & Pipeline API
export {
  runCommand,
  getSystemStatus,
  actionStatus,
  actionTest,
  actionPlaywright,
  actionVitest,
  acquireQueueLock,
  withQueueLock,
}

export async function runPlaywright(args = []) {
  const rawArgs = Array.isArray(args) ? args : [args]
  return actionPlaywright(rawArgs)
}

export async function runVitest(args = []) {
  const rawArgs = Array.isArray(args) ? args : [args]
  return actionVitest(rawArgs)
}

/**
 * Programmatic runner for matrix tests through the pipeline.
 * Ensures Darwin QoS elevation and unbuffered output streaming.
 */
export async function runMatrix(options = {}) {
  const args = []
  if (options.packages) args.push(`--packages=${options.packages}`)
  if (options.react) args.push(`--react=${options.react}`)
  if (options.full) args.push('--full')
  if (options.trace) args.push('--trace')
  return runCommand('pnpm', ['pipeline', 'test', ...args])
}

/**
 * Programmatic pass-through to any pipeline CLI command with QoS elevation.
 */
export async function runPipeline(subcommand, args = []) {
  const fullArgs = typeof subcommand === 'string' ? [subcommand, ...args] : subcommand
  return runCommand('pnpm', ['pipeline', ...fullArgs])
}

async function actionVerifyAll(args) {
  return withCpuGate('exclusive', 'verify:all', async () => {
    const failFast = !args.includes('--no-fail-fast')
    let matrixArgs = args.filter(a => a !== '--no-fail-fast')

    console.log(`\n[agent] === verify:all (Phase 1: Component CT) ===`)
    const ctScript = path.join(repoRoot, '.agents/skills/test-component/scripts/test-component.mjs')
    const ctRes = await runCommand('node', [ctScript], { skipQueue: true, cwd: repoRoot })
    if (ctRes.code !== 0) {
      if (failFast) {
        finishAgent({ ok: false, message: `verify:all FAILED during CT (exit code ${ctRes.code}). Matrix skipped.`, code: ctRes.code, killPort: true })
      }
      console.log(`\n[agent] ⚠️ CT failed (code ${ctRes.code}), continuing to Matrix because of --no-fail-fast`)
    }

    console.log(`\n[agent] === verify:all (Phase 2: Matrix) ===`)
    const pnpmArgs = ['pipeline', 'test']
    if (matrixArgs.length === 0) pnpmArgs.push('--full')
    else pnpmArgs.push(...normalizeTestArgs(matrixArgs))

    const matrixRes = await runCommand('pnpm', pnpmArgs, { skipQueue: true, cwd: repoRoot })
    const matrixCode = numericExitCode(matrixRes.code)

    if (ctRes.code !== 0 || matrixCode !== 0) {
      finishAgent({ ok: false, message: `verify:all FAILED (CT: ${ctRes.code}, Matrix: ${matrixCode})`, code: matrixCode || ctRes.code, killPort: true })
    }
    finishAgent({ ok: true, message: 'verify:all PASSED successfully.', code: 0 })
  })
}

async function actionVerify(componentName) {
  if (!componentName) {
    console.error(`[agent] Error: Component name required. Usage: pnpm agent verify <Component>`)
    process.exit(1)
  }

  return withCpuGate('exclusive', 'verify', async () => {
    // 1. typecheck
    console.log(`\n[agent] === verify ${componentName} (Phase 1: Typecheck) ===`)
    const libPkgPath = path.join(repoRoot, 'packages/reference-lib/package.json')
    let hasTypecheck = false
    try {
      const pkg = JSON.parse(fs.readFileSync(libPkgPath, 'utf-8'))
      if (pkg.scripts && pkg.scripts.typecheck) hasTypecheck = true
    } catch {}
    
    if (hasTypecheck) {
      const tcRes = await runCommand('pnpm', ['--filter', '@reference-ui/lib', 'typecheck'], { skipQueue: true })
      if (tcRes.code !== 0) {
         finishAgent({ ok: false, message: `verify FAILED during typecheck (code ${tcRes.code})`, code: tcRes.code })
      }
    } else {
      console.log(`[agent] Typecheck script not found in @reference-ui/lib, skipping.`)
    }

    // 2. Unit
    console.log(`\n[agent] === verify ${componentName} (Phase 2: Unit) ===`)
    const ctScript = path.join(repoRoot, '.agents/skills/test-component/scripts/test-component.mjs')
    const unitRes = await runCommand('node', [ctScript, componentName, '--unit'], { skipQueue: true, cwd: repoRoot })
    if (unitRes.code !== 0) {
      finishAgent({ ok: false, message: `verify FAILED during unit tests (code ${unitRes.code})`, code: unitRes.code })
    }

    // 3. Build lib dist if missing
    console.log(`\n[agent] === verify ${componentName} (Phase 3: Build) ===`)
    const ok = await ensureLibBuild()
    if (!ok) finishAgent({ ok: false, message: `verify FAILED during build`, code: 1 })

    // 4. e2e
    console.log(`\n[agent] === verify ${componentName} (Phase 4: CT E2E) ===`)
    const e2eRes = await runCommand('node', [ctScript, componentName, '--e2e'], { skipQueue: true, cwd: repoRoot })
    if (e2eRes.code !== 0) {
      finishAgent({ ok: false, message: `verify FAILED during CT E2E (code ${e2eRes.code})`, code: e2eRes.code, killPort: true })
    }

    finishAgent({ ok: true, message: `verify ${componentName} PASSED successfully.`, code: 0 })
  })
}

// 9. Main CLI Entrypoint
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'status'

  if (command !== 'daemon' && ensureQosJailbreak()) {
    return
  }

  switch (command) {
    case 'status':
      await actionStatus()
      break

    case 'run':
    case 'exec': {
      const targetCmd = args[1]
      const targetArgs = args.slice(2)
      if (!targetCmd) {
        console.error('[agent] Error: Please specify a command to execute unthrottled, e.g.: agent run pnpm build')
        process.exit(1)
      }
      if (looksLikePipelineTest(targetCmd, targetArgs)) {
        console.error('[agent] `agent run` is not a test entry point. Redirecting to `agent test` so this run prints a PASSED/FAILED banner and exits.')
        const pipelineIdx = targetArgs.findIndex((a) => a === 'test' || a === 'test:matrix')
        const extra = targetArgs[pipelineIdx] === 'test:matrix' || targetArgs.includes('--full') ? ['--full'] : []
        const rest = targetArgs.slice(pipelineIdx + 1).filter((a) => a !== 'test' && a !== 'test:matrix')
        await actionTest([...extra, ...rest])
        break
      }
      console.log(`[agent] Running unthrottled (PRI 46): ${targetCmd} ${targetArgs.join(' ')}`)
      const res = await runCommand(targetCmd, targetArgs)
      process.exit(numericExitCode(res.code))
      break
    }

    case 'daemon':
      startDaemon()
      break

    case 'verify': {
      await actionVerify(args[1])
      break
    }

    case 'verify:all': {
      await actionVerifyAll(args.slice(1))
      break
    }

    case 'test': {
      let testArgs = args.slice(1)
      // Allow syntax like: pnpm agent test matrix [options]
      if (testArgs[0] === 'matrix') {
        testArgs = testArgs.slice(1)
      }
      await actionTest(testArgs)
      break
    }

    case 'test:matrix':
      // Full matrix run (equivalent to pnpm pipeline:test:matrix / pipeline test --full)
      await actionTest(['--full', ...args.slice(1)])
      break

    case 'matrix': {
      // Allow syntax like: pnpm agent matrix [options] or pnpm agent matrix test [options]
      const sub = args[1]
      if (sub === 'test' || sub === 'test:matrix') {
        const extra = sub === 'test:matrix' ? ['--full'] : []
        await actionTest([...extra, ...args.slice(2)])
      } else {
        await actionTest(args.slice(1))
      }
      break
    }

    case 'pipeline': {
      if (args[1] === 'test' || args[1] === 'test:matrix') {
        const extra = args[1] === 'test:matrix' ? ['--full'] : []
        await actionTest([...extra, ...args.slice(2)])
        break
      }
      console.log(`[agent] Running pipeline command unthrottled: pnpm pipeline ${args.slice(1).join(' ')}`)
      const pipeRes = await runCommand('pnpm', ['pipeline', ...args.slice(1)])
      process.exit(numericExitCode(pipeRes.code))
      break
    }

    case 'playwright':
    case 'pw':
      await actionPlaywright(args.slice(1))
      break

    case 'vitest':
    case 'vt':
      await actionVitest(args.slice(1))
      break

    case 'native': {
      const sub = args[1]
      if (sub === 'playwright' || sub === 'pw') {
        await actionPlaywright(args.slice(2))
      } else if (sub === 'vitest' || sub === 'vt') {
        await actionVitest(args.slice(2))
      } else {
        console.error(`[agent] Error: Unknown native test runner: '${sub}'. Use 'pnpm agent native playwright' or 'pnpm agent native vitest'.`)
        process.exit(1)
      }
      break
    }

    case 'help':
    case '--help':
    case '-h':
      console.log(`
Reference UI Agent CLI (Unthrottled Darwin QoS Runner)

Usage:
  agent status                          Check QoS priority, Docker, and daemon state
  agent run <command...>                Execute ANY command unthrottled (PRI 46, unthrottled I/O)
  agent playwright [pkg] [args...]      Run native Playwright unthrottled (alias: agent pw)
  agent vitest [pkg] [args...]          Run native Vitest unthrottled (alias: agent vt)
  agent test [options]                  Run unthrottled matrix test in Dagger (wraps pipeline test)
  agent test:matrix [options]           Run full matrix test in Dagger (wraps pipeline test --full)
  agent pipeline <command>              Run any pipeline command unthrottled
  agent daemon                          Start terminal bridge daemon in current terminal
  agent help                            Show this help message

Universal Execution Examples:
  agent run pnpm build
  agent run pnpm --filter @reference-ui/core typecheck

Do not use agent run pnpm pipeline test for matrix. Use agent test / agent test:matrix so the run ends with a PASSED/FAILED banner and a numeric exit code.

Playwright Examples (Fast Iteration):
  agent pw overlays -g "OV-OUT"
  agent pw overlays -g "OV-LAYER"
  agent pw lib tests/e2e/toast.spec.ts
  agent pw -g "OV-OUT"
  agent pw --workers 4

Vitest Examples:
  agent vt lib -t "Dialog"
  agent vt -t "Overlay"
  agent vt packages/reference-lib/src/components/Dialog/__tests__/Dialog.test.tsx

Options for test / matrix (Dagger):
  --packages <names>                    e.g. @matrix/lib or @matrix/tokens
  --react <runtime>                     e.g. react17, react18, react19
  --full                                Expand all declared React runtimes and bundlers
  --trace                               Stream Dagger engine logs for the current exec

Programmatic API:
  import { runPlaywright, runVitest, runMatrix, runPipeline } from './.agents/skills/test-core/scripts/run.mjs'
  await runPlaywright(['overlays', '-g', 'OV-OUT'])
  await runVitest(['lib', '-t', 'Dialog'])
  await runMatrix({ packages: '@matrix/tokens', react: 'react19' })
`)
      break

    default:
      console.log(`[agent] Passing through to pipeline: ${args.join(' ')}`)
      const res = await runCommand('pnpm', ['pipeline', ...args])
      process.exit(numericExitCode(res.code))
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error('[agent] Fatal error:', err)
    process.exit(1)
  })
}

