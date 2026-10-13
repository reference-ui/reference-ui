// commit-world.ts — shared harness for the NEO-WATCH-19..23 commit specs. It takes nothing and emits temp worlds
// (each spec makes its own under the OS temp dir, so a committed case world never changes), a spawned `ref` CLI
// with its exit and output, a probe that freezes a sync inside its commit, and folder snapshots. A spec calls
// disposeWorld in its finally, which kills any child still running and removes the world.

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
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const BRAND = '#7c3aed'
export const REBRAND = '#0e5c3f'

// The CLI entry, four levels above this shared folder: packages/reference-neo/bin/ref.ts.
const REF_BIN = fileURLToPath(new URL('../../../../bin/ref.ts', import.meta.url))
const ENV = { ...process.env, FORCE_COLOR: undefined, NO_COLOR: '1' }

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
 * Stale generated files: a commit retires them after every staged file has landed, so planting many keeps the
 * commit busy long enough for a probe to freeze it inside the commit.
 */
export function plantStale(dir: string, count: number): void {
  for (let i = 0; i < count; i += 1) write(join(outOf(dir), 'stale', `old-${i}.txt`), `stale ${i}\n`)
}

/** One `ref` CLI child in cwd; `done` resolves with its exit and output once its streams close. */
export function spawnCli(args: string[], cwd: string): CliHandle {
  const child = spawn(process.execPath, [REF_BIN, ...args], { cwd, env: ENV, stdio: ['ignore', 'pipe', 'pipe'] })
  children.add(child)
  let stdout = ''
  let stderr = ''
  child.stdout?.on('data', (chunk: Buffer) => {
    stdout += chunk.toString('utf8')
  })
  child.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8')
  })
  const done = new Promise<CliRun>((resolve) => {
    child.on('close', (code, signal) => {
      children.delete(child)
      resolve({ code, signal, stdout, stderr, output: `${stdout}${stderr}` })
    })
  })
  return { child, done }
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

/** The stamp of the stage's compiled request, or undefined before any sync has written one. */
export function requestStamp(stageDir: string): string | undefined {
  try {
    const stat = statSync(join(stageDir, 'system', 'compile-request.json'))
    return `${stat.ino}:${stat.mtimeMs}`
  } catch {
    return undefined
  }
}

/**
 * Freezes one sync inside its commit. The stage's compiled request is written
 * right before the commit, which then runs synchronously; the probe stops the
 * child once a request newer than `previous` exists, and reports true only if
 * the stage is still there after the stop, which holds only while the commit
 * has not finished. Pass the stamp of a request another sync wrote into the same
 * stage, so the probe waits for this child's own request and not that one.
 */
export async function freezeInCommit(
  handle: CliHandle,
  stageDir: string,
  previous?: string,
  budgetMs = 60000
): Promise<boolean> {
  const deadline = Date.now() + budgetMs
  let stamp = requestStamp(stageDir)
  while (stamp === undefined || stamp === previous) {
    if (hasExited(handle.child) || Date.now() >= deadline) return false
    await sleep(1)
    stamp = requestStamp(stageDir)
  }
  handle.child.kill('SIGSTOP')
  await sleep(20)
  return existsSync(stageDir)
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
