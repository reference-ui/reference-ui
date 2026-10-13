// Unit tests for the covered handshake, one-shot side, against a stand-in
// watch: a child process that holds a real watch lock and speaks the
// watch-state protocol in a chosen mood (answers after a delay, fails, never
// finishes, goes quiet, keeps no state, is stopping). They take that child's
// lock dir and assert the outcome awaitWatchCoverage reaches and when it
// reaches it, the notice lines it prints, and what awaitWatchRelease waits on.
// The real watch driver is proven in the watch cases, not here.

import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { awaitWatchCoverage, awaitWatchRelease } from './session-covered.ts'
import { SyncCoveredByWatchError, getSyncLockDir, readOwnerFile, type SyncSessionOwner } from './session-owner.ts'
import { acquireSyncSession } from './session.ts'

const POSIX = process.platform !== 'win32'
const SESSION_URL = new URL('./session.ts', import.meta.url).href
const OWNER_URL = new URL('./session-owner.ts', import.meta.url).href

// The stand-in: acquires a real watch lock, attaches the poke listener, then
// publishes the first state (the order the real watch keeps). On each SIGUSR2 it
// takes the request, publishes, and runs a simulated resync of `ms` milliseconds
// that ends by publishing `done`. Moods: healthy, failing, stuck (acks, never
// finishes), silent (a SIGUSR1 sends its loop into a busy spell of `ms`, so a
// poke is not acked until it ends), unpublished (listens, keeps no state file),
// stopping (publishes stopping before any poke).
const STAND_IN = `
import { appendFileSync, writeFileSync } from 'node:fs'
import { acquireSyncSession } from ${JSON.stringify(SESSION_URL)}
import { freshWatchState, getSyncLockDir, writeWatchStateSync } from ${JSON.stringify(OWNER_URL)}
const [cwd, mood, rawMs] = process.argv.slice(2)
const ms = Number(rawMs ?? 0)
const session = await acquireSyncSession({ cwd, kind: 'watch' })
const lockDir = getSyncLockDir(cwd)
const state = freshWatchState(session.owner)
const publish = () => writeWatchStateSync(lockDir, state)
const sleep = (n) => new Promise((resolve) => setTimeout(resolve, n))
const resyncMs = mood === 'silent' ? 50 : ms
let running = false
async function pass() {
  if (running) return
  running = true
  while (state.done < state.requested) {
    const started = state.requested
    if (mood === 'stuck') await new Promise(() => {})
    await sleep(resyncMs)
    state.done = started
    state.failed = mood === 'failing'
    publish()
  }
  running = false
}
process.on('SIGUSR2', () => {
  appendFileSync(cwd + '/pokes.log', Date.now() + '\\n')
  if (mood === 'unpublished') return
  state.requested += 1
  publish()
  void pass()
})
process.on('SIGUSR1', () => {
  writeFileSync(cwd + '/busy.flag', '')
  const until = Date.now() + ms
  while (Date.now() < until) { /* a busy loop: no signal reaches JS meanwhile */ }
})
if (mood === 'stopping') state.stopping = true
if (mood !== 'unpublished') publish()
console.log('ready')
setInterval(() => {}, 1000)
`

const tempDirs: string[] = []
const children: ChildProcess[] = []

// A SIGKILL lands asynchronously: a stand-in still finishing a state write would
// drop a file into its dir mid-remove, so each one is awaited dead first.
function killed(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve) => {
    child.once('exit', () => resolve())
    child.kill('SIGKILL')
  })
}

afterEach(async () => {
  await Promise.all(children.splice(0).map(killed))
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 20 })
})

interface StandIn {
  cwd: string
  lockDir: string
  owner: SyncSessionOwner
  child: ChildProcess & { pid: number }
  pokes(): number
}

