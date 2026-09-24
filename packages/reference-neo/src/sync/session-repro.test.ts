// Repro suite for the sync session lock: real `ref` child processes over
// temp worlds, never the workspace. It takes spawned one-shots and watches
// and asserts the last-wins contract: kill legs exit the victim 75 with the
// superseded message, the watch poke covers the newcomer 0, stale and torn
// locks take over with warnings, and signals release the lock. Signal legs
// are POSIX-only; stale, torn, and break-lock run everywhere.

import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const BIN_PATH = fileURLToPath(new URL('../../bin/ref.ts', import.meta.url))
const SYNC_LINE_RE = /⎔ ref sync ⫶ \d+ ms ⫶ [\d.]+ (B|KB|MB)/
const POSIX = process.platform !== 'win32'
const tempDirs: string[] = []
const liveChildren: ChildProcess[] = []

afterEach(async () => {
  await Promise.all(liveChildren.splice(0).map((child) => reap(child)))
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function configFile(): string {
  return [
    "import { defineConfig } from '@reference-ui/neo'",
    '',
    'export default defineConfig({',
    "  name: 'lock-test',",
    "  include: ['theme/**/*.{ts,tsx}'],",
    '})',
    '',
  ].join('\n')
}

function tokensFile(): string {
  return [
    "import { tokens } from '@reference-ui/neo'",
    '',
    'tokens({',
    '  colors: {',
    "    brand: { value: '#7c3aed' },",
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

async function writeWorld(fillers: number): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-lock-'))
  tempDirs.push(dir)
  writeFileSync(join(dir, 'ui.config.ts'), configFile())
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
    const child = execFile(process.execPath, [BIN_PATH, ...args], { cwd, timeout: 120000 }, (err, stdout, stderr) => {
      resolve({ code: err ? ((err as { code?: number }).code ?? 1) : 0, pid: child.pid, stdout: String(stdout), stderr: String(stderr) })
    })
  })
}

interface Spawned {
  child: ChildProcess
  output: () => string
}

function spawnBin(args: string[], cwd: string): Spawned {
  const child = spawn(process.execPath, [BIN_PATH, ...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
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

async function waitForExit(child: ChildProcess, budgetMs = 60000): Promise<void> {
  const deadline = Date.now() + budgetMs
  while (!childDone(child)) {
    if (Date.now() >= deadline) throw new Error('timed out waiting for child exit')
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

function sheetHasBrand(dir: string): boolean {
  const sheet = join(dir, '.reference-ui', 'styled', 'styles.css')
  return existsSync(sheet) && readFileSync(sheet, 'utf8').toLowerCase().includes('--colors-brand: #7c3aed')
}

describe('sync session lock: control and kill legs', () => {
  it('control: a lone one-shot syncs unchanged with no lock lines', async () => {
    const dir = await writeWorld(0)
    const run = await runBin(['sync', dir], dir)
    expect(run.code).toBe(0)
    expect(run.stdout).toMatch(SYNC_LINE_RE)
    expect(run.stdout).not.toMatch(/stale lock|supersed|covered by|break-lock/)
    expect(sheetHasBrand(dir)).toBe(true)
    expect(existsSync(join(dir, '.reference-ui', 'sync.lock'))).toBe(false)
  }, 120000)

  it.skipIf(!POSIX)('one-shot toward one-shot kills: victim exits 75, newcomer completes', async () => {
    const dir = await writeWorld(400)
    const ownerPath = join(dir, '.reference-ui', 'sync.lock', 'owner.json')
    const preemptPath = join(dir, '.reference-ui', 'sync.lock', 'preempt.json')
    const slow = spawnBin(['sync', dir], dir)
    // Stall the holder mid-sync; the preempt marker later proves B reached
    // the kill leg before the holder is released to die.
    await waitForFile(ownerPath, 'the holder lock')
    if (childDone(slow.child)) throw new Error('harness lost the race: A finished before the stall')
    slow.child.kill('SIGSTOP')
    await sleep(50)
    if (childDone(slow.child)) throw new Error('harness lost the race: A finished before the stall landed')
    const fast = runBin(['sync', dir], dir)
    await waitForFile(preemptPath, 'the preempt marker')
    slow.child.kill('SIGCONT')
    const [done, newcomer] = [slow, await fast]
    await waitForExit(done.child)
    if (done.child.exitCode === 0) throw new Error(`harness lost the race: A finished before the kill:\n${done.output()}`)
    expect(done.child.exitCode).toBe(75)
    expect(done.output()).toContain(`superseded by sync pid ${newcomer.pid}`)
    expect(newcomer.code).toBe(0)
    expect(newcomer.stdout).toContain(`superseding sync pid ${done.child.pid}`)
    expect(newcomer.stdout).toMatch(SYNC_LINE_RE)
    expect(sheetHasBrand(dir)).toBe(true)
    expect(existsSync(join(dir, '.reference-ui', 'sync.lock'))).toBe(false)
  }, 120000)

  it.skipIf(!POSIX)('watch toward watch kills: old session exits 75, new session watches', async () => {
    const dir = await writeWorld(0)
    const old = spawnBin(['sync', '--watch', dir], dir)
    await waitForOutput(old, () => old.output().includes(`watching ${dir}`), 'the old watching line')
    const fresh = spawnBin(['sync', '--watch', dir], dir)
    await waitForExit(old.child)
    expect(old.child.exitCode).toBe(75)
    expect(old.output()).toContain(`superseded by sync pid ${fresh.child.pid}`)
    await waitForOutput(fresh, () => fresh.output().includes(`watching ${dir}`), 'the new watching line')
    expect(fresh.output()).toContain(`superseding sync pid ${old.child.pid}`)
    expect(childDone(fresh.child)).toBe(false)
    fresh.child.kill('SIGTERM')
    await waitForExit(fresh.child)
    expect(fresh.child.exitCode).toBe(0)
  }, 120000)

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
    await waitForOutput(watch, () => watch.output().includes(`watching ${dir}`), 'the watching line')
    const resyncs = (): number => watch.output().split('resync').length - 1
    const before = resyncs()
    const run = await runBin(['sync', dir], dir)
    expect(run.code).toBe(0)
    expect(run.stdout).toContain(`covered by watch session pid ${watch.child.pid}`)
    await waitForOutput(watch, () => resyncs() > before, 'the poke resync')
    expect(childDone(watch.child)).toBe(false)
    watch.child.kill('SIGTERM')
    await waitForExit(watch.child)
    expect(watch.child.exitCode).toBe(0)
    expect(existsSync(join(dir, '.reference-ui', 'sync.lock'))).toBe(false)
  }, 120000)

  it.skipIf(!POSIX)('SIGINT releases the lock: the next sync proceeds with no stale warning', async () => {
    const dir = await writeWorld(0)
    const watch = spawnBin(['sync', '--watch', dir], dir)
    await waitForOutput(watch, () => watch.output().includes(`watching ${dir}`), 'the watching line')
    watch.child.kill('SIGINT')
    await waitForExit(watch.child)
    expect(watch.child.exitCode).toBe(0)
    const run = await runBin(['sync', dir], dir)
    expect(run.code).toBe(0)
    expect(run.stdout).not.toMatch(/stale lock/)
    expect(sheetHasBrand(dir)).toBe(true)
  }, 120000)

  it.skipIf(!POSIX)('--break-lock takes a live lock with a warning and the holder survives', async () => {
    const dir = await writeWorld(0)
    const watch = spawnBin(['sync', '--watch', dir], dir)
    await waitForOutput(watch, () => watch.output().includes(`watching ${dir}`), 'the watching line')
    const run = await runBin(['sync', '--break-lock', dir], dir)
    expect(run.code).toBe(0)
    expect(run.stdout).toContain(`--break-lock: taking over lock held by pid ${watch.child.pid}`)
    expect(sheetHasBrand(dir)).toBe(true)
    expect(childDone(watch.child)).toBe(false)
    watch.child.kill('SIGTERM')
    await waitForExit(watch.child)
  }, 120000)
})
