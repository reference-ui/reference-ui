#!/usr/bin/env node

/**
 * Component Test Runner for Reference UI (`pnpm agentct`)
 *
 * Default: colocated Vitest, then Playwright CT on workspace React 19.
 * `--react 17|18|19|all` pins the CT Vite gallery via @ct-runtime packages (no pipeline).
 * Visual snapshots run on React 19 only. Snapshot writes need --update-snapshots --confirm.
 *
 * One persistent daemon serves every checkout and worktree: it owns ONE Vite gallery
 * on :3101 and runs each job in its caller's tree (runner, specs, stories, CSS, Vite,
 * artifacts). Concurrent `pnpm agentct` invocations queue one job at a time, with at
 * most two test workers.
 */

import { spawn, spawnSync, execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import net from 'node:net'
import { loadCatalog, searchCases, selectCase } from './cases/catalog.mjs'
import { evidenceErrors, runsNeedingSheets } from './cases/results.mjs'
import { unitDirectory, artifactsDirectory, CORE_TARGET, CORE_UNIT_PATHS } from './cases/targets.mjs'
import { resolveSelection, selectLegacyTarget, executionArguments } from './cases/selection.mjs'
import { parseCatalogInvocation, formatCatalogJson, formatCatalogHuman, listingExitCode, writeCatalogOutput } from './cases/output.mjs'
import { canAcquireJob, MAX_ACTIVE_JOBS, workerBudget, selectOwnedGroups, isListenerOwnedByGroups, findWorkspaceRoot, resolveJobTree, galleryServes, jobTreeProblem } from './cases/resources.mjs'
import { writeVideoContactSheets } from './videoContactSheet.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import { acquireCpuGate } from '../../test-core/scripts/cpu-gate.mjs'

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
const DAEMON_SPAWN_LOCK = '/tmp/ref-ct-agent.spawn.lock'
const DAEMON_START_LOCK = '/tmp/ref-ct-agent.start.lock'
const DAEMON_LOG_FILE = '/tmp/ref-ct-agent.log'
const QUEUE_DIR = '/tmp/ref-ct-agent-queue'
const LOCK_FILE = path.join(QUEUE_DIR, 'active.lock')
const MAX_CONCURRENCY = MAX_ACTIVE_JOBS
const WORKERS_PER_SLOT = workerBudget(process.env.CT_WORKERS)
const DAEMON_IDLE_MS = 5 * 60 * 1000
const IS_INNER = process.env.AGENTCT_INNER === '1'
const DAEMON_OWNS_VITE = process.env.AGENTCT_VITE_OWNED_BY_DAEMON === '1'

// Bounded POSIX inspection. Both `ps` and `lsof` must stay short and capped so a
// hung or noisy system can never stall the runner or blow the process heap.
const INSPECT_TIMEOUT_MS = 1000
const INSPECT_MAX_BUFFER = 4 * 1024 * 1024

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
      fs.writeFileSync(path.join(mutexPath, 'pid'), String(process.pid))
      acquired = true
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      try {
        const owner = Number(fs.readFileSync(path.join(mutexPath, 'pid'), 'utf-8'))
        if (Number.isInteger(owner) && owner > 0 && !isPidAlive(owner)) fs.rmSync(mutexPath, { recursive: true })
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      sleepSync(20)
    }
  }
  if (!acquired) throw new Error('Component queue mutex timed out; execution was not started.')
  try {
    return action()
  } finally {
    if (acquired) {
      try { fs.rmSync(mutexPath, { recursive: true, force: true }) } catch {}
    }
  }
}

async function acquireQueueLock(taskInfo = {}, { isCanceled } = {}) {
  const canceled = () => typeof isCanceled === 'function' && isCanceled()
  const canceledResult = () => ({ slotIndex: -1, canceled: true, release: async () => {} })
  if (canceled()) return canceledResult()

  fs.mkdirSync(QUEUE_DIR, { recursive: true })

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

  fs.writeFileSync(entryPath, JSON.stringify(entryData, null, 2))

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

  // Signals tear down children before the exit hook releases the execution slot.
  process.on('exit', cleanup)

  // Canceled waiters must not hold a slot or queue entry: drop our own entry
  // without touching the active owner's lock, and release the exit listener.
  const releaseCanceled = () => {
    cleanup()
    process.off('exit', cleanup)
    return canceledResult()
  }

  let loggedWait = false
  let lastLogTime = 0

  try {
    while (true) {
      if (canceled()) return releaseCanceled()

      const files = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json'))

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
                fs.writeFileSync(LOCK_FILE, JSON.stringify(aliveLocks, null, 2))
              }
            }
            activeLocks = aliveLocks
          } catch (error) {
            throw new Error(`Cannot read component execution lock: ${error.message}`)
          }
        }

        if (canAcquireJob(myIndex, activeLocks.length)) {
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
          fs.writeFileSync(LOCK_FILE, JSON.stringify(activeLocks, null, 2))
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
  } catch (error) {
    // Never strand our queue entry or lock payload when acquisition fails.
    cleanup()
    process.off('exit', cleanup)
    throw error
  }
}

function numericExitCode(code) {
  if (typeof code === 'number' && Number.isFinite(code)) return code | 0
  return 1
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// `acquireCpuGate` registers SIGINT/SIGTERM release listeners by default, which
// would release the gate on signal before this runner's children have stopped.
// Wrapper: snapshot the signal listeners immediately before the actual
// acquisition, then drop only the callbacks this acquisition added, preserving
// the module's own `exit` fallback. Declared as a hoisted function so the
// daemon CLI can call it before later top-level consts initialize (no TDZ).
function acquireCpuGateHoldingSignals(holderClass, taskName = '') {
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP']
  const before = new Map()
  for (const signal of signals) before.set(signal, new Set(process.listeners(signal)))
  return acquireCpuGate(holderClass, taskName).then((release) => {
    for (const signal of signals) {
      const prior = before.get(signal)
      for (const listener of process.listeners(signal)) {
        if (!prior.has(listener)) process.removeListener(signal, listener)
      }
    }
    return release
  })
}

function probeDaemon(timeoutMs = 400) {
  return new Promise((resolve, reject) => {
    const probe = net.createConnection(SOCKET_PATH)
    const timer = setTimeout(() => {
      probe.destroy()
      resolve(false)
    }, timeoutMs)
    probe.on('connect', () => {
      clearTimeout(timer)
      probe.destroy()
      resolve(true)
    })
    probe.on('error', error => {
      clearTimeout(timer)
      if (['EPERM', 'EACCES'].includes(error.code)) {
        reject(new Error(`Daemon socket access denied (${error.code}); existing daemon state was preserved. Run agentct with socket access.`))
        return
      }
      resolve(false)
    })
  })
}

async function isDaemonAlive() {
  const pid = readDaemonPid()
  if (!fs.existsSync(SOCKET_PATH)) {
    if (isPidAlive(pid)) throw new Error(`Daemon PID ${pid} is alive but its socket is unavailable; existing state was preserved.`)
    return false
  }
  const alive = await probeDaemon()
  if (!alive) {
    const currentPid = readDaemonPid()
    if (isPidAlive(currentPid)) throw new Error(`Daemon PID ${currentPid} did not respond; existing state was preserved.`)
  }
  return alive
}

function readDaemonPid() {
  try { return Number(fs.readFileSync(DAEMON_PID_FILE, 'utf-8')) } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return 0
  }
}

