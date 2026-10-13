// Repro suite for the sync session lock: real `ref` child processes over
// temp worlds, never the workspace. It takes spawned one-shots and watches
// and asserts the last-wins contract: kill legs exit the victim 75 with the
// superseded message, the watch poke covers the newcomer 0, a second watch
// attaches to the owner until it stops, stale and torn locks take over with
// warnings, and signals release the lock. A gated config holds a watch
// resync in flight on demand, which proves the graceful-stop legs: the lock
// outlives the in-flight sync, repeat signals are ignored, a newcomer waits
// for the stop and then syncs itself, and SIGHUP stops a watch like SIGINT.
// Signal legs are POSIX-only; stale, torn, and break-lock run everywhere.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ATTACH_LINE_RE,
  BOOT_BLOCK_RE,
  POSIX,
  REBRAND,
  childDone,
  cleanupHarness,
  holdWatchMidResync,
  lockOwnerPid,
  runBin,
  sheetHasBrand,
  sleep,
  spawnBin,
  waitForExit,
  waitForFile,
  waitForOutput,
  waitForStageDrop,
  writeWorld,
  type HeldResync,
  type Spawned,
} from './__fixtures__/session-repro-harness.ts'

afterEach(cleanupHarness)

async function loneOneShotSyncsUnchanged(): Promise<void> {
  const dir = await writeWorld(0)
  const run = await runBin(['sync', dir], dir)
  expect(run.code).toBe(0)
  expect(run.stdout).toMatch(BOOT_BLOCK_RE)
  expect(run.stdout).not.toMatch(/stale lock|supersed|covered by|break-lock/)
  expect(sheetHasBrand(dir)).toBe(true)
  expect(existsSync(join(dir, '.reference-ui', 'sync.lock'))).toBe(false)
}

async function oneShotTowardOneShotKills(): Promise<void> {
  const dir = await writeWorld(400)
  const outDir = join(dir, '.reference-ui')
  const preemptPath = join(outDir, 'sync.lock', 'preempt.json')
  // A stranded stage the holder drops once it holds the lock, so the drop marks
  // a holder that is mid-sync and safe to stop.
  const strandedStage = join(outDir, 'sync.stage')
  mkdirSync(strandedStage, { recursive: true })
  const slow = spawnBin(['sync', dir], dir)
  // Stall the holder mid-sync; the preempt marker later proves B reached
  // the kill leg before the holder is released to die.
  await waitForStageDrop(strandedStage, slow)
  if (childDone(slow.child)) throw new Error('harness lost the race: A finished before the stall')
  slow.child.kill('SIGSTOP')
  await sleep(50)
  if (childDone(slow.child)) throw new Error('harness lost the race: A finished before the stall landed')
  const fast = runBin(['sync', dir], dir)
  await waitForFile(preemptPath, 'the preempt marker')
  slow.child.kill('SIGCONT')
  const [done, newcomer] = [slow, await fast]
  await waitForExit(done, 'the superseded holder')
  if (done.child.exitCode === 0) throw new Error(`harness lost the race: A finished before the kill:\n${done.output()}`)
  expect(done.child.exitCode).toBe(75)
  expect(done.output()).toContain(`superseded by sync pid ${newcomer.pid}`)
  expect(newcomer.code).toBe(0)
  expect(newcomer.stdout).toContain(`superseding sync pid ${done.child.pid}`)
  expect(newcomer.stdout).toMatch(BOOT_BLOCK_RE)
  expect(sheetHasBrand(dir)).toBe(true)
  expect(existsSync(join(dir, '.reference-ui', 'sync.lock'))).toBe(false)
}

