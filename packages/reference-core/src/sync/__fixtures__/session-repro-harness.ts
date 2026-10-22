// Shared harness for the live session-lock suites: real `ref` child processes
// over temp worlds, never the workspace. It takes world sizes, CLI args and
// signals and emits spawned runs, waits with diagnosable failures, and a watch
// held mid-resync behind a gate. A gated config holds a watch resync in flight
// on demand: it is the one module that can await, and a load in the pid the gate
// file names waits until the file is removed while any other pid loads through.
// Each suite calls cleanupHarness in afterEach so gates open before children are
// reaped and temp worlds are removed.

import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const BIN_PATH = fileURLToPath(new URL('../../../bin/ref.ts', import.meta.url))
export const BOOT_BLOCK_RE = /REF  v\d+\.\d+\.\d+  ready in \d+ ms/
export const ATTACH_LINE_RE = /already watching this project/
export const BRAND = '#7c3aed'
export const REBRAND = '#0e5c3f'
export const POSIX = process.platform !== 'win32'
const tempDirs: string[] = []
const liveChildren: ChildProcess[] = []
const gateOpeners: Array<() => void> = []

// Plain text from every child, whatever runs the suite: the test-core runner
// exports FORCE_COLOR=1, which would paint the boot blocks the exact-text
// assertions read. NO_COLOR wins in the CLI; FORCE_COLOR is dropped so Node
// does not warn about the pair on the child's stderr.
export const PLAIN_ENV: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: undefined, NO_COLOR: '1' }

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function childDone(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null
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

/** Gates open before the reap, or a watch held at its gate sits out the grace. */
export async function cleanupHarness(): Promise<void> {
  for (const open of gateOpeners.splice(0)) open()
  await Promise.all(liveChildren.splice(0).map((child) => reap(child)))
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
}

// The gate lives in the config because it is the one module that can await
// (fragments bundle as IIFE). A load in the pid the gate file names marks its
// arrival and waits until the file is removed, so that process stays inside a
// sync holding its lock; any other pid, a newcomer included, loads through.
// A process evaluates an unchanged config bundle once (config/evaluate.ts), so
// a hold stamps the config anew: the resync's load is a real evaluation.
export const gatePath = (dir: string): string => join(dir, 'resync.gate')
export const arrivedPath = (dir: string): string => join(dir, 'resync.arrived')

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

function configFile(gatedDir?: string, stamp = 'boot'): string {
  return [
    "import { defineConfig } from '@reference-ui/core'",
    ...(gatedDir === undefined ? [] : gateLines(gatedDir)),
    ...(gatedDir === undefined ? [] : [`export const holdStamp = ${JSON.stringify(stamp)}`]),
    '',
    'export default defineConfig({',
    "  name: 'lock-test',",
    "  include: ['theme/**/*.{ts,tsx}'],",
    '})',
    '',
  ].join('\n')
}

export function tokensFile(brand = BRAND): string {
  return [
    "import { tokens } from '@reference-ui/core'",
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

export async function writeWorld(fillers: number, gated = false): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'core-lock-'))
  tempDirs.push(dir)
  writeFileSync(join(dir, 'ui.config.ts'), configFile(gated ? dir : undefined))
  mkdirSync(join(dir, 'theme'), { recursive: true })
  writeFileSync(join(dir, 'theme', 'tokens.ts'), tokensFile())
  for (let i = 0; i < fillers; i++) writeFileSync(join(dir, 'theme', `fill-${i}.ts`), fillerFile(i))
  return dir
}

export interface BinRun {
  code: number | null
  pid?: number
  stdout: string
  stderr: string
}

export function runBin(args: string[], cwd: string): Promise<BinRun> {
  return new Promise((resolve) => {
    const child = execFile(process.execPath, [BIN_PATH, ...args], { cwd, env: PLAIN_ENV, timeout: 120000 }, (err, stdout, stderr) => {
      resolve({ code: err ? ((err as { code?: number }).code ?? 1) : 0, pid: child.pid, stdout: String(stdout), stderr: String(stderr) })
    })
  })
}

export interface Spawned {
  child: ChildProcess
  output: () => string
}

