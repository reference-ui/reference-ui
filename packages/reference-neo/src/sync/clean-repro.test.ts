// Repro legs for `ref clean` as a writer-kind holder: real `ref` child
// processes over temp worlds, never the workspace. Clean-kills-always means
// a clean landing on a live sync or watch kills the holder (exit 75 naming
// the clean pid), wipes the folder, and releases — and the next sync after
// a clean proceeds unlocked. Both legs are POSIX-only (STOP-gating plus
// signals); stale-clean takeover is pinned in-process in clean.test.ts.

import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const BIN_PATH = fileURLToPath(new URL('../../bin/ref.ts', import.meta.url))
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
    "  name: 'clean-test',",
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
  const dir = await mkdtemp(join(tmpdir(), 'neo-clean-'))
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

describe('clean writer kind: live kill legs', () => {
  it.skipIf(!POSIX)('clean toward one-shot kills: victim exits 75, clean removes the folder', async () => {
    const dir = await writeWorld(400)
    const outDir = join(dir, '.reference-ui')
    const ownerPath = join(outDir, 'sync.lock', 'owner.json')
    const preemptPath = join(outDir, 'sync.lock', 'preempt.json')
    const slow = spawnBin(['sync', dir], dir)
    // Stall the holder mid-sync; the preempt marker later proves the clean
    // reached the kill leg before the holder is released to die.
    await waitForFile(ownerPath, 'the holder lock')
    if (childDone(slow.child)) throw new Error('harness lost the race: A finished before the stall')
    slow.child.kill('SIGSTOP')
    await sleep(50)
    if (childDone(slow.child)) throw new Error('harness lost the race: A finished before the stall landed')
    const fast = runBin(['clean', dir], dir)
    await waitForFile(preemptPath, 'the preempt marker')
    slow.child.kill('SIGCONT')
    const [done, cleaner] = [slow, await fast]
    await waitForExit(done.child)
    if (done.child.exitCode === 0) throw new Error(`harness lost the race: A finished before the kill:\n${done.output()}`)
    expect(done.child.exitCode).toBe(75)
    expect(done.output()).toContain(`superseded by clean pid ${cleaner.pid}`)
    expect(cleaner.code).toBe(0)
    expect(cleaner.stdout).toContain(`[ref] clean: superseding sync pid ${done.child.pid}, taking over`)
    expect(cleaner.stdout).toContain(`[ref] clean removed ${outDir}`)
    expect(existsSync(outDir)).toBe(false)
  }, 120000)

  it.skipIf(!POSIX)('clean toward watch kills: watch exits 75, the next sync proceeds unlocked', async () => {
    const dir = await writeWorld(0)
    const outDir = join(dir, '.reference-ui')
    const watch = spawnBin(['sync', '--watch', dir], dir)
    await waitForOutput(watch, () => watch.output().includes(`watching ${dir}`), 'the watching line')
    const cleaner = await runBin(['clean', dir], dir)
    await waitForExit(watch.child)
    expect(watch.child.exitCode).toBe(75)
    expect(watch.output()).toContain(`superseded by clean pid ${cleaner.pid}`)
    expect(cleaner.code).toBe(0)
    expect(cleaner.stdout).toContain(`[ref] clean: superseding sync pid ${watch.child.pid}, taking over`)
    expect(existsSync(outDir)).toBe(false)
    const after = await runBin(['sync', dir], dir)
    expect(after.code).toBe(0)
    expect(after.stdout).not.toMatch(/stale lock/)
    expect(existsSync(join(outDir, 'styled', 'styles.css'))).toBe(true)
    expect(readFileSync(join(outDir, 'styled', 'styles.css'), 'utf8').toLowerCase()).toContain('--colors-brand: #7c3aed')
  }, 120000)
})
