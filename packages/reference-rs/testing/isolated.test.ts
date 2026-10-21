/**
 * Unit tests for the isolated call runner that hostile cases run through.
 * Each test writes small driver modules into a temporary folder and calls them in a real child process,
 * so a signal, a timeout, a thrown error and a large or async result are observed the way a case sees them.
 * The expectBounded tests use synthetic records to pin the message each failure names, which is what a failing case prints.
 * The last two describe blocks pin withTempDir (a directory the parent owns is removed after its child is killed) and
 * the refusal of a stale dist before anything spawns; the verdict's own cases live in dist-freshness.test.ts.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { expectBounded, runIsolated, withTempDir } from './isolated.js'
import type { IsolatedRun } from './isolated.js'
import { nativeBinaryFileName } from '../modules/runtime/js/shared/native-inputs.js'
import { getReferenceNativeTriple } from '../modules/runtime/js/shared/targets.js'

const CRASH_DRIVER = `export function crash() {
  process.kill(process.pid, 'SIGILL')
}
`

const HANG_DRIVER = `export function hang() {
  for (;;) {}
}
`

const CALLS_DRIVER = `export function echo(value) { return value }
export async function later(value, ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
  return value
}
export function big(mb) { return 'x'.repeat(mb * 1024 * 1024) }
export function boom() { throw new Error('boom from driver') }
export function rustMinStack() { return process.env.RUST_MIN_STACK ?? null }
`

const MARK_AND_HANG_DRIVER = `import fs from 'node:fs'
import path from 'node:path'
export function markAndHang(scratch) {
  fs.writeFileSync(path.join(scratch, 'marker'), 'written before the hang\\n')
  for (;;) {}
}
`

let dir = ''
let crashModule = ''
let hangModule = ''
let callsModule = ''
let markModule = ''
const fakeRoots: string[] = []

function writeDriver(name: string, source: string): string {
  const file = path.join(dir, name)
  fs.writeFileSync(file, source)
  return file
}

/** A package root with Rust sources and a native binary, but no inputs stamp beside it. */
function fakeRsRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-dist-stale-'))
  fakeRoots.push(root)
  fs.writeFileSync(path.join(root, 'Cargo.toml'), '[workspace]\n')
  fs.writeFileSync(path.join(root, 'Cargo.lock'), '')
  fs.mkdirSync(path.join(root, 'modules', 'demo', 'src'), { recursive: true })
  fs.writeFileSync(path.join(root, 'modules', 'demo', 'src', 'lib.rs'), 'pub fn demo() {}\n')
  const triple = getReferenceNativeTriple()
  if (triple === null) throw new Error('no native addon target on this host')
  fs.mkdirSync(path.join(root, 'dist', 'native'), { recursive: true })
  fs.writeFileSync(path.join(root, 'dist', 'native', nativeBinaryFileName(triple)), 'not an addon')
  return root
}

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-isolated-test-'))
  crashModule = writeDriver('crash.mjs', CRASH_DRIVER)
  hangModule = writeDriver('hang.mjs', HANG_DRIVER)
  callsModule = writeDriver('calls.mjs', CALLS_DRIVER)
  markModule = writeDriver('mark-and-hang.mjs', MARK_AND_HANG_DRIVER)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true })
  for (const root of fakeRoots) fs.rmSync(root, { recursive: true, force: true })
})

describe('withTempDir keeps the directory with the parent, so a killed child cannot leak it', () => {
  it('removes the directory after its child is killed by the timeout', () => {
    let owned = ''
    withTempDir('rs-isolated-owned-', (scratch) => {
      owned = scratch
      const run = runIsolated({ module: markModule, fn: 'markAndHang', args: [scratch], timeoutMs: 1000 })
      expect(run.timedOut).toBe(true)
      expect(fs.existsSync(path.join(scratch, 'marker'))).toBe(true)
    })
    expect(owned).not.toBe('')
    expect(fs.existsSync(owned)).toBe(false)
  })
})

describe('runIsolated refuses a stale reference-rs dist before it spawns', () => {
  it('throws the stale message, naming the native addon, instead of running the call', () => {
    const root = fakeRsRoot()
    expect(() =>
      runIsolated({ module: callsModule, fn: 'echo', args: [1], timeoutMs: 10_000, packageDir: root }),
    ).toThrow(/reference-rs dist is stale: native addon .*run pnpm agentrs b \/ build:js/s)
  })
})

