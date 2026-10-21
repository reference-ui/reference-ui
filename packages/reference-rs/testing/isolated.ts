/**
 * Runs one reference-rs export in a child Node process. A hostile input that overflows a native stack or never
 * returns then ends as a reported signal or timeout, not a dead Vitest worker. runIsolated takes a built dist
 * entry (or an absolute .mjs path), an export name, JSON arguments and a kill budget, and returns the parsed JSON
 * result with the signal, exit status, wall time, timeout flag and stderr tail. expectBounded checks that record
 * against a time budget and either returns the result or throws a message that names the cause.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** One export to call in a child process. */
export interface IsolatedCall {
  /** A dist entry name such as "atomic" or "tasty/browser", or an absolute path to an .mjs module. */
  module: string
  /** The export to call. An async export is awaited in the child before its result is written. */
  fn: string
  /** JSON-serialisable arguments, spread into the call. Defaults to none. */
  args?: readonly unknown[]
  /** Kill budget in milliseconds; the child gets SIGKILL when it is reached. */
  timeoutMs: number
}

/** How the child ended. `result` is set only for an exit with status 0 that wrote its result. */
export interface IsolatedRun<T = unknown> {
  result: T | undefined
  /** The signal that ended the child, such as SIGILL or SIGKILL; null when it exited on its own. */
  signal: NodeJS.Signals | null
  /** The exit status; null when a signal ended the child. */
  status: number | null
  /** Wall-clock milliseconds from spawn to exit, with Node startup and module load included. */
  ms: number
  /** True when the timeout fired and the runner killed the child. */
  timedOut: boolean
  /** The last few thousand characters of the child's stderr. */
  stderr: string
}

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(HERE, '..', 'dist')
const STDERR_TAIL_CHARS = 2000
const STDERR_LIMIT_BYTES = 8 * 1024 * 1024

// The child's whole program, run with `node --input-type=module -e`. It exits explicitly so an export that
// leaves a timer open cannot hold the child past its budget; diagnostics go to stderr, the result to a file.
const DRIVER = `
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
const [modulePath, fnName, argsJson, resultFile] = process.argv.slice(1)
try {
  const mod = await import(pathToFileURL(modulePath).href)
  if (typeof mod[fnName] !== 'function') {
    throw new Error(fnName + ' is not an exported function of ' + modulePath)
  }
  const value = await mod[fnName](...JSON.parse(argsJson))
  fs.writeFileSync(resultFile, JSON.stringify(value ?? null))
  process.exit(0)
} catch (error) {
  fs.writeSync(2, String(error?.stack ?? error) + '\\n')
  process.exit(1)
}
`

/**
 * Calls one export in a fresh Node process and reports how it ended. A child outcome (a signal, a timeout, a
 * non-zero exit) is returned, never thrown; only a missing module or a child that cannot start throws, because
 * those are mistakes in the case rather than findings about the engine.
 */
export function runIsolated<T = unknown>(call: IsolatedCall): IsolatedRun<T> {
  // spawnSync treats a timeout of 0 as no timeout, so an unbounded call must be refused here.
  if (!(call.timeoutMs > 0)) {
    throw new Error(`runIsolated: timeoutMs must be a positive number of milliseconds, got ${call.timeoutMs}`)
  }
  const modulePath = resolveModule(call.module)
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-isolated-'))
  try {
    return spawnAndRead<T>(modulePath, call, path.join(scratch, 'result.json'))
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true })
  }
}

/**
 * Returns the child's result when the call finished inside the budget, and throws otherwise. Each failure
 * names its cause: a timeout reads "exceeded <ms> ms", a signal reads "signal <NAME>", a non-zero exit carries
 * the stderr tail, and a call that ran past the budget reads "exceeded <ms> ms" as well.
 */
export function expectBounded<T>(run: IsolatedRun<T>, bound: { ms: number }): T {
  if (run.timedOut) {
    throw new Error(`isolated call exceeded ${bound.ms} ms: killed with SIGKILL after ${run.ms} ms`)
  }
  if (run.signal !== null) {
    throw new Error(`isolated call ended by signal ${run.signal} after ${run.ms} ms${stderrDetail(run)}`)
  }
  if (run.status !== 0) {
    throw new Error(`isolated call exited with status ${run.status}${stderrDetail(run)}`)
  }
  if (run.ms > bound.ms) {
    throw new Error(`isolated call exceeded ${bound.ms} ms: took ${run.ms} ms`)
  }
  if (run.result === undefined) {
    throw new Error('isolated call exited 0 without writing a result')
  }
  return run.result
}

function resolveModule(module: string): string {
  const file = path.isAbsolute(module) ? module : path.join(DIST_DIR, `${module}.mjs`)
  if (!fs.existsSync(file)) {
    throw new Error(
      `runIsolated: ${file} does not exist; build the JS dist first (pnpm run build:js in packages/reference-rs)`,
    )
  }
  return file
}

function spawnAndRead<T>(modulePath: string, call: IsolatedCall, resultFile: string): IsolatedRun<T> {
  const started = Date.now()
  const child = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', DRIVER, '--', modulePath, call.fn, JSON.stringify(call.args ?? []), resultFile],
    {
      env: childEnv(),
      stdio: ['ignore', 'ignore', 'pipe'],
      timeout: call.timeoutMs,
      killSignal: 'SIGKILL',
      maxBuffer: STDERR_LIMIT_BYTES,
      encoding: 'utf8',
    },
  )
  const timedOut = isTimeout(child.error)
  if (child.error && !timedOut) throw child.error
  return {
    result: readResult<T>(resultFile, child.status),
    signal: child.signal,
    status: child.status,
    ms: Date.now() - started,
    timedOut,
    stderr: child.stderr.slice(-STDERR_TAIL_CHARS).trim(),
  }
}

/**
 * The parent's environment minus RUST_MIN_STACK, which resizes every Rust thread and would make a case depend on
 * the shell it was run from.
 */
function childEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }
  delete env.RUST_MIN_STACK
  return env
}

function isTimeout(error: Error | undefined): boolean {
  return error !== undefined && 'code' in error && error.code === 'ETIMEDOUT'
}

function readResult<T>(resultFile: string, status: number | null): T | undefined {
  if (status !== 0 || !fs.existsSync(resultFile)) return undefined
  return JSON.parse(fs.readFileSync(resultFile, 'utf8')) as T
}

function stderrDetail(run: IsolatedRun<unknown>): string {
  return run.stderr === '' ? '' : `; stderr: ${run.stderr}`
}
