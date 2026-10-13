// Repro suite for the sync session lock: real `ref` child processes over
// temp worlds, never the workspace. It takes spawned one-shots and watches
// and asserts the last-wins contract: kill legs exit the victim 75 with the
// superseded message, the watch poke covers the newcomer 0, a second watch
// attaches to the owner until it stops, stale and torn locks take over with
// warnings, and signals release the lock. A gated config holds a watch
// resync in flight on demand, which proves the graceful-stop legs: the lock
// outlives the in-flight sync, repeat signals are ignored, and SIGHUP stops
// a watch like SIGINT. Signal legs are POSIX-only; stale, torn, and
// break-lock run everywhere.

import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const BIN_PATH = fileURLToPath(new URL('../../bin/ref.ts', import.meta.url))
const BOOT_BLOCK_RE = /REF  v\d+\.\d+\.\d+  ready in \d+ ms/
const ATTACH_LINE_RE = /already watching this project/
const BRAND = '#7c3aed'
const REBRAND = '#0e5c3f'
const POSIX = process.platform !== 'win32'
const tempDirs: string[] = []
const liveChildren: ChildProcess[] = []
const gateOpeners: Array<() => void> = []

// Plain text from every child, whatever runs the suite: the test-core runner
// exports FORCE_COLOR=1, which would paint the boot blocks the exact-text
// assertions read. NO_COLOR wins in the CLI; FORCE_COLOR is dropped so Node
// does not warn about the pair on the child's stderr.
const PLAIN_ENV: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: undefined, NO_COLOR: '1' }

// Gates open before the reap, or a watch held at its gate sits out the grace.
afterEach(async () => {
  for (const open of gateOpeners.splice(0)) open()
  await Promise.all(liveChildren.splice(0).map((child) => reap(child)))
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// The gate lives in the config because it is the one module that can await
// (fragments bundle as IIFE). A load in the pid the gate file names marks its
// arrival and waits until the file is removed, so that process stays inside a
// sync holding its lock; any other pid, a newcomer included, loads through.
const gatePath = (dir: string): string => join(dir, 'resync.gate')
const arrivedPath = (dir: string): string => join(dir, 'resync.arrived')

function gateLines(dir: string): string[] {
  return [
    "import { readFileSync, writeFileSync } from 'node:fs'",
    `const GATE = ${JSON.stringify(gatePath(dir))}`,
    `const ARRIVED = ${JSON.stringify(arrivedPath(dir))}`,
    'const gated = (): boolean => {',
    "  try { return readFileSync(GATE, 'utf8') === String(process.pid) } catch { return false }",
    '}',
    "if (gated()) writeFileSync(ARRIVED, '')",
    'while (gated()) await new Promise((resolve) => setTimeout(resolve, 10))',
  ]
}

function configFile(gatedDir?: string): string {
  return [
    "import { defineConfig } from '@reference-ui/neo'",
    ...(gatedDir === undefined ? [] : gateLines(gatedDir)),
    '',
    'export default defineConfig({',
    "  name: 'lock-test',",
    "  include: ['theme/**/*.{ts,tsx}'],",
    '})',
    '',
  ].join('\n')
}

function tokensFile(brand = BRAND): string {
  return [
    "import { tokens } from '@reference-ui/neo'",
    '',
    'tokens({',
    '  colors: {',
    `    brand: { value: '${brand}' },`,
    "    ink: { value: '#1a1a2e' },",
    '  },',
    '})',
    '',
  ].join('\n')
}

// Filler widens the hold window so the stall leg lands mid-sync; the kill
// path itself is identical whatever the world holds.
function fillerFile(i: number): string {
  return [
    "import { css } from '@reference-ui/react'",
    '',
    `export const a${i} = css({ color: 'brand', backgroundColor: 'ink' })`,
    `export const b${i} = css({ color: 'ink', borderColor: 'brand' })`,
    '',
  ].join('\n')
}

async function writeWorld(fillers: number, gated = false): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-lock-'))
  tempDirs.push(dir)
  writeFileSync(join(dir, 'ui.config.ts'), configFile(gated ? dir : undefined))
  mkdirSync(join(dir, 'theme'), { recursive: true })
  writeFileSync(join(dir, 'theme', 'tokens.ts'), tokensFile())
  for (let i = 0; i < fillers; i++) writeFileSync(join(dir, 'theme', `fill-${i}.ts`), fillerFile(i))
  return dir
}

interface BinRun {
  code: number | null
  pid?: number
  stdout: string
  stderr: string
}

function runBin(args: string[], cwd: string): Promise<BinRun> {
  return new Promise((resolve) => {
    const child = execFile(process.execPath, [BIN_PATH, ...args], { cwd, env: PLAIN_ENV, timeout: 120000 }, (err, stdout, stderr) => {
      resolve({ code: err ? ((err as { code?: number }).code ?? 1) : 0, pid: child.pid, stdout: String(stdout), stderr: String(stderr) })
    })
  })
}

interface Spawned {
  child: ChildProcess
  output: () => string
}

function spawnBin(args: string[], cwd: string): Spawned {
  const child = spawn(process.execPath, [BIN_PATH, ...args], { cwd, env: PLAIN_ENV, stdio: ['ignore', 'pipe', 'pipe'] })
  liveChildren.push(child)
  let text = ''
  child.stdout?.on('data', (chunk: Buffer) => { text += chunk.toString('utf8') })
  child.stderr?.on('data', (chunk: Buffer) => { text += chunk.toString('utf8') })
  return { child, output: () => text }
}

function childDone(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null
}

async function waitForOutput(spawned: Spawned, cond: () => boolean, label: string, budgetMs = 60000): Promise<void> {
  const deadline = Date.now() + budgetMs
  while (!cond()) {
    if (childDone(spawned.child)) throw new Error(`child exited early waiting for ${label}:\n${spawned.output()}`)
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${label}:\n${spawned.output()}`)
    await sleep(50)
  }
}

async function waitForFile(path: string, label: string, budgetMs = 60000): Promise<void> {
  const deadline = Date.now() + budgetMs
  while (!existsSync(path)) {
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${label}`)
    await sleep(5)
  }
}

