/**
 * Tests for the dist freshness gate that runIsolated applies before it spawns. Each stale case copies the inputs the
 * verdict reads into a temporary package root, breaks exactly one of them, and checks that the reason names that part.
 * The copy writes its own native and bundle stamps from its own files, so it is fresh by construction even while other
 * work edits this checkout, and a stale verdict can only come from the change the case made. The native addon binary is
 * a placeholder in the copy: the gate reads its stamp, never the binary.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { assertRsDistFresh, rsDistStaleness } from './dist-freshness.js'
import {
  hashNativeInputs,
  nativeBinaryFileName,
  nativeStampFileName,
} from '../modules/runtime/js/shared/native-inputs.js'
import { getReferenceNativeTriple } from '../modules/runtime/js/shared/targets.js'
import { BUNDLE_STAMP_FILE, digestFile } from '../scripts/bundle-stamp.mjs'

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ROOT_FILES = ['Cargo.toml', 'Cargo.lock', 'package.json', 'tsconfig.json']
const ROOT_DIRS = ['contracts', 'scripts']
const copies: string[] = []

interface StampPaths {
  inputs: string[]
  outputs: string[]
}

afterAll(() => {
  for (const copy of copies) fs.rmSync(copy, { recursive: true, force: true })
})

/** The paths the checkout's bundle stamp covers. Only the paths are read; the copy computes its own digests. */
function bundlePaths(): StampPaths {
  const stamp = JSON.parse(fs.readFileSync(path.join(PACKAGE_DIR, 'dist', BUNDLE_STAMP_FILE), 'utf8')) as {
    inputs: Record<string, string>
    outputs: Record<string, string>
  }
  return { inputs: Object.keys(stamp.inputs), outputs: Object.keys(stamp.outputs) }
}

function copyFile(rel: string, root: string): void {
  const target = path.join(root, rel)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(path.join(PACKAGE_DIR, rel), target)
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
 * A package root holding what the verdict reads: every Cargo manifest and Rust source, the bundle inputs at the paths
 * the checkout's stamp lists, the bundle outputs, both stamps, and a placeholder native binary.
 */
function copyOfCheckout(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-dist-copy-'))
  copies.push(root)
  const paths = bundlePaths()
  const bundleInputs = new Set(paths.inputs)
  const isNeeded = (rel: string): boolean => /(^|\/)Cargo\.toml$|\.rs$/.test(rel) || bundleInputs.has(rel)
  // Symlinks are kept as links, dangling ones included: the native hash records a dangling link as a missing entry.
  fs.cpSync(path.join(PACKAGE_DIR, 'modules'), path.join(root, 'modules'), {
    recursive: true,
    filter: src => {
      const stat = fs.lstatSync(src)
      const rel = path.relative(PACKAGE_DIR, src).split(path.sep).join('/')
      return stat.isDirectory() || stat.isSymbolicLink() || isNeeded(rel)
    },
  })
  for (const file of ROOT_FILES) copyFile(file, root)
  for (const dir of ROOT_DIRS) fs.cpSync(path.join(PACKAGE_DIR, dir), path.join(root, dir), { recursive: true })
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