describe('runIsolated reports how the child ended', () => {
  it('reports a SIGILL from the child as its signal, and the worker survives', () => {
    const run = runIsolated({ module: crashModule, fn: 'crash', timeoutMs: 10_000 })
    expect(run.signal).toBe('SIGILL')
    expect(run.status).toBeNull()
    expect(run.timedOut).toBe(false)
    expect(() => expectBounded(run, { ms: 2000 })).toThrow('signal SIGILL')
  })

  it('kills a child that outlives its timeout with SIGKILL and reports it timed out', () => {
    const run = runIsolated({ module: hangModule, fn: 'hang', timeoutMs: 1000 })
    expect(run.timedOut).toBe(true)
    expect(run.signal).toBe('SIGKILL')
    expect(() => expectBounded(run, { ms: 2000 })).toThrow('exceeded 2000 ms')
  })

  it('surfaces a thrown error as a non-zero status with its stderr in the message', () => {
    const run = runIsolated({ module: callsModule, fn: 'boom', timeoutMs: 10_000 })
    expect(run.status).toBe(1)
    expect(run.signal).toBeNull()
    expect(run.stderr).toContain('boom from driver')
    expect(() => expectBounded(run, { ms: 10_000 })).toThrow(/status 1.*boom from driver/s)
  })

  it('fails a call that finishes after the budget with exceeded <ms>', () => {
    const run = runIsolated({ module: callsModule, fn: 'later', args: ['late', 300], timeoutMs: 10_000 })
    expect(run.status).toBe(0)
    expect(() => expectBounded(run, { ms: 100 })).toThrow('exceeded 100 ms')
  })
})

describe('runIsolated returns the export result', () => {
  it('awaits an async export and returns its resolved value', () => {
    const run = runIsolated({ module: callsModule, fn: 'later', args: ['done', 20], timeoutMs: 10_000 })
    expect(expectBounded(run, { ms: 10_000 })).toBe('done')
  })

  it('round-trips JSON arguments and results', () => {
    const value = { n: 1, list: ['a', null] }
    const run = runIsolated({ module: callsModule, fn: 'echo', args: [value], timeoutMs: 10_000 })
    expect(expectBounded(run, { ms: 10_000 })).toEqual(value)
  })

  it('passes a result of several megabytes through intact', () => {
    const run = runIsolated({ module: callsModule, fn: 'big', args: [8], timeoutMs: 20_000 })
    const value = expectBounded(run, { ms: 20_000 }) as string
    expect(value.length).toBe(8 * 1024 * 1024)
  })

  it('does not pass RUST_MIN_STACK to the child', () => {
    vi.stubEnv('RUST_MIN_STACK', '65536')
    const run = runIsolated({ module: callsModule, fn: 'rustMinStack', timeoutMs: 10_000 })
    expect(expectBounded(run, { ms: 10_000 })).toBeNull()
  })

  it('resolves a short name to the built dist/<name>.mjs entry', () => {
    const run = runIsolated({ module: 'typegen', fn: 'primitivesVocabulary', timeoutMs: 30_000 })
    expect(typeof expectBounded(run, { ms: 30_000 })).toBe('object')
  })

  it('refuses a module that is not built, before spawning anything', () => {
    expect(() => runIsolated({ module: 'no-such-module', fn: 'x', timeoutMs: 1000 })).toThrow(
      'no-such-module.mjs',
    )
  })

  it('refuses a call with no positive time bound, since spawnSync would run it unbounded', () => {
    expect(() => runIsolated({ module: callsModule, fn: 'echo', args: [1], timeoutMs: 0 })).toThrow(
      'timeoutMs',
    )
  })
})

describe('expectBounded names the cause of a failure', () => {
  const ok = (overrides: Partial<IsolatedRun<unknown>> = {}): IsolatedRun<unknown> => ({
    result: 'value',
    signal: null,
    status: 0,
    ms: 5,
    timedOut: false,
    stderr: '',
    ...overrides,
  })

  it('returns the result of a run that finished inside the budget', () => {
    expect(expectBounded(ok(), { ms: 10 })).toBe('value')
  })

  it('reports a run that took longer than its budget', () => {
    expect(() => expectBounded(ok({ ms: 50 }), { ms: 10 })).toThrow('exceeded 10 ms')
  })

  it('reports a run that exited 0 without a result', () => {
    expect(() => expectBounded(ok({ result: undefined }), { ms: 10 })).toThrow(
      'without writing a result',
    )
  })
})