async function watchTowardWatchAttaches(): Promise<void> {
  const dir = await writeWorld(0)
  const old = spawnBin(['sync', '--watch', dir], dir)
  await waitForOutput(old, () => old.output().includes('ready in'), 'the old boot block')
  const fresh = spawnBin(['sync', '--watch', dir], dir)
  // The newcomer must defer to the resident watch, never kill it — and it
  // must stay alive (never report early completion) while the owner runs.
  await waitForOutput(fresh, () => ATTACH_LINE_RE.test(fresh.output()), 'the newcomer attach line')
  await sleep(1000)
  expect(childDone(fresh.child)).toBe(false)
  expect(childDone(old.child)).toBe(false)
  expect(fresh.output()).not.toContain('ready in')
  expect(old.output()).not.toContain('superseded')
  const owner = JSON.parse(readFileSync(join(dir, '.reference-ui', 'sync.lock', 'owner.json'), 'utf8')) as { pid: number }
  expect(owner.pid).toBe(old.child.pid)
  old.child.kill('SIGTERM')
  await waitForExit(old, 'the owner')
  await waitForExit(fresh, 'the attached client')
  expect(old.child.exitCode).toBe(0)
  expect(fresh.child.exitCode).toBe(0)
  expect(existsSync(join(dir, '.reference-ui', 'sync.lock'))).toBe(false)
}

// Signals the client inside the very stdout chunk that carries the covered
// line, with no poll in between. The line promises the forwarders are armed,
// so this is the earliest instant anything can act on it: a client that prints
// before arming dies here by default disposition and leaves the owner running.
function signalOnAnnounce(client: Spawned, signal: NodeJS.Signals): void {
  let sent = false
  client.child.stdout?.on('data', () => {
    if (sent || !ATTACH_LINE_RE.test(client.output())) return
    sent = true
    client.child.kill(signal)
  })
}

async function attachedForwardStopsOwner(signal: 'SIGINT' | 'SIGTERM' | 'SIGHUP'): Promise<void> {
  const dir = await writeWorld(0)
  const old = spawnBin(['sync', '--watch', dir], dir)
  await waitForOutput(old, () => old.output().includes('ready in'), 'the old boot block')
  const fresh = spawnBin(['sync', '--watch', dir], dir)
  // The client forwards the signal, the owner stops cleanly, and the client
  // exits on its own once the owner is gone: a client already done with a
  // signal code died without forwarding.
  signalOnAnnounce(fresh, signal)
  await waitForExit(fresh, 'the attached client')
  expect(fresh.child.signalCode, `the client died by signal instead of forwarding:\n${fresh.output()}`).toBeNull()
  await waitForExit(old, 'the owner')
  expect(old.child.exitCode).toBe(0)
  expect(fresh.child.exitCode).toBe(0)
  expect(existsSync(join(dir, '.reference-ui', 'sync.lock'))).toBe(false)
}

// The stopping watch is alive only because its resync is still held, so the
// lock it owns must still be on disk; a newcomer one-shot that meets it must not
// sync alongside the old sync and must not report itself covered, since the
// watch is going away. It says it is waiting, stays alive, and leaves the lock
// with the stopping watch until that watch lets go.
async function expectNewcomerWaitsOnStoppingWatch(held: HeldResync): Promise<Spawned> {
  expect(childDone(held.watch.child)).toBe(false)
  expect(existsSync(held.lockDir), 'the lock must outlive the in-flight resync').toBe(true)
  const newcomer = spawnBin(['sync', held.dir], held.dir)
  const waiting = `the resident watch (pid ${held.watch.child.pid}) is stopping, waiting to sync`
  await waitForOutput(newcomer, () => newcomer.output().includes(waiting), 'the newcomer to wait on the stopping watch')
  expect(newcomer.output()).not.toMatch(ATTACH_LINE_RE)
  expect(newcomer.output()).not.toMatch(BOOT_BLOCK_RE)
  expect(childDone(newcomer.child)).toBe(false)
  expect(lockOwnerPid(held.dir), 'a newcomer must not take the lock off a stopping watch').toBe(held.watch.child.pid)
  return newcomer
}

// Opening the gate lets the held resync finish its commit, then the stop
// completes: exit by code, the lock gone, and the new brand published.
async function expectGracefulFinish(held: HeldResync): Promise<void> {
  held.openGate()
  await waitForExit(held.watch, 'the stopping watch')
  expect(held.watch.child.signalCode, `the watch died by signal mid-sync:\n${held.watch.output()}`).toBeNull()
  expect(held.watch.child.exitCode).toBe(0)
  expect(existsSync(held.lockDir)).toBe(false)
  expect(sheetHasBrand(held.dir, REBRAND), 'the in-flight resync must commit before the watch exits').toBe(true)
}