// The holder drops a stranded stage only after holdSession has installed its SIGTERM handler, so the
// drop is the safe moment to STOP it. Fails fast with the holder's output if it exits first.
async function waitForStageDrop(path: string, holder: Spawned, budgetMs = 60000): Promise<void> {
  const deadline = Date.now() + budgetMs
  while (existsSync(path)) {
    if (childDone(holder.child)) throw new Error(`holder exited before dropping its stage:\n${holder.output()}`)
    if (Date.now() >= deadline) throw new Error('timed out waiting for the holder to drop the stranded stage')
    await sleep(5)
  }
}

// A hung shutdown must be diagnosable from the failure alone: the timeout
// names the child and carries everything it printed.
async function waitForExit(spawned: Spawned, label: string, budgetMs = 60000): Promise<void> {
  const deadline = Date.now() + budgetMs
  while (!childDone(spawned.child)) {
    if (Date.now() >= deadline) {
      throw new Error(`timed out waiting for ${label} to exit (pid ${spawned.child.pid}, still running):\n${spawned.output()}`)
    }
    await sleep(25)
  }
}

async function reap(child: ChildProcess): Promise<void> {
  try {
    if (childDone(child)) return
    child.kill('SIGTERM')
    const deadline = Date.now() + 10000
    while (!childDone(child) && Date.now() < deadline) await sleep(50)
    if (!childDone(child)) child.kill('SIGKILL')
  } catch {
    // Reap runs in teardown; it must never mask the failing assertion.
  }
}

function sheetHasBrand(dir: string, brand = BRAND): boolean {
  const sheet = join(dir, '.reference-ui', 'styled', 'styles.css')
  return existsSync(sheet) && readFileSync(sheet, 'utf8').toLowerCase().includes(`--colors-brand: ${brand}`)
}

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
  // A stranded stage the holder drops right after holdSession installs its SIGTERM
  // handler. The owner file lands a few awaits earlier, and a STOP in that gap queues
  // the SIGTERM for default death (signal, no exit 75).
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

interface HeldResync {
  dir: string
  watch: Spawned
  lockDir: string
  openGate(): void
}

// A watch with a resync held in flight: boot, change the brand so the resync
// has something to commit, then poke it (SIGUSR2, exactly what a one-shot
// does) with the gate naming the watch's pid. It returns once the resync
// waits at the gate, so the watch is mid-sync holding its lock.
async function holdWatchMidResync(): Promise<HeldResync> {
  const dir = await writeWorld(0, true)
  const watch = spawnBin(['sync', '--watch', '--debug', dir], dir)
  await waitForOutput(watch, () => watch.output().includes('ready in'), 'the boot block')
  writeFileSync(join(dir, 'theme', 'tokens.ts'), tokensFile(REBRAND))
  writeFileSync(gatePath(dir), String(watch.child.pid))
  const openGate = (): void => rmSync(gatePath(dir), { force: true })
  gateOpeners.push(openGate)
  watch.child.kill('SIGUSR2')
  await waitForOutput(watch, () => existsSync(arrivedPath(dir)), 'the resync to reach the gate')
  return { dir, watch, lockDir: join(dir, '.reference-ui', 'sync.lock'), openGate }
}

// The stopping watch is alive only because its resync is still held, so the
// lock it owns must still be on disk; it must also read as a live watch to a
// newcomer, which is covered and never syncs alongside the old sync.
async function expectLockKeptAgainstNewcomer(held: HeldResync): Promise<void> {
  expect(childDone(held.watch.child)).toBe(false)
  expect(existsSync(held.lockDir), 'the lock must outlive the in-flight resync').toBe(true)
  const newcomer = await runBin(['sync', held.dir], held.dir)
  expect(newcomer.code).toBe(0)
  expect(newcomer.stdout).toContain(`already watching this project (pid ${held.watch.child.pid})`)
  expect(newcomer.stdout).not.toMatch(BOOT_BLOCK_RE)
  expect(existsSync(held.lockDir), 'a newcomer must not take the lock off a stopping watch').toBe(true)
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
    '%s mid-resync: the lock outlives the sync, a newcomer is covered, the sync commits, exit 0',
    async (signal) => {
      const held = await holdWatchMidResync()
      held.watch.child.kill(signal)
      await waitForOutput(held.watch, () => held.watch.output().includes(`shutdown ${signal}: stopping`), 'the graceful stop to begin')
      await expectLockKeptAgainstNewcomer(held)
      await expectGracefulFinish(held)
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
