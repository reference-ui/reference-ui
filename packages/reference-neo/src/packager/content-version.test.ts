// Unit tests for the content-addressed versions of generated packages.
// They build small package trees in a temp dir and assert that a version is the base plus a hash of the package's own bytes, that equal bytes give equal versions, that the root manifest never feeds its own hash, and that stamping writes every generated manifest and rewrites identical bytes, and that a stamp still recomputes equal once sync's compile request and the tasty dir land after it.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { GENERATED_VERSION } from './constants.ts'
import { contentVersion, findStampMismatches, stampContentVersions } from './content-version.ts'
import { getPackageDir } from './layout.ts'
import { PACKAGES, SYSTEM_PACKAGE, TYPES_PACKAGE } from './packages.ts'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function makeDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'neo-content-version-'))
  tempDirs.push(dir)
  return dir
}

function writeTree(dir: string, files: Record<string, string>): void {
  for (const [rel, text] of Object.entries(files)) {
    const file = join(dir, rel)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, text)
  }
}

function readManifest(dir: string): { name: string; version: string } {
  return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8')) as { name: string; version: string }
}

describe('contentVersion', () => {
  it('is the base, a dot, and a short hash that keeps a letter, so the prerelease stays valid semver', () => {
    const dir = makeDir()
    writeTree(dir, { 'index.mjs': 'export const x = 1\n' })
    expect(contentVersion(GENERATED_VERSION, dir)).toMatch(/^0\.0\.0-neo\.(?=[0-9a-f]*[a-f])[0-9a-f]{12}$/)
  })

  it('is deterministic: equal bytes give the equal version', () => {
    const first = makeDir()
    const second = makeDir()
    const files = { 'index.mjs': 'export const x = 1\n', 'nested/index.d.mts': 'export type A = 1\n' }
    writeTree(first, files)
    writeTree(second, files)
    expect(contentVersion(GENERATED_VERSION, first)).toBe(contentVersion(GENERATED_VERSION, second))
  })

  it('moves when one byte of one file changes', () => {
    const dir = makeDir()
    writeTree(dir, { 'index.mjs': 'export const x = 1\n' })
    const before = contentVersion(GENERATED_VERSION, dir)
    writeFileSync(join(dir, 'index.mjs'), 'export const x = 2\n')
    expect(contentVersion(GENERATED_VERSION, dir)).not.toBe(before)
  })

  it('moves when a file is renamed, because the relative path is part of the hash', () => {
    const dir = makeDir()
    writeTree(dir, { 'a/index.mjs': 'export const x = 1\n' })
    const before = contentVersion(GENERATED_VERSION, dir)
    const renamed = makeDir()
    writeTree(renamed, { 'b/index.mjs': 'export const x = 1\n' })
    expect(contentVersion(GENERATED_VERSION, renamed)).not.toBe(before)
  })

  it('ignores the root package.json, so stamping cannot feed back into its own hash', () => {
    const dir = makeDir()
    writeTree(dir, { 'index.mjs': 'export const x = 1\n', 'package.json': '{"version":"a"}' })
    const before = contentVersion(GENERATED_VERSION, dir)
    writeFileSync(join(dir, 'package.json'), '{"version":"b"}')
    expect(contentVersion(GENERATED_VERSION, dir)).toBe(before)
  })

  it('gives a publisher and a consumer different versions when their declarations differ', () => {
    const publisher = makeDir()
    const consumer = makeDir()
    writeTree(publisher, { 'index.d.ts': 'export type StyleProps = { color?: string }\n' })
    writeTree(consumer, { 'index.d.ts': "export type StyleProps = { color?: 'brand' }\n" })
    expect(contentVersion(GENERATED_VERSION, publisher)).not.toBe(contentVersion(GENERATED_VERSION, consumer))
  })
})

describe('stampContentVersions', () => {
  it('writes each generated manifest with its own content version, and a second stamp rewrites the same bytes', () => {
    const outDir = makeDir()
    for (const pkg of PACKAGES) {
      writeTree(getPackageDir(outDir, pkg.name), {
        'index.d.mts': `export declare const name: ${JSON.stringify(pkg.name)}\n`,
        'package.json': '{}\n',
      })
    }
    stampContentVersions(outDir)
    const firstPass = PACKAGES.map((pkg) => readFileSync(join(getPackageDir(outDir, pkg.name), 'package.json'), 'utf-8'))
    for (const pkg of PACKAGES) {
      const dir = getPackageDir(outDir, pkg.name)
      const manifest = readManifest(dir)
      expect(manifest.name).toBe(pkg.name)
      expect(manifest.version).toBe(contentVersion(GENERATED_VERSION, dir))
    }
    stampContentVersions(outDir)
    const secondPass = PACKAGES.map((pkg) => readFileSync(join(getPackageDir(outDir, pkg.name), 'package.json'), 'utf-8'))
    expect(secondPass).toEqual(firstPass)
  })

  it('keeps every stamp equal to a recompute after the late entries other owners land', () => {
    const outDir = makeDir()
    for (const pkg of PACKAGES) {
      writeTree(getPackageDir(outDir, pkg.name), { 'index.mjs': `export const name = ${JSON.stringify(pkg.name)}\n` })
    }
    stampContentVersions(outDir)
    // Sync writes its compile request after assembly; the tasty phase lands its dir (and temps) later still.
    writeTree(getPackageDir(outDir, SYSTEM_PACKAGE.name), { 'compile-request.json': '{"root":"/abs/checkout"}\n' })
    writeTree(getPackageDir(outDir, TYPES_PACKAGE.name), {
      'tasty/manifest.js': 'export default {}\n',
      'tasty.tmp-123-abc/manifest.js': 'export default {}\n',
    })
    expect(findStampMismatches(outDir)).toEqual([])
  })

  it('still names a stamp whose shipped files changed after stamping', () => {
    const outDir = makeDir()
    for (const pkg of PACKAGES) {
      writeTree(getPackageDir(outDir, pkg.name), { 'index.mjs': 'export const x = 1\n' })
    }
    stampContentVersions(outDir)
    writeTree(getPackageDir(outDir, SYSTEM_PACKAGE.name), { 'evaluated-system.json': '{}\n' })
    expect(findStampMismatches(outDir).map((mismatch) => mismatch.name)).toEqual([SYSTEM_PACKAGE.name])
  })
})
