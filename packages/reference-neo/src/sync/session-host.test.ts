// Unit tests for the session lock on a generated folder shared between machines,
// over temp dirs and a real stand-in process that logs every stop or poke signal
// it gets. They take owner documents that name another host and assert the
// newcomer fails with the shared-filesystem message and the holder is never
// signalled: whatever kinds sit on either side, and whatever the pid looks like
// here (a live process, a pid nothing runs, this very process). --break-lock
// still takes the lock, and an owner that ran on this host is judged as before.

import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { hostname, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { foreignHostOf, probeProcess } from './session-identity.ts'
import { SyncCoveredByWatchError, getSyncLockDir, getSyncOwnerPath, getSyncPreemptPath, parseSyncSessionOwner, type SyncSessionKind } from './session-owner.ts'
import { acquireSyncSession } from './session.ts'

const POSIX = process.platform !== 'win32'
const FOREIGN_HOST = 'build-box-7.example.invalid'
const STOP_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const

// Logs the signals a kill, a poke or an attach would send, and survives them all.
const STAND_IN_HOLDER = `
const { appendFileSync } = require('node:fs')
for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGUSR2']) process.on(signal, () => appendFileSync(process.argv[1], signal + '\\n'))
console.log('ready')
setInterval(() => {}, 1000)
`

const tempDirs: string[] = []
const children: ChildProcess[] = []

function killed(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve) => {
    child.once('exit', () => resolve())
    child.kill('SIGKILL')
  })
}

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(children.splice(0).map(killed))
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 20 })
})

interface Holder {
  pid: number
  /** The signals the stand-in has received so far, in order. */
  signals(): string[]
  running(): boolean
}

async function makeProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-host-'))
  tempDirs.push(dir)
  return dir
}

async function startHolder(dir: string): Promise<Holder> {
  const log = join(dir, 'signals.log')
  const child = spawn(process.execPath, ['-e', STAND_IN_HOLDER, log], { stdio: ['ignore', 'pipe', 'inherit'] })
  if (child.pid === undefined) throw new Error('the stand-in holder did not spawn')
  children.push(child)
  await new Promise<void>((resolve, reject) => {
    child.once('exit', (code) => reject(new Error(`the stand-in holder exited early (${code})`)))
    child.stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString('utf8').includes('ready')) resolve()
    })
  })
  const signals = (): string[] => (existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean) : [])
  return { pid: child.pid, signals, running: () => child.exitCode === null && child.signalCode === null }
}

// The owner document a sync on another machine would have left: a live pid here
// is a coincidence of numbers, and carrying the process's real start time makes
// the host the only thing between that pid and a signal.
function plantOwner(dir: string, overrides: Record<string, unknown>): { ownerPath: string; planted: string } {
  const lockDir = getSyncLockDir(dir)
  mkdirSync(lockDir, { recursive: true })
  const ownerPath = getSyncOwnerPath(lockDir)
  const doc = { pid: process.pid, lockNonce: 'held-elsewhere', kind: 'one-shot', argv: ['ref', 'sync'], startedAt: 'then', host: FOREIGN_HOST, ...overrides }
  const planted = JSON.stringify(doc)
  writeFileSync(ownerPath, planted)
  return { ownerPath, planted }
}

// The start time a process on the other machine recorded: nothing here runs under it.
const OTHER_MACHINE_START = 'Thu Jan  1 00:00:00 1970'

const stopListenerCounts = (): number[] => STOP_SIGNALS.map((signal) => process.listenerCount(signal))

async function failureOf(dir: string, kind: SyncSessionKind): Promise<unknown> {
  return acquireSyncSession({ cwd: dir, kind }).then(
    () => undefined,
    (error: unknown) => error,
  )
}

function sharedFolderMessage(kind: SyncSessionKind, pid: number): string {
  const tag = kind === 'clean' ? 'clean' : 'sync'
  const way = kind === 'clean' ? 'take the lock first with `ref sync --break-lock`' : 'rerun with --break-lock'
  return `[ref] ${tag}: the lock is held by pid ${pid} on host ${FOREIGN_HOST}; the generated folder is on a shared filesystem. Stop that sync, or ${way}`
}

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
const SIGNAL_SETTLE_MS = 250

describe.skipIf(!POSIX)('a lock held by a process on another host', () => {
  it('control: the stand-in logs the signals it is sent', async () => {
    const dir = await makeProject()
    const holder = await startHolder(dir)
    process.kill(holder.pid, 'SIGUSR2')
    const deadline = Date.now() + 5000
    while (holder.signals().length === 0 && Date.now() < deadline) await wait(10)
    expect(holder.signals()).toEqual(['SIGUSR2'])
    expect(holder.running()).toBe(true)
  })

  it.each([
    ['one-shot', 'one-shot'],
    ['one-shot', 'watch'],
    ['watch', 'one-shot'],
    ['watch', 'watch'],
    ['clean', 'one-shot'],
    ['clean', 'watch'],
  ] as const)('a %s newcomer meets a %s on another host: it fails naming the pid and host, and the holder gets no signal', async (newcomer, held) => {
    const dir = await makeProject()
    const holder = await startHolder(dir)
    const { ownerPath, planted } = plantOwner(dir, { pid: holder.pid, kind: held, identity: OTHER_MACHINE_START })
    const before = stopListenerCounts()

    const error = await failureOf(dir, newcomer)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(SyncCoveredByWatchError)
    expect((error as Error).message).toBe(sharedFolderMessage(newcomer, holder.pid))
    await wait(SIGNAL_SETTLE_MS)
    expect(holder.signals()).toEqual([])
    expect(holder.running()).toBe(true)
    expect(readFileSync(ownerPath, 'utf8')).toBe(planted)
    expect(existsSync(getSyncPreemptPath(getSyncLockDir(dir)))).toBe(false)
    expect(stopListenerCounts()).toEqual(before)
  })

})