async function startStandIn(mood: string, ms = 0): Promise<StandIn> {
  const cwd = mkdtempSync(join(tmpdir(), 'neo-covered-'))
  tempDirs.push(cwd)
  const script = join(cwd, 'stand-in.mjs')
  writeFileSync(script, STAND_IN)
  const child = spawn(process.execPath, [script, cwd, mood, String(ms)], { stdio: ['ignore', 'pipe', 'inherit'] }) as ChildProcess & { pid: number }
  children.push(child)
  await new Promise<void>((resolve, reject) => {
    child.once('exit', (code) => reject(new Error(`the stand-in exited early (${code})`)))
    child.stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString('utf8').includes('ready')) resolve()
    })
  })
  const lockDir = getSyncLockDir(cwd)
  const seen = await readOwnerFile(lockDir)
  if (seen.status !== 'ok') throw new Error('the stand-in holds no lock')
  const pokes = (): number => {
    try {
      return readFileSync(join(cwd, 'pokes.log'), 'utf8').split('\n').filter(Boolean).length
    } catch {
      return 0
    }
  }
  return { cwd, lockDir, owner: seen.owner, child, pokes }
}

function collect(): { lines: string[]; say: (line: string) => void } {
  const lines: string[] = []
  return { lines, say: (line) => lines.push(line) }
}

describe.skipIf(!POSIX)('covered handshake, one-shot side: a watch that answers', () => {
  it('returns current only after the poked resync has finished', async () => {
    const watch = await startStandIn('healthy', 600)
    const notes = collect()
    const started = Date.now()
    expect(await awaitWatchCoverage(watch.lockDir, watch.owner, { say: notes.say })).toBe('current')
    expect(Date.now() - started).toBeGreaterThanOrEqual(550)
    expect(watch.pokes()).toBe(1)
    expect(notes.lines).toEqual([])
  })

  it('returns failed when the covering resync failed', async () => {
    const watch = await startStandIn('failing', 100)
    expect(await awaitWatchCoverage(watch.lockDir, watch.owner, { say: () => {} })).toBe('failed')
  })

  it('lets overlapping one-shots share the resyncs: each returns current, none early', async () => {
    const watch = await startStandIn('healthy', 400)
    const started = Date.now()
    const outcomes = await Promise.all([
      awaitWatchCoverage(watch.lockDir, watch.owner, { say: () => {} }),
      awaitWatchCoverage(watch.lockDir, watch.owner, { say: () => {} }),
      awaitWatchCoverage(watch.lockDir, watch.owner, { say: () => {} }),
    ])
    expect(outcomes).toEqual(['current', 'current', 'current'])
    expect(Date.now() - started).toBeGreaterThanOrEqual(350)
  })

  it('waits out a busy watch that answers late, announcing the wait once', async () => {
    const watch = await startStandIn('silent', 900)
    watch.child.kill('SIGUSR1')
    const busyBy = Date.now() + 5000
    while (!existsSync(join(watch.cwd, 'busy.flag')) && Date.now() < busyBy) await new Promise((resolve) => setTimeout(resolve, 5))
    const notes = collect()
    expect(await awaitWatchCoverage(watch.lockDir, watch.owner, { say: notes.say, answerMs: 300 })).toBe('current')
    expect(notes.lines).toEqual([`[ref] sync: waiting for the resident watch (pid ${watch.owner.pid}) to answer`])
  })

})

