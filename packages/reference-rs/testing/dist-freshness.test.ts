/**
 * Tests for the dist freshness gate that runIsolated applies before it spawns. Each stale case copies the inputs the
 * verdict reads into a temporary package root, breaks exactly one of them, and checks that the reason names that part.
 * The copy writes its own native and bundle stamps from its own files, so it is fresh by construction even while other
 * work edits this checkout, and a stale verdict can only come from the change the case made. The native addon binary is
 * a placeholder in the copy: the gate reads its stamp, never the binary. The copy walks only the native inputs the native
 * stamp hashes and never enters a test-temp directory, and a file that a concurrent test or build removes mid-copy is left
 * out or replaced by a placeholder. The last describe blocks pin the cached path, and the copy's own walk.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Dirent, Stats } from 'node:fs'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import {
  assertRsDistFresh,
  readDistState,
  rsDistStaleness,
  VERDICT_FILE_ENV,
  writeDistVerdictMarker,
  type DistVerdictMarker,
} from './dist-freshness.js'
import {
  hashNativeInputs,
  isHashedFile,
  NATIVE_INPUT_ROOTS,
  nativeBinaryFileName,
  nativeStampFileName,
} from '../modules/runtime/js/shared/native-inputs.js'
import { getReferenceNativeTriple } from '../modules/runtime/js/shared/targets.js'
import { BUNDLE_STAMP_FILE, digestFile } from '../scripts/bundle-stamp.mjs'

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STAMP_READ_ATTEMPTS = 40
const STAMP_RETRY_MS = 25
// Directories that hold no native input: test scratch, build output and dependencies. Other work creates and removes
// files in them while a test runs, and no hashed input lives under one of these names or under a hidden directory.
const NON_INPUT_DIR_NAMES = new Set(['node_modules', 'target', 'dist'])
const SLEEP_CELL = new Int32Array(new SharedArrayBuffer(4))
const copies: string[] = []

interface StampPaths {
  inputs: string[]
  outputs: string[]
}

afterAll(() => {
  for (const copy of copies) fs.rmSync(copy, { recursive: true, force: true })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

/**
 * The paths the checkout's bundle stamp covers. Only the paths are read; the copy computes its own digests. A build
 * rewrites the stamp in place, so a read that lands mid-write is retried.
 */
function bundlePaths(): StampPaths {
  const stamp = readStampWhenWhole(path.join(PACKAGE_DIR, 'dist', BUNDLE_STAMP_FILE))
  return { inputs: Object.keys(stamp.inputs), outputs: Object.keys(stamp.outputs) }
}

interface RecordedStamp {
  inputs: Record<string, string>
  outputs: Record<string, string>
}

function readStampWhenWhole(file: string): RecordedStamp {
  for (let attempt = 1; ; attempt++) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8')) as RecordedStamp
    } catch (error) {
      if (attempt >= STAMP_READ_ATTEMPTS) throw error
      sleepMs(STAMP_RETRY_MS)
    }
  }
}

function sleepMs(ms: number): void {
  Atomics.wait(SLEEP_CELL, 0, 0, ms)
}

/**
 * Copies one file of the checkout into the copy. A file that a concurrent build or edit removed gets a placeholder
 * instead: the stamps are computed from the copy's own files, so only the path has to exist there.
 */
function copyFile(rel: string, root: string, from: string = PACKAGE_DIR): void {
  const target = path.join(root, rel)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  try {
    fs.copyFileSync(path.join(from, rel), target)
  } catch (error) {
    if (!isMissing(error)) throw error
    fs.writeFileSync(target, `placeholder for ${rel}\n`)
  }
}

/**
 * Copies the native inputs of `from` into `to`: the roots NATIVE_INPUT_ROOTS, filtered by isHashedFile, the predicate the
 * native hash uses. Symlinks are kept as links, dangling ones included. A directory whose name is in NON_INPUT_DIR_NAMES,
 * or any hidden directory, is never entered. An entry that vanishes mid-copy is left out, and `visit` runs before each
 * entry so a case can change the tree at a known point in the walk.
 */
function copyNativeInputs(from: string, to: string, visit?: (rel: string) => void): void {
  for (const root of NATIVE_INPUT_ROOTS) copyEntry(from, to, root, visit)
}

function copyEntry(from: string, to: string, rel: string, visit: ((rel: string) => void) | undefined): void {
  visit?.(rel)
  const stat = statIfPresent(path.join(from, rel))
  if (stat === undefined) return
  if (stat.isSymbolicLink()) copySymlink(from, to, rel)
  else if (stat.isDirectory()) copyDirectory(from, to, rel, visit)
  else if (stat.isFile() && isHashedFile(rel)) copyNativeFile(from, to, rel)
}

function copySymlink(from: string, to: string, rel: string): void {
  ifPresent(() => {
    fs.mkdirSync(path.dirname(path.join(to, rel)), { recursive: true })
    fs.symlinkSync(fs.readlinkSync(path.join(from, rel)), path.join(to, rel))
  })
}