async function acquireDaemonStartLock() {
  const started = Date.now()
  while (Date.now() - started < 10000) {
    try {
      fs.mkdirSync(DAEMON_START_LOCK)
      fs.writeFileSync(path.join(DAEMON_START_LOCK, 'pid'), String(process.pid))
      const release = () => {
        fs.rmSync(DAEMON_START_LOCK, { recursive: true, force: true })
        process.off('exit', release)
      }
      process.on('exit', release)
      return release
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      try {
        const owner = Number(fs.readFileSync(path.join(DAEMON_START_LOCK, 'pid'), 'utf-8'))
        if (Number.isInteger(owner) && owner > 0 && !isPidAlive(owner)) fs.rmSync(DAEMON_START_LOCK, { recursive: true })
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      await sleep(150)
    }
  }
  throw new Error('Daemon startup is already in progress; existing state was preserved.')
}

function parseJobRuntime(argv = []) {
  const args = Array.isArray(argv) ? argv : []
  const unitOnly = args.includes('--unit') && !args.includes('--e2e')
  if (unitOnly || args[0] === CORE_TARGET) return null
  const i = args.indexOf('--react')
  if (i < 0) return '19'
  const raw = String(args[i + 1] || '19').trim()
  if (!raw || raw.startsWith('-')) return '19'
  if (raw === 'all' || raw.includes(',')) return 'exclusive'
  return raw.replace(/^react/i, '')
}

async function stopDaemonProcess() {
  const releaseStartLock = await acquireDaemonStartLock()
  try {
    const pid = readDaemonPid()
    if (isPidAlive(pid)) {
      // Retain the daemon's owned descendant groups before signaling, so an
      // unresponsive daemon cannot leave its job/gallery groups behind. The
      // daemon's own group is excluded: a foreground daemon may share the
      // supervisor's terminal group, which must never be signaled.
      const owned = collectOwnedGroups(pid, { includeRootGroup: false })
      try { process.kill(pid, 'SIGTERM') } catch (error) {
        if (error.code !== 'ESRCH') throw new Error(`Cannot stop daemon (${error.code}); existing state was preserved.`)
      }
      const start = Date.now()
      while (Date.now() - start < 3000 && isPidAlive(pid)) {
        await sleep(50)
      }
      if (isPidAlive(pid)) {
        try { process.kill(pid, 'SIGKILL') } catch (error) {
          if (error.code !== 'ESRCH') throw new Error(`Cannot stop daemon (${error.code}); existing state was preserved.`)
        }
        await sleep(100)
      }
      if (isPidAlive(pid)) throw new Error(`Daemon PID ${pid} remains alive; existing state was preserved.`)
      // Hold the startup mutex until every owned descendant is confirmed gone.
      await waitUntilStopped(owned, { label: 'daemon descendants' })
    } else if (fs.existsSync(SOCKET_PATH) && await probeDaemon()) {
      throw new Error('Daemon socket is live without a known PID; existing state was preserved.')
    }
    try { fs.unlinkSync(SOCKET_PATH) } catch {}
    try { fs.unlinkSync(DAEMON_PID_FILE) } catch {}
    console.log('[agentct] Daemon stopped.')
  } finally {
    releaseStartLock()
  }
}

async function startDaemon({ auto = false } = {}) {
  const releaseStartLock = await acquireDaemonStartLock()
  if (await isDaemonAlive()) {
    console.log(`[agentct-daemon] An agentct daemon is already running at ${SOCKET_PATH}.`)
    process.exit(0)
  }
  // Only the startup owner can remove stale state before binding the socket.
  fs.rmSync(SOCKET_PATH, { force: true })
  fs.rmSync(DAEMON_PID_FILE, { force: true })

  const jobTreeFs = {
    findRoot: (cwd) => findWorkspaceRoot(cwd, fs.existsSync),
    exists: fs.existsSync,
    realpath: fs.realpathSync,
  }
  const vitePort = process.env.CT_PORT ? parseInt(process.env.CT_PORT, 10) : 3101
  const viteUrl = `http://localhost:${vitePort}/playwright/index.html`
  const queue = []
  const activeJobs = new Set()
  let viteChild = null
  let viteClosePromise = null
  let viteRuntime = null
  let viteRoot = null
  let viteCaptureTimer = null
  let viteOwnedGroups = new Set()
  let pumping = false
  let idleTimer = null
  let viteLock = Promise.resolve()
  let ownsDaemonState = false

  function withViteLock(fn) {
    const run = viteLock.then(fn, fn)
    viteLock = run.then(() => undefined, () => {})
    return run
  }
  let daemonPnpm = 'pnpm'
  try {
    daemonPnpm = execSync('which pnpm', { encoding: 'utf-8' }).trim() || 'pnpm'
  } catch {}

  async function isViteUp() {
    try {
      const res = await fetch(viteUrl, { signal: AbortSignal.timeout(1500) })
      return res.status < 500
    } catch {
      return false
    }
  }

  async function stopViteUnlocked() {
    if (viteCaptureTimer) {
      clearInterval(viteCaptureTimer)
      viteCaptureTimer = null
    }
    // Retain the gallery reference, its groups, and its close promise until both
    // the real close/drain and a positive group stop have happened. A natural
    // close nulls nothing here: its retained groups must still be stopped.
    const child = viteChild
    const closePromise = viteClosePromise
    const owned = new Set(viteOwnedGroups)
    if (!child?.pid && owned.size === 0 && !closePromise) {
      viteChild = null
      viteRuntime = null
      viteRoot = null
      viteClosePromise = null
      viteOwnedGroups = new Set()
      return
    }
    if (child?.pid) {
      if (process.platform !== 'win32') owned.add(child.pid)
      for (const pgid of collectOwnedGroups(child.pid)) owned.add(pgid)
      try { process.kill(-child.pid, 'SIGTERM') } catch {
        try { process.kill(child.pid, 'SIGTERM') } catch {}
      }
    }
    // Bounded graceful window, then escalate and hold until the gallery's groups
    // are positively gone. Await the real close/drain in parallel so retained
    // groups are never discarded while the child is still winding down.
    await waitForOwnedGroups(owned, 1000)
    const stopped = waitUntilStopped(owned, { label: 'vite gallery' })
    if (closePromise) await Promise.all([closePromise, stopped])
    else await stopped
    // Both conditions met: only now release the gallery reference and groups.
    viteChild = null
    viteRuntime = null
    viteRoot = null
    viteClosePromise = null
    viteOwnedGroups = new Set()
  }

  async function stopVite() {
    return withViteLock(() => stopViteUnlocked())
  }

  // The gallery serves one tree at a time; a job from another tree restarts it there.
  async function ensureVite(tree, runtime, { isCanceled } = {}) {
    return withViteLock(async () => {
      const canceled = () => isCleaningUp || (typeof isCanceled === 'function' && isCanceled())
      const target = runtime || '19'
      if (canceled()) return false
      const gallery = { root: viteRoot, runtime: viteRuntime }
      if (viteChild?.pid && galleryServes(gallery, { root: tree.root, runtime: target }) && isPidAlive(viteChild.pid) && await isViteUp()) {
        // A live warm child plus an HTTP 200 is not enough: the listener must
        // still be held by the warm child's own groups, or we restart it.
        const warmOwned = collectOwnedGroups(viteChild.pid)
        warmOwned.add(viteChild.pid)
        for (const pgid of warmOwned) viteOwnedGroups.add(pgid)
        if (portOwnedByProcessGroups(vitePort, warmOwned)) return true
      }
      if (viteChild && viteRoot && viteRoot !== tree.root) {
        console.log(`[agentct-daemon] Gallery tree changes from ${viteRoot} to ${tree.root}; restarting Vite.`)
      }
      await stopViteUnlocked()
      // A canceled job must not spawn a gallery it will immediately orphan.
      if (canceled()) return false
      console.log(`[agentct-daemon] Starting persistent Vite on :${vitePort} (react ${target}) in ${tree.libDir}...`)
      const child = spawn(daemonPnpm, ['exec', 'vite', '--config', 'playwright/vite.config.ts'], {
        cwd: tree.libDir,
        env: {
          ...process.env,
          CT_REACT: target,
          CT_PORT: String(vitePort),
          FORCE_COLOR: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
      })
      viteChild = child
      viteRuntime = target
      viteRoot = tree.root
      viteOwnedGroups = new Set()
      if (child.pid && process.platform !== 'win32') viteOwnedGroups.add(child.pid)
      // One close promise per gallery, established at spawn. Stop awaits it so a
      // natural close cannot discard retained groups before cleanup drains them.
      let resolveViteClose
      viteClosePromise = new Promise((resolve) => { resolveViteClose = resolve })
      // Drain stdout; keep the existing stderr error passthrough.
      child.stdout?.resume()
      child.stderr?.on('data', (data) => {
        const text = data.toString()
        if (/error|failed|EADDRINUSE/i.test(text)) process.stderr.write(text)
      })
      let spawnError = null
      let exited = false
      child.on('error', (err) => { spawnError = err })
      child.on('exit', () => { exited = true })
      // Tracking persists through close, when stdio is fully drained; exit alone
      // is too early to drop the gallery from ownership. Retained owned groups
      // stay until stopViteUnlocked positively stops them.
      child.on('close', (code) => {
        // Only this child owns the capture timer; a later gallery must not have
        // its timer cleared by a stale close.
        if (viteChild === child) {
          if (viteCaptureTimer) {
            clearInterval(viteCaptureTimer)
            viteCaptureTimer = null
          }
          console.log(`[agentct-daemon] Vite stopped (${code ?? 0})`)
        }
        resolveViteClose()
      })

      // Retain observed detached descendants while the root is alive; once the
      // leader exits they can no longer be discovered.
      if (child.pid && process.platform !== 'win32') {
        const captureVite = () => {
          if (!child.pid) return
          for (const pgid of collectOwnedGroups(child.pid)) viteOwnedGroups.add(pgid)
        }
        captureVite()
        viteCaptureTimer = setInterval(captureVite, 1000)
        viteCaptureTimer.unref?.()
      }
      try {
        const start = Date.now()
        while (Date.now() - start < 90_000) {
          if (spawnError) throw new Error(`Vite failed to spawn: ${spawnError.message}`)
          if (canceled()) throw new Error('Vite start canceled')
          if (exited || !isPidAlive(child.pid)) break
          if (await isViteUp()) {
            for (const pgid of collectOwnedGroups(child.pid)) viteOwnedGroups.add(pgid)
            // Accept readiness only while the spawned Vite is alive and actually
            // owns the port, so an unrelated or exiting listener cannot fool us.
            if (viteChild === child && !spawnError && !exited && portOwnedByProcessGroups(vitePort, viteOwnedGroups)) {
              console.log(`[agentct-daemon] Vite ready ${viteUrl} (react ${target}, tree ${tree.root})`)
              return true
            }
          }
          await sleep(200)
        }
        throw new Error(`Vite failed to become ready at ${viteUrl}`)
      } catch (err) {
        // Same cleanup as any stop: signal, await close/drain, positively stop
        // retained groups, and only then release tracking. Covers a pid-less
        // failed spawn whose close would otherwise be lost.
        await stopViteUnlocked()
        // Aborting on cancellation cleans the owned gallery and reports no start.
        if (err.message === 'Vite start canceled') return false
        throw err
      }
    })
  }

  function bumpIdle() {
    if (!auto) return
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      if (activeJobs.size === 0 && queue.length === 0) {
        console.log('[agentct-daemon] Idle timeout, shutting down persistent Vite + daemon.')
        cleanup(0)
      }
    }, DAEMON_IDLE_MS)
  }

  function canStart(job) {
    if (activeJobs.size >= MAX_CONCURRENCY) return false
    const active = [...activeJobs]
    if (job.runtime === 'exclusive') return active.length === 0
    if (active.some((j) => j.runtime === 'exclusive')) return false
    if (job.runtime && job.runtime !== 'exclusive') {
      const viteUsers = active.filter((j) => j.runtime && j.runtime !== 'exclusive')
      if (viteUsers.some((j) => j.runtime !== job.runtime || j.tree.root !== job.tree.root)) return false
    }
    return true
  }

  function describeJob(job) {
    const argv = job.req.argv || []
    return argv.length ? argv.join(' ') : '(full suite)'
  }

  async function startJob(job) {
    const { socket, req } = job
    const exclusive = job.runtime === 'exclusive'
    const label = describeJob(job)
    const workers = Math.min(WORKERS_PER_SLOT, workerBudget(req.env?.CT_WORKERS))
    let releaseQueue = async () => {}
    let releaseGate = async () => {}
    let cancelTimer = null
    let captureTimer = null
    let restoreVite = false

    // Completion is established before the first await/spawn and resolves only
    // after the child has closed, retained owned descendants are positively
    // stopped, and both leases are released, so shutdown can await the real end.
    let resolveCompletion
    job.completion = new Promise((resolve) => { resolveCompletion = resolve })

    const finishJob = () => {
      if (job.finishPromise) return job.finishPromise
      job.finishPromise = (async () => {
        try {
          if (cancelTimer) clearTimeout(cancelTimer)
          if (captureTimer) {
            clearInterval(captureTimer)
            captureTimer = null
          }
          // A finished or canceled job must not free its slot while any retained
          // owned group survives; hold until they are positively stopped.
          if (job.ownedGroups?.size) {
            await waitUntilStopped(job.ownedGroups, { label: `job ${label}` })
          }
          // A canceled job never restores a gallery it declined to keep.
          if (restoreVite && !isCleaningUp && !job.canceled) {
            try { await ensureVite(job.tree, '19', { isCanceled: () => isCleaningUp || job.canceled }) } catch (err) {
              console.error('[agentct-daemon] Failed to restore Vite 19: ' + err.message)
            }
          }
          await releaseGate()
          await releaseQueue()
          // Positively stopped and fully released: only now leave the active set.
          activeJobs.delete(job)
          bumpIdle()
          if (!isCleaningUp) processQueue()
          resolveCompletion()
        } catch (err) {
          // Hold the job, its slot, and its state. An unclean group or failed
          // release must never be reported complete or let shutdown proceed and
          // release the queue via the exit hook before cleanup has finished.
          console.error('[agentct-daemon] Job cleanup failed (' + label + '); holding slot: ' + err.message)
        }
      })()
      return job.finishPromise
    }

    job.cancel = () => {
      job.canceled = true
      if (!job.child?.pid || job.finishPromise) return
      // Merge the owned descendant groups captured while the root was alive;
      // detached Playwright leaders cannot be found once this job's root dies.
      if (!job.ownedGroups) job.ownedGroups = new Set()
      for (const pgid of collectOwnedGroups(job.child.pid)) job.ownedGroups.add(pgid)
      job.ownedGroups.add(job.child.pid)
      if (cancelTimer) return
      console.log('[agentct-daemon] Client disconnected. Terminating child...')
      killProcessGroup(job.child.pid, 'SIGTERM')
      // Keep the slot until the child closes, even when graceful shutdown stalls.
      cancelTimer = setTimeout(() => {
        signalOwnedGroups(job.ownedGroups, 'SIGKILL')
        killProcessGroup(job.child.pid, 'SIGKILL')
      }, 400)
    }

    try {
      const lock = await acquireQueueLock(
        { cmd: 'agentct', component: label },
        { isCanceled: () => job.canceled || socket.destroyed || isCleaningUp },
      )
      releaseQueue = lock.release
      if (lock.canceled || job.canceled || socket.destroyed || isCleaningUp) {
        await finishJob()
        return
      }
      const prevGateEnv = process.env.REFERENCE_UI_CPU_GATE_HELD
      if (req.env?.REFERENCE_UI_CPU_GATE_HELD) {
        process.env.REFERENCE_UI_CPU_GATE_HELD = req.env.REFERENCE_UI_CPU_GATE_HELD
      }
      try {
        releaseGate = await acquireCpuGateHoldingSignals('ct', label)
      } finally {
        if (prevGateEnv !== undefined) process.env.REFERENCE_UI_CPU_GATE_HELD = prevGateEnv
        else delete process.env.REFERENCE_UI_CPU_GATE_HELD
      }
      if (job.canceled || socket.destroyed || isCleaningUp) {
        await finishJob()
        return
      }
      if (exclusive) {
        restoreVite = Boolean(viteChild)
        await stopVite()
      } else if (job.runtime) await ensureVite(job.tree, job.runtime, { isCanceled: () => job.canceled || socket.destroyed })
      if (job.canceled || socket.destroyed || isCleaningUp) {
        await finishJob()
        return
      }

      console.log('[agentct-daemon] Starting (1 active job, workers=' + workers + ', tree ' + job.tree.root + '): ' + label)
      socket.write(JSON.stringify({ type: 'start', workers, port: vitePort, root: job.tree.root, pid: process.pid }) + '\n')
      // The job's own runner, so specs, stories, CSS and artifacts are its tree's.
      const child = spawn(process.execPath, [job.tree.runner, ...(req.argv || [])], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: req.cwd || job.tree.root,
        env: {
          ...process.env,
          ...req.env,
          AGENTCT_INNER: '1',
          AGENTCT_JOB_SLOT_HELD: '1',
          AGENTCT_VITE_OWNED_BY_DAEMON: exclusive ? '0' : '1',
          CT_PORT: String(vitePort),
          CT_WORKERS: String(workers),
          __AGENT_CLI_JAILBROKEN: '1',
          FORCE_COLOR: '1',
        },
        detached: process.platform !== 'win32',
      })
      job.child = child
      job.ownedGroups = new Set()
      // Capture observed detached descendants periodically while the root is
      // alive; after the leader exits they can no longer be discovered.
      if (child.pid && process.platform !== 'win32') {
        job.ownedGroups.add(child.pid)
        const capture = () => {
          if (!child.pid) return
          for (const pgid of collectOwnedGroups(child.pid)) job.ownedGroups.add(pgid)
        }
        capture()
        captureTimer = setInterval(capture, 1000)
        captureTimer.unref?.()
      }
      if (job.canceled || socket.destroyed || isCleaningUp) {
        job.cancel()
      }
      for (const [stream, type] of [[child.stdout, 'stdout'], [child.stderr, 'stderr']]) {
        stream.on('data', data => {
          if (type === 'stdout') process.stdout.write(data)
          else process.stderr.write(data)
          if (!socket.destroyed) socket.write(JSON.stringify({ type, data: data.toString() }) + '\n')
        })
      }
      child.on('close', (code, signal) => {
        console.log('[agentct-daemon] Finished (' + label + ') code ' + (code ?? 1))
        if (!socket.destroyed) {
          socket.end(JSON.stringify({ type: 'exit', code: numericExitCode(code), signal }) + '\n')
        }
        finishJob()
      })
      child.on('error', err => {
        console.error('[agentct-daemon] Process error:', err)
        if (!socket.destroyed) socket.end(JSON.stringify({ type: 'error', error: err.message }) + '\n')
        // Failed spawns still emit close; that event releases the slot.
      })
    } catch (err) {
      if (!socket.destroyed) socket.end(JSON.stringify({ type: 'error', error: err.message }) + '\n')
      await finishJob()
    }
  }

  async function processQueue() {
    if (pumping || isCleaningUp) return
    pumping = true
    try {
      while (!isCleaningUp) {
        const idx = queue.findIndex((job) => canStart(job))
        if (idx < 0) break
        const job = queue.splice(idx, 1)[0]
        activeJobs.add(job)
        queue.forEach((item, i) => {
          try {
            item.socket.write(JSON.stringify({ type: 'queue', position: i + 1, total: queue.length }) + '\n')
          } catch {}
        })
        startJob(job)
      }
    } finally {
      pumping = false
    }
  }

  const server = net.createServer((socket) => {
    socket.on('error', () => socket.destroy())
    let buffer = ''
    socket.on('data', async (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const req = JSON.parse(line.trim())
          const argv = req.argv || req.args || []
          const job = {
            socket,
            tree: resolveJobTree(req, jobTreeFs),
            req: { ...req, argv },
            runtime: req.runtime === null ? null : parseJobRuntime(argv),
            canceled: false,
            child: null,
          }
          queue.push(job)
          bumpIdle()
          if (activeJobs.size >= MAX_CONCURRENCY) {
            const pos = queue.length
            console.log(`[agentct-daemon] Job queued (position ${pos}): ${describeJob(job)}`)
            try {
              socket.write(JSON.stringify({ type: 'queue', position: pos, total: queue.length }) + '\n')
            } catch {}
          } else {
            processQueue()
          }

          socket.on('close', () => {
            job.canceled = true
            job.cancel?.()
            const idx = queue.indexOf(job)
            if (idx !== -1) {
              queue.splice(idx, 1)
              console.log(`[agentct-daemon] Queued job canceled (client disconnected)`)
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

  let isCleaningUp = false
  const removeDaemonState = () => {
    if (!ownsDaemonState || readDaemonPid() !== process.pid) return
    try { fs.unlinkSync(SOCKET_PATH) } catch {}
    try { fs.unlinkSync(DAEMON_PID_FILE) } catch {}
  }
  const cleanup = async (code = 0) => {
    if (isCleaningUp) return
    // Shutdown owns the flag first so no completion can enqueue more work.
    isCleaningUp = true
    if (idleTimer) clearTimeout(idleTimer)
    const jobs = [...activeJobs]
    // Inner runners receive TERM first so they can tear down their detached tests.
    for (const job of jobs) job.cancel?.()
    for (const job of queue) job.socket.destroy()
    queue.length = 0
    // Every active job carries a real completion promise; a missing one is a
    // broken invariant, so fail closed instead of letting shutdown race ahead
    // and release the queue before cleanup has finished.
    for (const job of jobs) {
      if (!job.completion) {
        console.error('[agentct-daemon] Invariant violation: active job without completion; holding daemon shutdown.')
        return
      }
    }
    // Await each job's real completion: child close/drain, owned-descendant
    // cleanup, and lease release. No fixed sleep and no exit before the work ends.
    await Promise.all(jobs.map((job) => job.completion))
    // Stop the shared gallery through the serialized lock and positively confirm;
    // a failure must hold the daemon, never exit into a released queue.
    try {
      await stopVite()
    } catch (err) {
      console.error('[agentct-daemon] Gallery shutdown failed; holding daemon: ' + err.message)
      return
    }
    // Belt-and-braces for any group a completion could not observe while alive.
    for (const job of jobs) {
      if (job.ownedGroups?.size) {
        await waitUntilStopped(job.ownedGroups, { label: `job ${describeJob(job)}` })
      } else if (job.child?.pid) {
        const owned = collectOwnedGroups(job.child.pid)
        owned.add(job.child.pid)
        await waitUntilStopped(owned, { label: `job ${describeJob(job)}` })
      }
    }
    removeDaemonState()
    try { server.close() } catch {}
    process.exit(code)
  }

  process.on('SIGINT', () => cleanup(0))
  process.on('SIGTERM', () => cleanup(0))
  process.on('SIGHUP', () => cleanup(0))
  process.on('exit', () => {
    removeDaemonState()
  })

  await new Promise((resolve, reject) => {
    server.listen(SOCKET_PATH, () => {
      fs.writeFileSync(DAEMON_PID_FILE, String(process.pid))
      ownsDaemonState = true
      console.log(`[agentct-daemon] Listening at ${SOCKET_PATH}`)
      console.log(`[agentct-daemon] PID: ${process.pid}`)
      console.log(`[agentct-daemon] Queue: one active job, at most ${WORKERS_PER_SLOT} test workers`)
      console.log(auto
        ? `[agentct-daemon] Auto mode: idle timeout ${Math.round(DAEMON_IDLE_MS / 1000)}s`
        : `[agentct-daemon] Keep this terminal open. Persistent Vite on :${vitePort}.`)
      resolve()
    })
    server.on('error', reject)
  })
  releaseStartLock()

  bumpIdle()
}

function spawnAutoDaemon() {
  const out = fs.openSync(DAEMON_LOG_FILE, 'a')
  const args = process.platform === 'darwin'
    ? ['-a', '-d', 'default', '-t', '0', '-l', '0', process.execPath, __filename, 'daemon', '--auto']
    : [__filename, 'daemon', '--auto']
  const cmd = process.platform === 'darwin' ? 'taskpolicy' : process.execPath
  const child = spawn(cmd, args, {
    detached: true,
    stdio: ['ignore', out, out],
    env: {
      ...process.env,
      __AGENT_CLI_JAILBROKEN: process.platform === 'darwin' ? '1' : process.env.__AGENT_CLI_JAILBROKEN,
      FORCE_COLOR: '1',
    },
    cwd: findRepoRoot(__dirname),
  })
  child.on('error', error => console.error(`[agentct] Daemon launch failed: ${error.message}`))
  child.unref()
  fs.closeSync(out)
  return child
}

async function ensureDaemon() {
  if (await isDaemonAlive()) return true

  let spawnedHere = false
  let spawnedDaemon = null
  try {
    fs.mkdirSync(DAEMON_SPAWN_LOCK)
    spawnedHere = true
  } catch {
    const start = Date.now()
    while (Date.now() - start < 20_000) {
      if (await isDaemonAlive()) return true
      await sleep(150)
    }
    try {
      const stat = fs.statSync(DAEMON_SPAWN_LOCK)
      if (Date.now() - stat.mtimeMs > 20_000) fs.rmdirSync(DAEMON_SPAWN_LOCK)
    } catch {}
  }

  try {
    if (await isDaemonAlive()) return true
    if (spawnedHere) {
      console.log(`[agentct] Auto-starting persistent daemon (Vite :3101, ${MAX_CONCURRENCY} slots × ${WORKERS_PER_SLOT} workers)...`)
      spawnedDaemon = spawnAutoDaemon()
    }
    const start = Date.now()
    while (Date.now() - start < 25_000) {
      if (await isDaemonAlive()) return true
      await sleep(150)
    }
    if (!spawnedHere || isPidAlive(spawnedDaemon?.pid)) {
      throw new Error('Daemon startup has not completed; refusing overlapping fallback execution.')
    }
    return false
  } finally {
    if (spawnedHere) {
      try { fs.rmdirSync(DAEMON_SPAWN_LOCK) } catch {}
    }
  }
}

function sendToDaemon(argv) {
  // The job runs in the caller's tree (the workspace above its cwd, else this
  // script's checkout); the daemon's start ack has to confirm it.
  const clientRoot = fs.realpathSync(findWorkspaceRoot(process.cwd(), fs.existsSync) || repoRoot)
  return new Promise((resolve, reject) => {
    let completed = false
    let buffer = ''
    const client = net.createConnection(SOCKET_PATH, () => {
      if (!isJson) console.log(`[agentct] Connected to daemon at ${SOCKET_PATH}`)
      client.write(JSON.stringify({
        type: 'run',
        argv,
        runtime: runE2e ? parseJobRuntime(argv) : null,
        root: clientRoot,
        cwd: process.cwd(),
        env: {
          FORCE_COLOR: '1',
          REFERENCE_UI_CPU_GATE_HELD: process.env.REFERENCE_UI_CPU_GATE_HELD,
          CT_WORKERS: String(WORKERS_PER_SLOT),
        },
        pid: process.pid,
      }) + '\n')
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
            if (!isJson) console.log(`[agentct-queue] Waiting in daemon queue (position ${msg.position} of ${msg.total})...`)
          }
          if (msg.type === 'start') {
            const problem = jobTreeProblem(clientRoot, msg.root, msg.pid || readDaemonPid() || '<daemon pid>')
            if (problem) {
              completed = true
              console.error(problem)
              client.destroy()
              resolve(2)
              return
            }
            if (!isJson) console.log(`[agentct-queue] Slot acquired. Routing to warm Vite :${msg.port || 3101} (${msg.workers || WORKERS_PER_SLOT} workers).`)
          }
          if (msg.type === 'stdout') process.stdout.write(msg.data)
          if (msg.type === 'stderr') process.stderr.write(msg.data)
          if (msg.type === 'exit') {
            completed = true
            client.end()
            resolve(numericExitCode(msg.code))
          }
          if (msg.type === 'error') {
            completed = true
            client.end()
            console.error(`[agentct] Daemon error: ${msg.error}`)
            resolve(1)
          }
        } catch {}
      }
    })

    client.on('close', () => {
      if (!completed) reject(new Error('Daemon connection closed before completion'))
    })
    client.on('error', (err) => reject(err))
  })
}

async function delegateToDaemon(argv) {
  const ready = await ensureDaemon()
  if (!ready) {
    console.warn('[agentct] Daemon unavailable. Falling back to direct execution (file queue, no persistent Vite).')
    return null
  }
  try {
    return await sendToDaemon(argv)
  } catch (err) {
    let daemonStillLive = false
    try {
      daemonStillLive = await isDaemonAlive()
    } catch {
      daemonStillLive = true
    }
    if (daemonStillLive) {
      throw new Error(`Daemon handoff failed (${err.message}) while the daemon is still live. Refusing to fall back and take over its Vite; run 'pnpm agentct stop' or retry.`)
    }
    console.warn(`[agentct] Daemon handoff failed (${err.message}). Daemon is gone; falling back to direct execution.`)
    return null
  }
}

const repoRoot = findRepoRoot(__dirname)
const libDir = path.join(repoRoot, 'packages/reference-lib')
const playwrightDir = path.join(libDir, 'playwright')
const resultsDir = artifactsDirectory(playwrightDir, process.pid)
const resultsJsonPath = path.join(resultsDir, 'results.json')
const vitestJsonPath = path.join(resultsDir, `vitest-${process.pid}.json`)
const configPath = path.join(playwrightDir, 'playwright.config.ts')
const CT_PORT = process.env.CT_PORT ? parseInt(process.env.CT_PORT, 10) : 3101
const activeChildPids = new Set()
const ownedGalleryGroups = new Set()
let ctGalleryOwned = false
let activeSlotPort = null

function usage() {
  console.log(`
Usage: pnpm agentct [Component] [options]

  pnpm agentct list [--json]         List the validated component case catalog
  pnpm agentct search "focus" [--json]   Search case IDs, names, titles, and files
  pnpm agentct --search "focus" --json   Flag alias for the positional search form
  pnpm agentct Button --list --json  Scope a JSON listing to one component
  pnpm agentct check                 Check catalog conformity without running tests
  pnpm agentct run LIB-POPOVER-001    Execute the precise registered evidence
  pnpm agentct Popover                 Unit then e2e on React 19 (snapshots on)
  pnpm agentct Popover --unit        Vitest only (always workspace React 19)
  pnpm agentct core                  Vitest for the lib unit tests outside components (src/core, scripts)
  pnpm agentct Popover --e2e        Playwright CT only
  pnpm agentct Popover --react 18   CT against @ct-runtime/react-18 (no snapshots)
  pnpm agentct Popover --react all   CT on 17, then 18, then 19
  pnpm agentct Popover -g "escape"   Name filter (unit -t and Playwright -g)

  pnpm agentct daemon               Shared Vite + one-job queue in this terminal
  pnpm agentct stop                 Stop the persistent daemon and Vite :3101 (for every tree)

  --headed                     Playwright headed
  --all-sheets                 Build a frames.png for every video (default: failed tests only; env AGENTCT_ALL_SHEETS=1)
  --clean                      Clear this run's isolated artifact directory
  --json                       Machine-readable summary
  --update-snapshots --confirm   Rewrite React 19 baselines (human yes required)

One daemon serves all trees: each job runs in its caller's checkout or worktree.
Concurrent agentct invocations share ONE Vite gallery on :3101; it restarts when the tree changes.
Global queue permits one active job; Vitest and Playwright each use at most two workers.
CT_WORKERS=1 lowers the budget; higher overrides are capped at two.
React 17/18/19 are isolated @ct-runtime packages. Not the matrix pipeline.
Visual snapshots are React 19 only. Do not combine --update-snapshots with --react 17 or 18.
`)
}

const args = process.argv.slice(2)
let component = ''
let grep = ''
let isJson = false
let isClean = false
let isList = false
let targetId = null
let targetLine = null
let unitSelector = ''
let ctTargets = []
let exactVitestTarget = null
let isHeaded = false
let allSheets = process.env.AGENTCT_ALL_SHEETS === '1'
let updateSnapshots = false
let confirmSnapshotUpdate = false
let runUnit = true
let runE2e = true
let unitOnly = false
let e2eOnly = false
let reactArg = ''
let catalogCommand = ''
let catalogQuery = ''
let catalogSelector = ''
let registeredCase = null
let selectedCases = []

let catalogInvocation
try {
  catalogInvocation = parseCatalogInvocation(args)
} catch (error) {
  console.error(`[agentct] ${error.message}`)
  process.exit(2)
}
catalogCommand = catalogInvocation.command
catalogQuery = catalogInvocation.query
catalogSelector = catalogInvocation.selector
if (catalogInvocation.json) isJson = true
if (catalogInvocation.list) isList = true

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (i === 0 && ['list', 'search', 'check', 'run'].includes(arg)) {
    if (arg === 'search' || arg === 'run') i++
  } else if (arg === '--search') {
    i++
  } else if (arg === 'daemon') {
    const rest = args.slice(i + 1)
    if (rest.includes('stop') || rest.includes('--stop')) {
      await stopDaemonProcess()
      process.exit(0)
    }
    await startDaemon({ auto: rest.includes('--auto') })
    await new Promise(() => {})
  } else if (arg === 'stop') {
    await stopDaemonProcess()
    process.exit(0)
  } else if (arg === '--auto') {
    continue
  } else if (arg === '--help' || arg === '-h') {
    usage()
    process.exit(0)
  } else if (arg === '--list') {
    isList = true
  } else if (arg === '--line') {
    const value = Number(args[++i])
    if (!Number.isInteger(value) || value <= 0) {
      console.error('[agentct] --line needs a positive line number.')
      process.exit(2)
    }
    targetLine = value
  } else if (arg === '--id') {
    const value = args[++i]
    if (!value || value.startsWith('-')) {
      console.error('[agentct] --id needs a case ID or declaration target.')
      process.exit(2)
    }
    targetId = value
  } else if (arg === '--json') {
    isJson = true
  } else if (arg === '--clean') {
    isClean = true
  } else if (arg === '--headed') {
    isHeaded = true
  } else if (arg === '--all-sheets') {
    allSheets = true
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
      console.error('[agentct] --react needs 17, 18, 19, or all. Example: pnpm agentct Popover --e2e --react 18')
      process.exit(2)
    }
    reactArg = args[++i]
  } else if (arg === '-g' || arg === '--grep') {
    const value = args[++i]
    if (value === undefined) {
      console.error('[agentct] -g/--grep needs a pattern.')
      process.exit(2)
    }
    grep = value
  } else if (!arg.startsWith('-')) {
    if (!component) {
      component = arg
    } else if (!targetId) {
      targetId = arg
    }
  } else if (arg.startsWith('-')) {
    console.error(`[agentct] Unknown flag: ${arg}`)
    usage()
    process.exit(2)
  }
}

if (targetId && targetLine) {
  console.error('[agentct] Error: Cannot pass both --id and --line.')
  process.exit(2)
}

if (updateSnapshots && !confirmSnapshotUpdate) {
  console.error(`
[agentct] Refusing --update-snapshots without human verification.

Only update snapshots if they are genuinely updating styling, and it always has human verification.

1. Show expected / actual / diff in chat.
2. Wait for an explicit human yes.
3. Then re-run:
   pnpm agentct ${component || '<Component>'} --e2e --update-snapshots --confirm
`)
  process.exit(2)
}

if (unitOnly && !e2eOnly) runE2e = false
if (e2eOnly && !unitOnly) runUnit = false

// `core` is a target of its own: unit tests outside any component, so no catalog
// declarations, no CT, and no Vite.
const coreTarget = component === CORE_TARGET && !catalogCommand && !isList && !targetId && !Number.isInteger(targetLine)
if (coreTarget && e2eOnly) {
  console.error('[agentct] core has no component tests; remove --e2e.')
  process.exit(2)
}
if (coreTarget) runE2e = false

let catalog
if (coreTarget) {
  catalog = { components: [], cases: [] }
  unitSelector = grep ? grep : ''
} else try {
  catalog = loadCatalog(libDir)

  if (catalogCommand === 'check') {
    console.log(`[agentct] Case conformity passed: ${catalog.components.length} components, ${catalog.cases.filter(entry => entry.kind === 'ct').length} cases, ${catalog.cases.filter(entry => entry.kind === 'unit').length} unit declarations, ${catalog.cases.reduce((count, entry) => count + entry.rows, 0)} executable rows.`)
    process.exit(0)
  }

  if (catalogCommand === 'list' || catalogCommand === 'search' || isList) {
    const found = searchCases(catalog, catalogQuery, component)
    const output = isJson ? formatCatalogJson(found) : [formatCatalogHuman(found),
      `[agentct] ${found.length} registered cases; catalog conformity passed.`].filter(Boolean).join('\n')
    await writeCatalogOutput(process.stdout, output)
    process.exit(listingExitCode(catalogCommand, found.length))
  }

  if (catalogSelector && !catalogSelector.startsWith('LIB-')) component = catalogSelector
  const caseId = catalogSelector.startsWith('LIB-') ? catalogSelector
    : component.startsWith('LIB-') ? component : targetId?.startsWith('LIB-') ? targetId : ''
  if (caseId) {
    registeredCase = selectCase(catalog, caseId, component.startsWith('LIB-') ? '' : component)
    component = registeredCase.component
    if (grep || targetLine || (targetId && targetId !== caseId)) throw new Error('Catalog case selection cannot be combined with grep or legacy --id/--line targeting.')
    selectedCases = [registeredCase]
  } else if (component && !catalog.components.some(entry => entry.component === component)) {
    throw new Error(`Unknown component ${component}`)
  }

  const requestedKinds = unitOnly && !e2eOnly ? ['unit'] : e2eOnly && !unitOnly ? ['ct'] : null
  const filteredSelection = Boolean(registeredCase || grep || targetId || Number.isInteger(targetLine))

  if (!registeredCase && (targetId || Number.isInteger(targetLine))) {
    if (grep) throw new Error('Cannot combine grep with legacy --id/--line targeting.')
    selectedCases = selectLegacyTarget(catalog.cases, { id: targetId, line: targetLine, component })
  } else if (!registeredCase) {
    const resolved = resolveSelection(catalog, { component, grep, kinds: requestedKinds })
    selectedCases = resolved.cases
  }

  if (registeredCase || targetId || Number.isInteger(targetLine)) {
    const entry = selectedCases[0]
    component = entry.component
    if (entry.kind === 'unit') {
      if (e2eOnly && !unitOnly) throw new Error(`${entry.id} is a unit case; remove --e2e.`)
      runUnit = true
      runE2e = false
      exactVitestTarget = `src/components/${entry.component}/${entry.file}`
    } else {
      if (unitOnly && !e2eOnly) throw new Error(`${entry.id} is a CT case; remove --unit.`)
      runUnit = false
      runE2e = true
    }
    targetId = null
    targetLine = null
  }

  const plan = executionArguments(selectedCases, { filtered: filteredSelection, catalogCases: catalog.cases })
  unitSelector = plan.unitSelector
  ctTargets = plan.ctTargets

  if (selectedCases.length === 0) throw new Error(`${component || 'Catalog'} has no executable cases; use agentct check to inspect internal entries.`)
  if (runUnit && !selectedCases.some(entry => entry.kind === 'unit')) {
    if (unitOnly) throw new Error(`${component || 'Catalog'} has no registered unit evidence.`)
    runUnit = false
    if (!isJson) console.log(`[agentct] ${component || 'Catalog'}: no unit declarations selected; executing its CT evidence.`)
  }
  if (runE2e && !selectedCases.some(entry => entry.kind === 'ct')) {
    if (e2eOnly) throw new Error(`${component || 'Catalog'} has no registered CT evidence.`)
    runE2e = false
    console.log(`[agentct] ${component || 'Catalog'}: no CT declarations selected; executing its unit evidence.`)
  }
} catch (error) {
  console.error(`[agentct] ${error.message}`)
  process.exit(2)
}

const CT_REACT_ALL = ['17', '18', '19']

function parseReactRuntimes(raw) {
  if (!raw) return []
  if (raw === 'all') return [...CT_REACT_ALL]
  const versions = raw.split(',').map((s) => s.trim().replace(/^react/i, '')).filter(Boolean)
  for (const v of versions) {
    if (!CT_REACT_ALL.includes(v)) {
      console.error(`[agentct] Unknown React runtime "${v}". Use 17, 18, 19, or all.`)
      process.exit(2)
    }
  }
  return versions
}

const reactRuntimes = parseReactRuntimes(reactArg)

if (updateSnapshots && reactRuntimes.some((v) => v !== '19')) {
  console.error(`
[agentct] Visual snapshots are React 19 only.

Do not pass --update-snapshots with --react 17, 18, or all.
Update baselines on the default runtime:

   pnpm agentct ${component || '<Component>'} --e2e --update-snapshots --confirm
`)
  process.exit(2)
}

function assertRuntimeInstalled(runtime) {
  const runtimeDir = path.join(playwrightDir, 'runtimes', `react-${runtime}`)
  const pkg = path.join(runtimeDir, 'package.json')
  if (!fs.existsSync(pkg)) {
    console.error(`[agentct] Missing @ct-runtime/react-${runtime} at ${pkg}. Run pnpm install.`)
    process.exit(2)
  }
  const reactPkg = path.join(runtimeDir, 'node_modules', 'react', 'package.json')
  if (!fs.existsSync(reactPkg)) {
    console.error(`[agentct] @ct-runtime/react-${runtime} has no react install at ${reactPkg}. Run pnpm install.`)
    process.exit(2)
  }
}

if (runE2e) {
  const installed = reactRuntimes.length > 0 ? reactRuntimes : ['19']
  for (const runtime of installed) {
    assertRuntimeInstalled(runtime)
  }
}

if (!IS_INNER) {
  try {
    const delegated = await delegateToDaemon(process.argv.slice(2))
    if (delegated !== null) process.exit(delegated)
  } catch (error) {
    console.error(`[agentct] ${error.message}`)
    process.exit(2)
  }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

// Bounded listener inspection. Returns { known, pids }: `known:false` means the
// port could not be inspected (missing `lsof`, permission error, timeout, or
// any other failure) and must never be read as "no listener". A normal `lsof`
// exit 1 with no stdout/stderr is a real empty result and is `known:true`.
function getPidsOnPort(port) {
  try {
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, {
      encoding: 'utf-8',
      timeout: INSPECT_TIMEOUT_MS,
      maxBuffer: INSPECT_MAX_BUFFER,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
    if (!out) return { known: true, pids: [] }
    const pids = out.split(/\s+/).map((p) => parseInt(p, 10)).filter((p) => Number.isInteger(p) && p > 0)
    return { known: true, pids }
  } catch (error) {
    const empty =
      error?.status === 1 &&
      !String(error.stdout || '').trim() &&
      !String(error.stderr || '').trim()
    if (empty) return { known: true, pids: [] }
    return { known: false, pids: [] }
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

// Bounded POSIX process inventory: pid -> { ppid, pgid }. Returns null where the
// platform or `ps` is unavailable, so callers can degrade without guessing.
function readProcessInventory() {
  if (process.platform === 'win32') return null
  try {
    const out = execSync('ps -A -o pid=,ppid=,pgid=', {
      encoding: 'utf-8',
      timeout: INSPECT_TIMEOUT_MS,
      maxBuffer: INSPECT_MAX_BUFFER,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const inventory = new Map()
    for (const line of out.split('\n')) {
      const parts = line.trim().split(/\s+/)
      if (parts.length < 3) continue
      const pid = Number(parts[0])
      const ppid = Number(parts[1])
      const pgid = Number(parts[2])
      if (!Number.isInteger(pid) || pid <= 0) continue
      inventory.set(pid, {
        pid,
        ppid: Number.isInteger(ppid) ? ppid : 0,
        pgid: Number.isInteger(pgid) ? pgid : 0,
      })
    }
    return inventory
  } catch {
    return null
  }
}

// Thin wrapper: read the process inventory, then delegate the pure ownership
// selection to resources.mjs. Only groups led by a pid observed inside the
// root's own subtree survive, so an ancestor (supervisor/terminal) or a merely
// port-associated group can never be signaled. Callers that must not signal the
// root's own group (a foreground daemon may share the supervisor's terminal
// group) pass includeRootGroup: false.
function collectOwnedGroups(rootPid, options) {
  if (process.platform === 'win32' || !rootPid || rootPid <= 0) return new Set()
  return selectOwnedGroups(readProcessInventory(), rootPid, options)
}

function signalOwnedGroups(groups, signal) {
  if (!groups || process.platform === 'win32') return
  for (const pgid of groups) {
    if (!Number.isInteger(pgid) || pgid <= 0) continue
    try { process.kill(-pgid, signal) } catch {}
  }
}

// Only ESRCH positively means a process group is gone. EPERM or any unknown
// error means it may still exist and must be treated as alive so a group is
// never reported stopped while it survives.
function isGroupAlive(pgid) {
  try {
    process.kill(-pgid, 0)
    return true
  } catch (error) {
    return error.code !== 'ESRCH'
  }
}

async function waitForOwnedGroups(groups, timeoutMs) {
  if (!groups || groups.size === 0 || process.platform === 'win32') return true
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    let alive = false
    for (const pgid of groups) {
      if (isGroupAlive(pgid)) { alive = true; break }
    }
    if (!alive) return true
    await sleep(50)
  }
  return false
}

// Escalate an owned group set to SIGKILL and hold until every group is gone.
// Resolves true only once the groups are positively stopped: a set that survives
// the first bounded wait is polled with async delays (never a blocking spin),
// a single diagnostic is emitted, and the caller can retain its slot instead of
// claiming a stop that has not happened.
async function waitUntilStopped(groups, { label = '' } = {}) {
  if (!groups || groups.size === 0 || process.platform === 'win32') return true
  signalOwnedGroups(groups, 'SIGKILL')
  let stopped = await waitForOwnedGroups(groups, 1500)
  if (!stopped) {
    console.error(`[agentct] Owned process groups survived SIGKILL${label ? ` (${label})` : ''}; holding until they exit.`)
    do {
      // Keep polling with async delays; never block the event loop.
      stopped = await waitForOwnedGroups(groups, 2000)
    } while (!stopped)
  }
  return true
}

function waitForOwnedGroupsSync(groups, timeoutMs) {
  if (!groups || groups.size === 0 || process.platform === 'win32') return true
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    let alive = false
    for (const pgid of groups) {
      if (isGroupAlive(pgid)) { alive = true; break }
    }
    if (!alive) return true
    sleepSync(50)
  }
  return false
}

// Fail-closed port ownership: true only when the listener set and inventory are
// both inspectable and every listener pid belongs to a supplied owned group.
// An empty, unknown, or partially inspected result is false, so a missing
// `lsof`/`ps` can never be mistaken for the spawned Vite holding the port.
function portOwnedByProcessGroups(port, groups) {
  const inspected = getPidsOnPort(port)
  if (!inspected.known) return false
  return isListenerOwnedByGroups(inspected.pids, readProcessInventory(), groups)
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
  if (DAEMON_OWNS_VITE) return
  if (!ctGalleryOwned) return
  signalOwnedGroups(ownedGalleryGroups, 'SIGKILL')
  waitForOwnedGroupsSync(ownedGalleryGroups, 1500)
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


let interrupted = false

function spawnPnpmDetached(pnpmArgs, { cwd, extraEnv = {} } = {}) {
  return new Promise((resolve) => {
    // Never spawn a verification child once the run is interrupted; report a
    // failed, non-spawning result so the caller unwinds through cleanup.
    if (interrupted) {
      resolve({ status: 1, ownedGroups: new Set() })
      return
    }
    const child = spawn(pnpmCmd, pnpmArgs, {
      cwd,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
        ...extraEnv,
      },
      stdio: isJson ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      // Direct runners own a detached group for their tests. Inner runners are
      // already their own group leader; their tests inherit that daemon-owned
      // group so a single group signal reaches the whole job.
      detached: process.platform !== 'win32' && !IS_INNER,
    })

    if (child.pid) activeChildPids.add(child.pid)
    // Consume piped output so a noisy JSON-mode child cannot block on a full
    // pipe; nothing is forwarded into the machine-readable stdout verdict.
    if (isJson) {
      child.stdout?.resume()
      child.stderr?.resume()
    }

    const ownedGroups = new Set()
    if (child.pid && process.platform !== 'win32' && !IS_INNER) ownedGroups.add(child.pid)

    // Watch the group we actually own: our own group for an inner runner (the
    // daemon's job group), the detached child group for a direct runner.
    const parentDeathWatch = startParentDeathWatch(IS_INNER ? process.pid : child.pid)
    let settled = false
    let killTimer = null
    let captureTimer = null
    let spawnError = null

    const captureDescendants = () => {
      if (process.platform === 'win32' || !child.pid) return
      for (const pgid of collectOwnedGroups(child.pid)) ownedGroups.add(pgid)
    }

    const killTree = (sig = 'SIGTERM') => {
      if (IS_INNER) {
        // The daemon group-signals this job; re-signaling our own group would
        // recurse into this handler, so forward only to the direct child.
        try { child.kill(sig) } catch {}
        return
      }
      captureDescendants()
      if (child.pid) killProcessGroup(child.pid, sig)
      try { child.kill(sig) } catch {}
    }

    const finish = async (status) => {
      if (settled) return
      settled = true
      if (killTimer) clearTimeout(killTimer)
      if (captureTimer) clearInterval(captureTimer)
      if (interrupted) {
        killTree('SIGKILL')
        signalOwnedGroups(ownedGroups, 'SIGKILL')
      }
      // Hold active tracking, parent-death watch, and the pid until any retained
      // owned detached descendants are positively stopped, so the caller cannot
      // release its execution slot before descendants stop. Inner runners carry
      // an empty owned set and return immediately (never self-signal).
      await waitUntilStopped(ownedGroups, { label: 'direct run' })
      if (killTimer) {
        clearTimeout(killTimer)
        killTimer = null
      }
      stopParentDeathWatch(parentDeathWatch)
      if (child.pid) activeChildPids.delete(child.pid)
      process.off('SIGINT', onSig)
      process.off('SIGTERM', onSig)
      process.off('SIGHUP', onSig)
      resolve({ status: typeof status === 'number' ? status : 1, ownedGroups })
    }

    const onSig = () => {
      interrupted = true
      if (killTimer) return
      killTree('SIGTERM')
      killTimer = setTimeout(() => {
        killTree('SIGKILL')
        signalOwnedGroups(ownedGroups, 'SIGKILL')
        activeSlotPort = null
      }, 400)
    }

    process.on('SIGINT', onSig)
    process.on('SIGTERM', onSig)
    process.on('SIGHUP', onSig)

    // Best-effort capture of detached descendants (Playwright webServer/browser
    // leaders) while the job is alive; after the leader dies they cannot be found.
    if (!IS_INNER && process.platform !== 'win32' && child.pid) {
      captureDescendants()
      captureTimer = setInterval(captureDescendants, 1000)
      captureTimer.unref?.()
    }

    // Settle once on close: it follows both exit and a failed spawn, and it
    // guarantees stdio descendants have stopped before tracking is released.
    child.on('close', (code) => finish(spawnError ? (numericExitCode(code) || 1) : (code ?? 1)))
    child.on('error', (err) => {
      // A failed spawn still emits 'close' afterwards, which drains stdio before
      // tracking is released; settle only on close, never on the error event.
      spawnError = err
    })
  })
}

process.on('exit', () => {
  cleanupCtGallery()
})

const onInterruptBetweenChildren = () => {
  // Do not exit here: a hard exit between children bypasses async lease release
  // and owned-group cleanup. Mark the run interrupted and let the main flow
  // unwind, stop children, then release explicitly.
  interrupted = true
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, onInterruptBetweenChildren)

// `acquireCpuGate` releases on signal by default; this runner must keep the gate
// held until its children have actually stopped. `acquireCpuGateHoldingSignals`
// (hoisted above) drops only the listeners that acquisition added while
// retaining the module's own `exit` fallback. The shared cpu-gate module is
// untouched, and the same wrapper is used by daemon startJob.
const releaseQueueSlot = IS_INNER && process.env.AGENTCT_JOB_SLOT_HELD === '1'
  ? async () => {}
  : (await acquireQueueLock({ cmd: 'agentct', component: component || 'all' }, { isCanceled: () => interrupted })).release
const releaseCpuSlot = IS_INNER ? async () => {} : await acquireCpuGateHoldingSignals('ct', component || 'all')
// Contact sheets run after the slot is released, so release must be callable twice.
let slotsReleased = false
const releaseSlots = async () => {
  if (slotsReleased) return
  slotsReleased = true
  await releaseCpuSlot()
  await releaseQueueSlot()
}

// A cancellation while acquiring the leases must release without spawning.
if (interrupted) {
  await releaseSlots()
  process.exit(130)
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
  const vitestArgs = ['exec', 'vitest', 'run', '--maxWorkers', String(WORKERS_PER_SLOT), '--reporter=default', '--reporter=json', '--outputFile', vitestJsonPath]
  if (coreTarget) {
    vitestArgs.push(...CORE_UNIT_PATHS)
  } else if (exactVitestTarget) {
    vitestArgs.push(exactVitestTarget)
  } else if (component) {
    vitestArgs.push(unitDirectory(component))
  }
  if (unitSelector) {
    vitestArgs.push('-t', unitSelector)
  }

  if (!isJson) {
    console.log('\n=======================================================')
    console.log(` Unit (Vitest): ${component || 'All'} `)
    console.log('=======================================================')
  }

  const child = await spawnPnpmDetached(vitestArgs, { cwd: libDir })
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
              fullTitle: t.fullName || [...(t.ancestorTitles || []), t.title].join(' '),
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

  const unitErrors = unitResult.error ? [unitResult.error] : []
  if (!fs.existsSync(vitestJsonPath)) unitErrors.push('Unit execution did not produce a readable result report.')
  unitErrors.push(...evidenceErrors(unitResult.tests, selectedCases.filter(entry => entry.kind === 'unit')))
  if (unitErrors.length) {
    unitResult.ok = false
    unitResult.error = unitErrors.join('\n')
    console.error(`[agentct] Incomplete unit evidence:\n${unitResult.error}`)
  }

  if (!unitResult.ok && !isJson) {
    console.log('\n✖ Unit tests failed. Continuing to e2e unless --unit was passed.')
  }
}

const e2eRuns = []
let e2eChildStatus = 0
let e2eRan = false

function extractTests(suite, react, parents = []) {
  if (!suite) return
  const titles = suite.title && !suite.title.endsWith('.ct.spec.ts') ? [...parents, suite.title] : parents
  if (suite.specs) {
    for (const spec of suite.specs) {
      for (const t of spec.tests || []) {
        for (const result of t.results || []) {
          let videoPath = null
          let screenshotPath = null
          let tracePath = null
          let snapshotExpected = null
          let snapshotActual = null
          let snapshotDiff = null

          for (const attachment of result.attachments || []) {
            const resolved = resolveAttachmentPath(attachment)
            if (!resolved) continue
            const name = (attachment.name || '').toLowerCase()
            if (name === 'video' || attachment.contentType?.includes('video')) {
              videoPath = resolved
            } else if (name === 'trace' || /trace\.zip$/i.test(resolved)) {
              tracePath = resolved
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
                if (!tracePath) {
                  const tr = files.find((f) => /^trace\.zip$/i.test(f))
                  if (tr) tracePath = path.join(fullDir, tr)
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
            fullTitle: [...titles, spec.title].join(' '),
            file: spec.file,
            react,
            status: result.status,
            durationMs: result.duration,
            videoPath,
            screenshotPath,
            tracePath,
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
    extractTests(childSuite, react, titles)
  }
}

async function runE2eSuites() {
  if (!runE2e) return

  const e2eTargets = reactRuntimes.length > 0 ? reactRuntimes : [null]
  ctGalleryOwned = !DAEMON_OWNS_VITE
  const workerCount = workerBudget(process.env.CT_WORKERS)

  // Direct fallback owns its own gallery. Now that the shared execution lock is
  // held, refuse to take over an existing listener instead of killing it — and
  // refuse just as hard when the port cannot be inspected, never assuming an
  // unknown inspection means the port is free.
  if (ctGalleryOwned) {
    const inspection = getPidsOnPort(CT_PORT)
    if (!inspection.known) {
      e2eRan = true
      e2eChildStatus = 1
      console.error(`[agentct] CT port ${CT_PORT} availability could not be inspected; refusing to start direct CT. Run 'pnpm agentct stop' or free the port.`)
      return
    }
    if (inspection.pids.length > 0) {
      e2eRan = true
      e2eChildStatus = 1
      console.error(`[agentct] CT port ${CT_PORT} is already owned by PID ${inspection.pids.join(', ')}; refusing to take over another owner's Vite. Run 'pnpm agentct stop' or free the port.`)
      return
    }
  }

  for (const runtime of e2eTargets) {
    if (interrupted) break

    const pwArgs = ['exec', 'playwright', 'test', '-c', configPath, '--workers', String(workerCount)]
    pwArgs.push(...ctTargets)
    if (isHeaded) {
      pwArgs.push('--headed')
    }
    if (updateSnapshots) {
      pwArgs.push('--update-snapshots')
    } else {
      pwArgs.push('--update-snapshots=none')
    }

    const label = runtime ? `react${runtime}` : 'react19'
    const runtimeResultsPath = path.join(resultsDir, `results-${component || 'all'}-${label}-${process.pid}.json`)
    const runtimeOutputDir = artifactsDirectory(playwrightDir, process.pid, label)
    pwArgs.push('--output', runtimeOutputDir, '--reporter', `json,list,${path.join(playwrightDir, 'snapshot-telemetry-reporter.ts')}`)

    if (!isJson) {
      console.log('\n=======================================================')
      console.log(` E2E (Playwright CT): ${component || 'All'} [${label}] `)
      console.log(` Workers: ${workerCount}  |  Vite: :${CT_PORT}${DAEMON_OWNS_VITE ? ' (daemon)' : ''}`)
      if (runtime && runtime !== '19') {
        console.log(' Visual snapshots: skipped (React 19 only)')
      }
      console.log('=======================================================')
    }

    const executePin = async () => {
      if (ctGalleryOwned) activeSlotPort = CT_PORT

      const extraEnv = {
        PLAYWRIGHT_JSON_OUTPUT_NAME: runtimeResultsPath,
        CT_PORT: String(CT_PORT),
        CT_WORKERS: String(workerCount),
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

      if (ctGalleryOwned) {
        for (const pgid of child.ownedGroups || []) ownedGalleryGroups.add(pgid)
        // Hold the execution slot until the gallery's owned groups are
        // positively stopped, not merely signaled.
        await waitUntilStopped(child.ownedGroups, { label: `${component || 'all'} ${label} gallery` })
        activeSlotPort = null
      }
    }

    await executePin()

    let parsedResults = null
    if (fs.existsSync(runtimeResultsPath)) {
      try {
        parsedResults = JSON.parse(fs.readFileSync(runtimeResultsPath, 'utf-8'))
      } catch (err) {
        if (!isJson) {
          console.warn(`[agentct] Warning: Could not parse results.json: ${err.message}`)
        }
      }
    }

    if (parsedResults?.suites) {
      for (const s of parsedResults.suites) {
        extractTests(s, label)
      }
    }
    const reportErrors = parsedResults?.suites ? [] : ['CT execution did not produce a readable result report.']
    reportErrors.push(...evidenceErrors(e2eRuns, selectedCases.filter(entry => entry.kind === 'ct'), { runtime: label }))
    if (reportErrors.length) {
      e2eChildStatus = 1
      console.error(`[agentct] Incomplete CT evidence [${label}]:\n${reportErrors.join('\n')}`)
    }
  }
}

await runE2eSuites()

// Turn recordings into stills contact sheets that text/PNG-only agents can
// inspect. By default only failed tests get one (a passing test needs no
// stills), and `--all-sheets` builds every video's. The sheets show only the
// frames where the picture changed, but a recording that never changes still gets
// a bannered sheet and a loud warning. The test slot is released first: sheet
// building is a lone Chromium, not a test, so it must not block the next job
// (inside the daemon the daemon owns the slot, so this is a no-op there).
// Failure is loud but never changes the test verdict, and warnings go to stderr
// so `--json` stdout stays one parseable value.
await releaseSlots()
const sheetRuns = runsNeedingSheets(e2eRuns, { all: allSheets })
if (sheetRuns.length > 0) {
  const sheetsStartedAt = Date.now()
  console.error(`[agentct] Building ${sheetRuns.length} contact sheet${sheetRuns.length === 1 ? '' : 's'}${allSheets ? '' : ' (failed tests only; --all-sheets builds every video)'}.`)
  try {
    const sheets = await writeVideoContactSheets(sheetRuns.map((entry) => entry.videoPath))
    const sheetByVideo = new Map(sheets.map((sheet) => [path.resolve(sheet.videoPath), sheet]))
    for (const entry of sheetRuns) {
      const sheet = sheetByVideo.get(path.resolve(entry.videoPath)) || null
      entry.framesPath = sheet?.framesPath || null
      entry.noChange = Boolean(sheet?.noChange)
      if (entry.noChange) {
        console.warn(`[agentct] ⚠ Contact sheet for "${entry.fullTitle || entry.title}" shows no change from the first frame — the recording may be blank: ${entry.videoPath}`)
      }
    }
  } catch (err) {
    for (const entry of sheetRuns) {
      console.warn(`[agentct] ⚠ Contact sheet failed for ${entry.videoPath}: ${err.message}`)
    }
  }
  console.error(`[agentct] Contact sheets done in ${((Date.now() - sheetsStartedAt) / 1000).toFixed(1)} s.`)
}

const e2ePassed = e2eRuns.filter((t) => t.status === 'passed').length
const e2eFailed = e2eRuns.filter((t) => t.status === 'failed' || t.status === 'timedOut').length
const e2eOk = !e2eRan || (!interrupted && e2eChildStatus === 0 && e2eFailed === 0)
const ok = unitResult.ok && e2eOk

if (isJson) {
  await writeCatalogOutput(process.stdout,
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
        if (t.framesPath) {
          console.log(`  🎞  Frames:     ${t.framesPath}`)
        }
        if (t.screenshotPath) {
          console.log(`  📸 Screenshot: ${t.screenshotPath}`)
        }
        if ((t.status === 'failed' || t.status === 'timedOut') && t.tracePath) {
          console.log(`  🧭 Trace:      ${t.tracePath}`)
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
        console.log(`Unit: ${unitResult.ok ? 'passed' : 'failed'} | ${unitResult.passed} passed | ${unitResult.failed} failed | ${unitResult.total - unitResult.passed - unitResult.failed} skipped/excluded (workspace React 19)`)
      }
      console.log('-------------------------------------------------------')

      if (e2eRuns.some((t) => t.framesPath)) {
        console.log('\n💡 Agents: open each `frames.png` — the stills are the moments the picture changed, labelled with their timestamps. A red banner means no frame change was detected. Failed tests get one by default; pass --all-sheets for passing tests too.')
        console.log('   For a failed test, read its trace with `npx playwright trace open <trace.zip>` then `actions` / `errors` / `console` / `screenshot <action-id>`.')
      }
      if (e2eRuns.some((t) => t.react && t.react !== 'react19')) {
        console.log('💡 Visual snapshots are skipped on React 17/18. Compare paint drift on React 19.')
      }
      if (e2eRuns.some((t) => t.snapshotDiff)) {
        console.log('💡 Agents: `view_file` snapshot diff/actual/expected. Terminal telemetry above includes bbox + dominant color. Do not update baselines yet.')
        console.log('   Only update snapshots if they are genuinely updating styling, and it always has human verification.')
        console.log('   After an explicit human yes: pnpm agentct <Component> --e2e --update-snapshots --confirm')
      }
    }
  } else if (unitResult.ran) {
    console.log('\n-------------------------------------------------------')
    console.log(`Unit: ${unitResult.ok ? 'passed' : 'failed'} | ${unitResult.passed} passed | ${unitResult.failed} failed | ${unitResult.total - unitResult.passed - unitResult.failed} skipped/excluded`)
    console.log('-------------------------------------------------------')
  }
}

if (interrupted) process.exit(130)
if (!ok) process.exit(1)
process.exit(0)