describe.skipIf(!POSIX)('covered handshake, one-shot side: a watch that cannot answer', () => {
  it('takes a watch that is already stopping for a retake, without poking it', async () => {
    const watch = await startStandIn('stopping')
    const notes = collect()
    expect(await awaitWatchCoverage(watch.lockDir, watch.owner, { say: notes.say })).toBe('retake')
    expect(watch.pokes()).toBe(0)
    expect(notes.lines).toEqual([`[ref] sync: the resident watch (pid ${watch.owner.pid}) is stopping, waiting to sync`])
  })

  it('pokes a watch that keeps no state file once, then reports unpublished', async () => {
    const watch = await startStandIn('unpublished')
    expect(await awaitWatchCoverage(watch.lockDir, watch.owner, { say: () => {}, answerMs: 200 })).toBe('unpublished')
    const deadline = Date.now() + 2000
    while (watch.pokes() < 1 && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 10))
    expect(watch.pokes()).toBe(1)
  })

  it('reports a suspended watch at once instead of waiting on it', async () => {
    const watch = await startStandIn('healthy', 100)
    watch.child.kill('SIGSTOP')
    await expect(awaitWatchCoverage(watch.lockDir, watch.owner, { say: () => {}, answerMs: 300 })).rejects.toThrow(/is suspended and cannot sync/)
    watch.child.kill('SIGCONT')
  })

  it('gives up on a watch that acks but never finishes, naming how to force the sync', async () => {
    const watch = await startStandIn('stuck')
    await expect(awaitWatchCoverage(watch.lockDir, watch.owner, { say: () => {}, answerMs: 200, budgetMs: 1200 })).rejects.toThrow(
      /did not finish a resync within 1 s; rerun with --break-lock/,
    )
  })

  it('returns retake when the watch dies while the one-shot waits', async () => {
    const watch = await startStandIn('stuck')
    const waiting = awaitWatchCoverage(watch.lockDir, watch.owner, { say: () => {}, answerMs: 5000 })
    await new Promise((resolve) => setTimeout(resolve, 300))
    watch.child.kill('SIGKILL')
    expect(await waiting).toBe('retake')
  })

  it('ignores a state file that names another watch', async () => {
    const watch = await startStandIn('healthy', 100)
    const stranger: SyncSessionOwner = { ...watch.owner, lockNonce: 'someone-else' }
    expect(await awaitWatchCoverage(watch.lockDir, stranger, { say: () => {}, answerMs: 250 })).toBe('unpublished')
  })
})

describe.skipIf(!POSIX)('waiting for a watch to let go of the lock', () => {
  it('returns once the holder is dead', async () => {
    const watch = await startStandIn('healthy', 50)
    const released = awaitWatchRelease(watch.lockDir, watch.owner, 5000)
    await new Promise((resolve) => setTimeout(resolve, 100))
    watch.child.kill('SIGKILL')
    await released
  })

  it('returns once the lock dir is gone, and rejects when a live holder keeps it past the budget', async () => {
    const watch = await startStandIn('healthy', 50)
    await expect(awaitWatchRelease(watch.lockDir, watch.owner, 400)).rejects.toThrow(/did not release the lock/)
    rmSync(watch.lockDir, { recursive: true, force: true })
    await awaitWatchRelease(watch.lockDir, watch.owner, 400)
  })
})

function stopListenerCounts(): number[] {
  return ['SIGINT', 'SIGTERM', 'SIGHUP'].map((signal) => process.listenerCount(signal))
}

describe.skipIf(!POSIX)('acquiring a one-shot session toward a resident watch', () => {
  it('rejects covered only once the watch has resynced, and leaves no handler behind', async () => {
    const watch = await startStandIn('healthy', 500)
    const before = stopListenerCounts()
    const started = Date.now()
    await expect(acquireSyncSession({ cwd: watch.cwd, kind: 'one-shot' })).rejects.toBeInstanceOf(SyncCoveredByWatchError)
    expect(Date.now() - started).toBeGreaterThanOrEqual(450)
    expect(stopListenerCounts()).toEqual(before)
  })

  it("rejects with the watch's failure when the covering resync failed", async () => {
    const watch = await startStandIn('failing', 100)
    await expect(acquireSyncSession({ cwd: watch.cwd, kind: 'one-shot' })).rejects.toThrow("[ref] sync: the resident watch's sync failed")
  })

  it('waits out a stopping watch, then takes the stale lock it leaves and syncs for itself', async () => {
    const watch = await startStandIn('stopping')
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const acquiring = acquireSyncSession({ cwd: watch.cwd, kind: 'one-shot' })
      await new Promise((resolve) => setTimeout(resolve, 300))
      watch.child.kill('SIGKILL')
      const session = await acquiring
      try {
        expect(session.owner.pid).toBe(process.pid)
        expect(watch.pokes()).toBe(0)
        expect(log).toHaveBeenCalledWith(`[ref] sync: the resident watch (pid ${watch.owner.pid}) is stopping, waiting to sync`)
        expect(log).toHaveBeenCalledWith(expect.stringContaining(`stale lock (pid ${watch.owner.pid} not running)`))
      } finally {
        session.release()
      }
    } finally {
      log.mockRestore()
    }
  })
})