function copyDirectory(from: string, to: string, rel: string, visit: ((rel: string) => void) | undefined): void {
  for (const entry of listIfPresent(path.join(from, rel))) {
    if (entry.isDirectory() && isNonInputDir(entry.name)) continue
    copyEntry(from, to, `${rel}/${entry.name}`, visit)
  }
}

function copyNativeFile(from: string, to: string, rel: string): void {
  ifPresent(() => {
    fs.mkdirSync(path.dirname(path.join(to, rel)), { recursive: true })
    fs.copyFileSync(path.join(from, rel), path.join(to, rel))
  })
}

function isNonInputDir(name: string): boolean {
  return name.startsWith('.') || NON_INPUT_DIR_NAMES.has(name)
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT'
}

/** Runs `step`, treating a path that a concurrent test or build removed as already gone. */
function ifPresent(step: () => void): void {
  try {
    step()
  } catch (error) {
    if (!isMissing(error)) throw error
  }
}

function statIfPresent(file: string): Stats | undefined {
  try {
    return fs.lstatSync(file)
  } catch (error) {
    if (isMissing(error)) return undefined
    throw error
  }
}

function listIfPresent(dir: string): Dirent[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
  } catch (error) {
    if (isMissing(error)) return []
    throw error
  }
}

function triple(): string {
  const target = getReferenceNativeTriple()
  if (target === null) throw new Error(`no native addon target for ${process.platform}-${process.arch}`)
  return target
}

/** Writes the native stamp and the bundle stamp from the copy's own files, in the formats the gate reads. */
function writeStamps(root: string, paths: StampPaths): void {
  const nativeStamp = path.join(root, 'dist', 'native', nativeStampFileName(triple()))
  fs.mkdirSync(path.dirname(nativeStamp), { recursive: true })
  fs.writeFileSync(nativeStamp, `${hashNativeInputs(root)}\n`)
  const digests = (base: string, rels: string[]) =>
    Object.fromEntries(rels.map(rel => [rel, digestFile(path.join(base, rel))]))
  const stamp = {
    inputs: digests(root, paths.inputs),
    outputs: digests(path.join(root, 'dist'), paths.outputs),
  }
  fs.writeFileSync(path.join(root, 'dist', BUNDLE_STAMP_FILE), `${JSON.stringify(stamp, null, 2)}\n`)
}

/**
 * A package root holding what the verdict reads: the native inputs the walk finds, the bundle inputs and outputs the
 * checkout's stamp lists (copied, or placeholders where a concurrent build has removed them), both stamps, and a
 * placeholder native binary.
 */
function copyOfCheckout(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-dist-copy-'))
  copies.push(root)
  const paths = bundlePaths()
  copyNativeInputs(PACKAGE_DIR, root)
  for (const rel of paths.inputs) copyFile(rel, root)
  for (const rel of paths.outputs) copyFile(path.join('dist', rel), root)
  writeStamps(root, paths)
  const binary = path.join(root, 'dist', 'native', nativeBinaryFileName(triple()))
  fs.writeFileSync(binary, 'placeholder: the gate reads the stamp, not the binary')
  return root
}

function appendTo(root: string, rel: string): void {
  fs.appendFileSync(path.join(root, rel), '\n// changed after the build\n')
}

describe('the dist freshness verdict', () => {
  it('passes on this checkout, whose dist a pnpm agentrs v run has just rebuilt', () => {
    expect(rsDistStaleness(PACKAGE_DIR)).toEqual([])
    expect(() => assertRsDistFresh(PACKAGE_DIR)).not.toThrow()
  })

  it('passes on a copy whose native stamp and bundle stamp both match their inputs', () => {
    expect(rsDistStaleness(copyOfCheckout())).toEqual([])
  })

  it('names a native addon that has no inputs stamp', () => {
    const root = copyOfCheckout()
    fs.rmSync(path.join(root, 'dist', 'native', nativeStampFileName(triple())))
    expect(rsDistStaleness(root).join('\n')).toContain('has no inputs stamp')
  })

  it('names a native addon whose Rust inputs changed after it was stamped', () => {
    const root = copyOfCheckout()
    appendTo(root, 'Cargo.toml')
    expect(rsDistStaleness(root).join('\n')).toContain('does not match current rust inputs')
  })

  it('names a bundle source that changed after the bundle was built', () => {
    const root = copyOfCheckout()
    appendTo(root, 'modules/atomic/js/index.ts')
    expect(rsDistStaleness(root)).toEqual(['modules/atomic/js/index.ts changed since the bundle was built'])
  })

  it('names a bundle output that was overwritten after the build', () => {
    const root = copyOfCheckout()
    appendTo(root, 'dist/atomic.mjs')
    expect(rsDistStaleness(root)).toEqual(['dist/atomic.mjs was overwritten after the bundle was built'])
  })

  it('names a dist with no bundle stamp', () => {
    const root = copyOfCheckout()
    fs.rmSync(path.join(root, 'dist', BUNDLE_STAMP_FILE))
    expect(rsDistStaleness(root)).toEqual([`no bundle inputs stamp at dist/${BUNDLE_STAMP_FILE}`])
  })

  it('throws one message that says what to run, and reuses the verdict within the process', () => {
    const root = copyOfCheckout()
    const source = path.join(root, 'modules/atomic/js/index.ts')
    const original = fs.readFileSync(source, 'utf8')
    appendTo(root, 'modules/atomic/js/index.ts')
    expect(() => assertRsDistFresh(root)).toThrow(
      /^reference-rs dist is stale: modules\/atomic\/js\/index\.ts changed since the bundle was built; run pnpm agentrs b \/ build:js$/,
    )
    fs.writeFileSync(source, original)
    expect(() => assertRsDistFresh(root)).toThrow('reference-rs dist is stale')
  })
})