describe.skipIf(!POSIX)('a lock held on another host: whatever its pid looks like here, and --break-lock', () => {
  it('never takes an owner on another host for this process, even when the pid number is ours', async () => {
    const dir = await makeProject()
    const { ownerPath, planted } = plantOwner(dir, { pid: process.pid })
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const error = await failureOf(dir, 'one-shot')

    expect((error as Error).message).toBe(sharedFolderMessage('one-shot', process.pid))
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('stale lock'))
    expect(readFileSync(ownerPath, 'utf8')).toBe(planted)
  })

  it('never takes an owner on another host as stale, even when no process here has its pid', async () => {
    const dir = await makeProject()
    const { ownerPath, planted } = plantOwner(dir, { pid: 2 ** 30 })
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const error = await failureOf(dir, 'one-shot')

    expect((error as Error).message).toBe(sharedFolderMessage('one-shot', 2 ** 30))
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('stale lock'))
    expect(readFileSync(ownerPath, 'utf8')).toBe(planted)
  })

  it('--break-lock takes it unconditionally, names the host, and signals nobody', async () => {
    const dir = await makeProject()
    const holder = await startHolder(dir)
    const { ownerPath } = plantOwner(dir, { pid: holder.pid, kind: 'watch', identity: OTHER_MACHINE_START })
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const session = await acquireSyncSession({ cwd: dir, kind: 'one-shot', breakLock: true })
    try {
      expect(session.owner.pid).toBe(process.pid)
      expect(JSON.parse(readFileSync(ownerPath, 'utf8'))).toMatchObject({ lockNonce: session.owner.lockNonce, host: hostname() })
      expect(log).toHaveBeenCalledWith(`[ref] sync: --break-lock: taking over lock held by pid ${holder.pid} on host ${FOREIGN_HOST}`)
      await wait(SIGNAL_SETTLE_MS)
      expect(holder.signals()).toEqual([])
      expect(holder.running()).toBe(true)
    } finally {
      session.release()
    }
    expect(existsSync(getSyncLockDir(dir))).toBe(false)
  })
})

describe('the host an owner records', () => {
  it('records this machine in the owner document of a held session', async () => {
    const dir = await makeProject()
    const session = await acquireSyncSession({ cwd: dir, kind: 'one-shot' })
    try {
      expect(session.owner.host).toBe(hostname())
      expect(JSON.parse(readFileSync(getSyncOwnerPath(getSyncLockDir(dir)), 'utf8'))).toMatchObject({ host: hostname() })
    } finally {
      session.release()
    }
  })

  it('reads a host back as optional: kept when a non-empty string, dropped otherwise', () => {
    const doc = { pid: process.pid, lockNonce: 'n', kind: 'one-shot', argv: [], startedAt: '' }
    expect(parseSyncSessionOwner({ ...doc, host: FOREIGN_HOST })?.host).toBe(FOREIGN_HOST)
    for (const bad of [undefined, '', 7, null, ['x']]) expect(parseSyncSessionOwner({ ...doc, host: bad })?.host).toBeUndefined()
    expect(parseSyncSessionOwner(doc)).toEqual(doc)
  })

  it('judges an owner that ran on this host, or recorded none, as it always did: a dead pid is a stale lock', async () => {
    for (const host of [hostname(), undefined]) {
      const dir = await makeProject()
      plantOwner(dir, { pid: 2 ** 30, host })
      const log = vi.spyOn(console, 'log').mockImplementation(() => {})
      const session = await acquireSyncSession({ cwd: dir, kind: 'one-shot' })
      try {
        expect(log).toHaveBeenCalledWith('[ref] sync: stale lock (pid 1073741824 not running), taking over')
      } finally {
        session.release()
        log.mockRestore()
      }
    }
  })
})

describe.skipIf(process.platform === 'win32')('a host renamed under a running holder', () => {
  it('reads a holder whose pid runs here under its recorded identity as here, whatever host it recorded', () => {
    const probe = probeProcess(process.pid)
    if (probe.status !== 'live') return
    expect(foreignHostOf({ pid: process.pid, host: FOREIGN_HOST, identity: probe.identity })).toBeUndefined()
    expect(foreignHostOf({ pid: process.pid, host: FOREIGN_HOST, identity: OTHER_MACHINE_START })).toBe(FOREIGN_HOST)
    expect(foreignHostOf({ pid: process.pid, host: FOREIGN_HOST })).toBe(FOREIGN_HOST)
  })
})