// Once the stopping watch has let go, the waiting newcomer takes the lock and
// syncs for itself: its own boot block, exit 0, the lock gone again.
async function expectNewcomerSyncsAfterStop(held: HeldResync, newcomer: Spawned): Promise<void> {
  held.openGate()
  await waitForExit(held.watch, 'the stopping watch')
  expect(held.watch.child.signalCode, `the watch died by signal mid-sync:\n${held.watch.output()}`).toBeNull()
  expect(held.watch.child.exitCode).toBe(0)
  await waitForExit(newcomer, 'the waiting newcomer')
  expect(newcomer.child.exitCode, newcomer.output()).toBe(0)
  expect(newcomer.output()).toMatch(BOOT_BLOCK_RE)
  expect(existsSync(held.lockDir)).toBe(false)
  expect(sheetHasBrand(held.dir, REBRAND), 'the in-flight resync must commit before the newcomer syncs').toBe(true)
}

async function repeatSignalsAreIgnored(): Promise<void> {
  const held = await holdWatchMidResync()
  held.watch.child.kill('SIGINT')
  await waitForOutput(held.watch, () => held.watch.output().includes('shutdown SIGINT: stopping'), 'the graceful stop to begin')
  held.watch.child.kill('SIGTERM')
  held.watch.child.kill('SIGHUP')
  const ignored = (signal: string): string => `shutdown ${signal}: already stopping, ignored`
  await waitForOutput(
    held.watch,
    () => held.watch.output().includes(ignored('SIGTERM')) && held.watch.output().includes(ignored('SIGHUP')),
    'both repeat signals to be ignored',
  )
  expect(childDone(held.watch.child)).toBe(false)
  expect(existsSync(held.lockDir), 'a repeat signal must not release the lock').toBe(true)
  await expectGracefulFinish(held)
  expect(held.watch.output().match(/: stopping/g)).toHaveLength(1)
  expect(held.watch.output().match(/shutdown: stopped/g)).toHaveLength(1)
}

describe('sync session lock: control and kill legs', () => {
  it('control: a lone one-shot syncs unchanged with no lock lines', loneOneShotSyncsUnchanged, 120000)

  it.skipIf(!POSIX)('one-shot toward one-shot kills: victim exits 75, newcomer completes', oneShotTowardOneShotKills, 120000)

  it.skipIf(!POSIX)('watch toward watch attaches: the newcomer stays alive on the running session and exits when the owner stops', watchTowardWatchAttaches, 120000)

  it.skipIf(!POSIX).each(['SIGTERM', 'SIGINT', 'SIGHUP'] as const)(
    'attached watch forwards %s: a signal to the newcomer stops the owner cleanly',
    attachedForwardStopsOwner,
    120000,
  )
})

describe('sync session lock: a stopping watch keeps its lock until the in-flight sync settles', () => {
  it.skipIf(!POSIX).each(['SIGINT', 'SIGHUP', 'SIGTERM'] as const)(
    '%s mid-resync: the lock outlives the sync, a newcomer waits for the stop and then syncs itself, exit 0',
    async (signal) => {
      const held = await holdWatchMidResync()
      held.watch.child.kill(signal)
      await waitForOutput(held.watch, () => held.watch.output().includes(`shutdown ${signal}: stopping`), 'the graceful stop to begin')
      const newcomer = await expectNewcomerWaitsOnStoppingWatch(held)
      await expectNewcomerSyncsAfterStop(held, newcomer)
    },
    120000,
  )

  it.skipIf(!POSIX)('a second signal while stopping is ignored: one stop, the lock held to the end, exit 0', repeatSignalsAreIgnored, 120000)
})