export function spawnBin(args: string[], cwd: string): Spawned {
  const child = spawn(process.execPath, [BIN_PATH, ...args], { cwd, env: PLAIN_ENV, stdio: ['ignore', 'pipe', 'pipe'] })
  liveChildren.push(child)
  let text = ''
  child.stdout?.on('data', (chunk: Buffer) => { text += chunk.toString('utf8') })
  child.stderr?.on('data', (chunk: Buffer) => { text += chunk.toString('utf8') })
  return { child, output: () => text }
}

export async function waitForOutput(spawned: Spawned, cond: () => boolean, label: string, budgetMs = 60000): Promise<void> {
  const deadline = Date.now() + budgetMs
  while (!cond()) {
    if (childDone(spawned.child)) throw new Error(`child exited early waiting for ${label}:\n${spawned.output()}`)
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${label}:\n${spawned.output()}`)
    await sleep(50)
  }
}

export async function waitForFile(path: string, label: string, budgetMs = 60000): Promise<void> {
  const deadline = Date.now() + budgetMs
  while (!existsSync(path)) {
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${label}`)
    await sleep(5)
  }
}

// The holder drops a stranded stage only after it holds the lock, so the drop is
// the safe moment to STOP it mid-sync. Fails fast with the holder's output if it exits first.
export async function waitForStageDrop(path: string, holder: Spawned, budgetMs = 60000): Promise<void> {
  const deadline = Date.now() + budgetMs
  while (existsSync(path)) {
    if (childDone(holder.child)) throw new Error(`holder exited before dropping its stage:\n${holder.output()}`)
    if (Date.now() >= deadline) throw new Error('timed out waiting for the holder to drop the stranded stage')
    await sleep(5)
  }
}

// A hung shutdown must be diagnosable from the failure alone: the timeout
// names the child and carries everything it printed.
export async function waitForExit(spawned: Spawned, label: string, budgetMs = 60000): Promise<void> {
  const deadline = Date.now() + budgetMs
  while (!childDone(spawned.child)) {
    if (Date.now() >= deadline) {
      throw new Error(`timed out waiting for ${label} to exit (pid ${spawned.child.pid}, still running):\n${spawned.output()}`)
    }
    await sleep(25)
  }
}

export function sheetHasBrand(dir: string, brand = BRAND): boolean {
  const sheet = join(dir, '.reference-ui', 'styled', 'styles.css')
  return existsSync(sheet) && readFileSync(sheet, 'utf8').toLowerCase().includes(`--colors-brand: ${brand}`)
}

/** The pid that the lock dir's owner document names, or undefined when there is no lock. */
export function lockOwnerPid(dir: string): number | undefined {
  try {
    return (JSON.parse(readFileSync(join(dir, '.reference-ui', 'sync.lock', 'owner.json'), 'utf8')) as { pid: number }).pid
  } catch {
    return undefined
  }
}

export interface HeldResync {
  dir: string
  watch: Spawned
  lockDir: string
  openGate(): void
}

// A watch with a resync held in flight: boot, change the brand so the resync
// has something to commit, then poke it (SIGUSR2, exactly what a one-shot
// does) with the gate naming the watch's pid. It returns once the resync
// waits at the gate, so the watch is mid-sync holding its lock.
export async function holdWatchMidResync(): Promise<HeldResync> {
  const dir = await writeWorld(0, true)
  const watch = spawnBin(['sync', '--watch', '--debug', dir], dir)
  await waitForOutput(watch, () => watch.output().includes('ready in'), 'the boot block')
  writeFileSync(gatePath(dir), String(watch.child.pid))
  writeFileSync(join(dir, 'theme', 'tokens.ts'), tokensFile(REBRAND))
  writeFileSync(join(dir, 'ui.config.ts'), configFile(dir, 'held'))
  const openGate = (): void => rmSync(gatePath(dir), { force: true })
  gateOpeners.push(openGate)
  watch.child.kill('SIGUSR2')
  await waitForOutput(watch, () => existsSync(arrivedPath(dir)), 'the resync to reach the gate')
  return { dir, watch, lockDir: join(dir, '.reference-ui', 'sync.lock'), openGate }
}
