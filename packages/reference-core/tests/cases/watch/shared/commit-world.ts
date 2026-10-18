// commit-world.ts — shared harness for the NEO-WATCH-19..23 commit specs. It takes nothing and emits temp worlds
// (each spec makes its own under the OS temp dir, so a committed case world never changes), a spawned `ref` CLI
// with its exit and output, the driver for the commit's test-only pause point (a sync armed with it stands still
// inside its commit until the spec resumes it), and folder snapshots. A spec calls disposeWorld in its finally,
// which kills any child still running and removes the world.

import { spawn, type ChildProcess } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMMIT_PAUSE_ENV, pausedMarkerOf, resumeMarkerOf } from '../../../../src/sync/commit-pause.ts'

// The variable a spec sets on a child to arm the commit's pause point (see src/sync/commit-pause.ts).
export { COMMIT_PAUSE_ENV }

export const BRAND = '#7c3aed'
export const REBRAND = '#0e5c3f'

// The CLI entry, four levels above this shared folder: packages/reference-neo/bin/ref.ts.
const REF_BIN = fileURLToPath(new URL('../../../../bin/ref.ts', import.meta.url))
// The pause is armed only by a spec that passes its variable itself: one in the runner's own environment never reaches a child.
const ENV = { ...process.env, FORCE_COLOR: undefined, NO_COLOR: '1', [COMMIT_PAUSE_ENV]: undefined }

const children = new Set<ChildProcess>()

export interface CliRun {
  code: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
  output: string
}

export interface CliHandle {
  child: ChildProcess
  done: Promise<CliRun>
  /** Everything the child has printed so far, stdout then stderr: for a failure message while it still runs. */
  output: () => string
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function write(path: string, body: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body)
}

function configSource(include: string[]): string {
  return [
    "import { defineConfig } from '@reference-ui/neo'",
    '',
    'export default defineConfig({',
    "  name: 'neo-watch-commit',",
    `  include: ${JSON.stringify(include)},`,
    '})',
    '',
  ].join('\n')
}

function tokensSource(brand: string): string {
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

function baseSource(): string {
  return ["import { css } from '@reference-ui/react'", '', "export const base = css({ color: 'brand' })", ''].join('\n')
}

/** A fresh world under the OS temp dir: a config over theme/, the brand tokens, and one brand-colored css() module. */
export function makeWorld(include: string[] = ['theme/**/*.{ts,tsx}']): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'neo-watch-commit-')))
  write(join(dir, 'ui.config.ts'), configSource(include))
  write(join(dir, 'theme', 'tokens.ts'), tokensSource(BRAND))
  write(join(dir, 'theme', 'base.ts'), baseSource())
  return dir
}

/** Rewrites the brand token, so the next sync changes the generated sheet. */
export function setBrand(dir: string, brand: string): void {
  write(join(dir, 'theme', 'tokens.ts'), tokensSource(brand))
}

export function outOf(dir: string): string {
  return join(dir, '.reference-ui')
}

export function stageOf(dir: string): string {
  return join(outOf(dir), 'sync.stage')
}

export function lockOf(dir: string): string {
  return join(outOf(dir), 'sync.lock')
}

/**
 * Stale generated files with no staged twin. A commit retires them last, after the pause point, and checks
 * that it still owns the lock before each one: planting some gives a commit that resumes from its pause
 * retiring to do, which is where a sync that lost the lock meanwhile stops.
 */
export function plantStale(dir: string, count: number): void {
  for (let i = 0; i < count; i += 1) write(join(outOf(dir), 'stale', `old-${i}.txt`), `stale ${i}\n`)
}

/**
 * One `ref` CLI child in cwd; `done` resolves with its exit and output once its streams close. `env` overlays
 * the child's environment: set the commit pause variable (COMMIT_PAUSE_ENV) in it to arm the pause point.
 */
export function spawnCli(args: string[], cwd: string, env: Record<string, string> = {}): CliHandle {
  const child = spawn(process.execPath, [REF_BIN, ...args], {
    cwd,
    env: { ...ENV, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  children.add(child)
  let stdout = ''
  let stderr = ''
  child.stdout?.on('data', (chunk: Buffer) => {
    stdout += chunk.toString('utf8')
  })
  child.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8')
  })
  const output = (): string => `${stdout}${stderr}`
  const done = new Promise<CliRun>((resolve) => {
    child.on('close', (code, signal) => {
      children.delete(child)
      resolve({ code, signal, stdout, stderr, output: output() })
    })
  })
  return { child, done, output }
}

/** Runs `ref <args>` to completion; a budget overrun kills the child, which then reports its signal. */
export async function runCli(args: string[], cwd: string, budgetMs = 180000): Promise<CliRun> {
  const handle = spawnCli(args, cwd)
  const timer = setTimeout(() => handle.child.kill('SIGKILL'), budgetMs)
  try {
    return await handle.done
  } finally {
    clearTimeout(timer)
  }
}

function hasExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null
}

/**
 * The directory a world's syncs write their pause markers into and watch for their resume files. It sits
 * inside the world and outside the generated folder, so the commit never sees it.
 */
export function pauseDirOf(dir: string): string {
  return join(dir, '.commit-pause')
}

function pidOf(handle: CliHandle): number {
  const pid = handle.child.pid
  if (pid === undefined) throw new Error('the ref child did not start')
  return pid
}

/**
 * Resolves true once the child stands at its commit's pause point: its live changes have landed and it has not
 * retired stale files yet, so the folder and the lock are as they will stay until it is resumed. Resolves false
 * if the child exited first, or never got there within the budget.
 */
export async function awaitPaused(handle: CliHandle, pauseDir: string, budgetMs = 60000): Promise<boolean> {
  const marker = pausedMarkerOf(pauseDir, pidOf(handle))
  const deadline = Date.now() + budgetMs
  while (!existsSync(marker)) {
    if (hasExited(handle.child) || Date.now() >= deadline) return false
    await sleep(5)
  }
  return true
}

/** Releases a child from its pause: its commit goes on from the pause point. */
export function resume(handle: CliHandle, pauseDir: string): void {
  write(resumeMarkerOf(pauseDir, pidOf(handle)), '')
}

/** True when the live stylesheet carries this brand color, so the commit has already replaced it. */
export function liveSheetCarries(dir: string, brand: string): boolean {
  const sheet = join(outOf(dir), 'styled', 'styles.css')
  return existsSync(sheet) && readFileSync(sheet, 'utf8').toLowerCase().includes(`--colors-brand: ${brand}`)
}

/** Every file under root: relative path to a content hash. Empty when root is missing. */
export function snapshot(root: string): Map<string, string> {
  const out = new Map<string, string>()
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else out.set(relative(root, full), createHash('sha1').update(readFileSync(full)).digest('hex'))
    }
  }
  if (existsSync(root)) walk(root)
  return out
}

/** Kills every child a failed step left running, then removes the world. */
export function disposeWorld(dir: string): void {
  for (const child of children) {
    try {
      child.kill('SIGKILL')
    } catch {
      // Already gone.
    }
  }
  children.clear()
  rmSync(dir, { recursive: true, force: true })
}