/** Writes a marker for `root` that carries `reasons`, from the dist state read now, and points the env var at it. */
function stubMarkerFor(root: string, reasons: string[]): string {
  const marker: DistVerdictMarker = {
    version: 1,
    packageDir: root,
    state: readDistState(root),
    reasons,
  }
  const file = path.join(root, 'verdict.json')
  fs.writeFileSync(file, JSON.stringify(marker))
  vi.stubEnv(VERDICT_FILE_ENV, file)
  return file
}

describe('the cached verdict from the run marker', () => {
  it('uses the marker verdict for a dist that matches it, without recomputing', () => {
    const root = copyOfCheckout()
    // The copy is fresh, so a recomputation would pass. The sentinel can only surface from the marker.
    stubMarkerFor(root, ['SENTINEL: verdict read from the run marker'])
    expect(() => assertRsDistFresh(root)).toThrow('SENTINEL: verdict read from the run marker')
  })

  it('ignores a marker once the dist it was computed from has changed, and recomputes', () => {
    const root = copyOfCheckout()
    stubMarkerFor(root, ['SENTINEL: verdict read from the run marker'])
    fs.writeFileSync(path.join(root, 'dist', 'native', nativeStampFileName(triple())), `${'0'.repeat(64)}\n`)
    expect(() => assertRsDistFresh(root)).toThrow(/does not match current rust inputs/)
  })
})

/** A checkout with hashed and unhashed files, and a test-temp directory in modules/tasty that a test churns. */
function fixtureCheckout(): string {
  const root = emptyDir()
  const files: Record<string, string> = {
    'Cargo.toml': '[workspace]\n',
    'Cargo.lock': 'version = 4\n',
    'modules/tasty/Cargo.toml': '[package]\n',
    'modules/tasty/extra.rs': 'pub fn extra() {}\n',
    'modules/tasty/lib.rs': 'pub fn lib() {}\n',
    'modules/tasty/notes.ts': 'export {}\n',
    'modules/tasty/.scratch/cache.rs': 'pub fn cached() {}\n',
  }
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
    fs.writeFileSync(path.join(root, rel), text)
  }
  return root
}

function emptyDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-dist-walk-'))
  copies.push(dir)
  return dir
}

describe('the copy of the native inputs', () => {
  it('never enters a test-temp directory, even while a test creates and removes a Rust file in it', () => {
    const from = fixtureCheckout()
    const to = emptyDir()
    const visited: string[] = []
    copyNativeInputs(from, to, rel => {
      visited.push(rel)
      if (rel === 'modules/tasty/lib.rs') {
        const churn = path.join(from, 'modules/tasty/.scratch/churn.rs')
        fs.writeFileSync(churn, 'pub fn churn() {}\n')
        fs.rmSync(churn)
      }
    })
    expect(visited.filter(rel => rel.includes('.scratch'))).toEqual([])
    expect(fs.readFileSync(path.join(to, 'modules/tasty/lib.rs'), 'utf8')).toBe('pub fn lib() {}\n')
    expect(fs.existsSync(path.join(to, 'modules/tasty/.scratch'))).toBe(false)
    expect(fs.existsSync(path.join(to, 'modules/tasty/notes.ts'))).toBe(false)
  })

  it('leaves out an input that a concurrent edit removes after the walk lists it', () => {
    const from = fixtureCheckout()
    const to = emptyDir()
    copyNativeInputs(from, to, rel => {
      if (rel === 'modules/tasty/extra.rs') fs.rmSync(path.join(from, rel))
    })
    expect(fs.existsSync(path.join(to, 'modules/tasty/extra.rs'))).toBe(false)
    expect(fs.readFileSync(path.join(to, 'modules/tasty/lib.rs'), 'utf8')).toBe('pub fn lib() {}\n')
  })

  it('writes a placeholder for a bundle file that a build removed from the checkout', () => {
    const from = fixtureCheckout()
    const to = emptyDir()
    copyFile('dist/gone.mjs', to, from)
    expect(fs.readFileSync(path.join(to, 'dist/gone.mjs'), 'utf8')).toBe('placeholder for dist/gone.mjs\n')
  })
})