describe('sync session lock: cover, takeover, and release legs', () => {
  it('stale lock takes over with a warning and completes', async () => {
    const dir = await writeWorld(0)
    const lockDir = join(dir, '.reference-ui', 'sync.lock')
    mkdirSync(lockDir, { recursive: true })
    writeFileSync(join(lockDir, 'owner.json'), JSON.stringify({ pid: 2 ** 30, lockNonce: 'dead', kind: 'one-shot', argv: [], startedAt: '' }))
    const run = await runBin(['sync', dir], dir)
    expect(run.code).toBe(0)
    expect(run.stdout).toMatch(/stale lock \(pid 1073741824 not running\), taking over/)
    expect(sheetHasBrand(dir)).toBe(true)
    expect(existsSync(lockDir)).toBe(false)
  }, 120000)

  it('malformed lock takes over with a warning and completes', async () => {
    const dir = await writeWorld(0)
    const lockDir = join(dir, '.reference-ui', 'sync.lock')
    mkdirSync(lockDir, { recursive: true })
    writeFileSync(join(lockDir, 'owner.json'), '{torn')
    const run = await runBin(['sync', dir], dir)
    expect(run.code).toBe(0)
    expect(run.stdout).toContain('stale lock (owner unreadable), taking over')
    expect(sheetHasBrand(dir)).toBe(true)
    expect(existsSync(lockDir)).toBe(false)
  }, 120000)

  it.skipIf(!POSIX)('one-shot toward watch pokes: newcomer exits 0 covered, watch rebuilds and lives', async () => {
    const dir = await writeWorld(0)
    const watch = spawnBin(['sync', '--watch', dir], dir)
    await waitForOutput(watch, () => watch.output().includes('ready in'), 'the boot block')
    const resyncs = (): number => watch.output().split('⎔ ref sync').length - 1
    const before = resyncs()
    const run = await runBin(['sync', dir], dir)
    expect(run.code).toBe(0)
    expect(run.stdout).toContain(`already watching this project (pid ${watch.child.pid})`)
    await waitForOutput(watch, () => resyncs() > before, 'the poke resync')
    expect(childDone(watch.child)).toBe(false)
    watch.child.kill('SIGTERM')
    await waitForExit(watch, 'the watch')
    expect(watch.child.exitCode).toBe(0)
    expect(existsSync(join(dir, '.reference-ui', 'sync.lock'))).toBe(false)
  }, 120000)

  it.skipIf(!POSIX).each(['SIGINT', 'SIGHUP'] as const)(
    '%s stops an idle watch by code and releases the lock: the next sync proceeds with no stale warning',
    async (signal) => {
      const dir = await writeWorld(0)
      const watch = spawnBin(['sync', '--watch', dir], dir)
      await waitForOutput(watch, () => watch.output().includes('ready in'), 'the boot block')
      watch.child.kill(signal)
      await waitForExit(watch, 'the watch')
      expect(watch.child.signalCode, `the watch died by signal:\n${watch.output()}`).toBeNull()
      expect(watch.child.exitCode).toBe(0)
      expect(existsSync(join(dir, '.reference-ui', 'sync.lock'))).toBe(false)
      const run = await runBin(['sync', dir], dir)
      expect(run.code).toBe(0)
      expect(run.stdout).not.toMatch(/stale lock/)
      expect(sheetHasBrand(dir)).toBe(true)
    },
    120000,
  )

  it.skipIf(!POSIX)('--break-lock takes a live lock with a warning and the holder survives', async () => {
    const dir = await writeWorld(0)
    const watch = spawnBin(['sync', '--watch', dir], dir)
    await waitForOutput(watch, () => watch.output().includes('ready in'), 'the boot block')
    const run = await runBin(['sync', '--break-lock', dir], dir)
    expect(run.code).toBe(0)
    expect(run.stdout).toContain(`--break-lock: taking over lock held by pid ${watch.child.pid}`)
    expect(sheetHasBrand(dir)).toBe(true)
    expect(childDone(watch.child)).toBe(false)
    watch.child.kill('SIGTERM')
    await waitForExit(watch, 'the watch')
  }, 120000)
})
