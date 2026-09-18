/**
 * Unit tests for the native freshness gate and stamp writer.
 * Asserts stale or unstamped binaries fail closed while missing ones stay shippable-skipped.
 * Validates stamp portability across checkouts and the stamp-then-verify round trip.
 */
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { hashNativeInputs } from '../shared/native-inputs'
import {
  collectNativeFreshnessIssues,
  formatNativeFreshnessError,
  tripleForRustTarget,
  writeNativeStamp,
} from '../shared/native-freshness'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-native-freshness-'))
  createdDirs.push(dir)
  return dir
}

function createPackageFixture(): { packageDir: string; nativeDir: string } {
  const packageDir = createTempDir()
  const nativeDir = join(packageDir, 'dist', 'native')
  mkdirSync(join(packageDir, 'modules', 'demo'), { recursive: true })
  mkdirSync(nativeDir, { recursive: true })
  writeFileSync(join(packageDir, 'Cargo.toml'), '[workspace]\n', 'utf-8')
  writeFileSync(join(packageDir, 'Cargo.lock'), '# lock\n', 'utf-8')
  writeFileSync(join(packageDir, 'modules', 'demo', 'lib.rs'), 'pub fn x() {}\n', 'utf-8')
  return { packageDir, nativeDir }
}

function writeBinary(nativeDir: string, triple: string): void {
  writeFileSync(join(nativeDir, `virtual-native.${triple}.node`), 'fake-binary', 'utf-8')
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('tripleForRustTarget', () => {
  it('maps release rust targets to virtual-native triples', () => {
    expect(tripleForRustTarget('x86_64-unknown-linux-gnu')).toBe('linux-x64-gnu')
    expect(tripleForRustTarget('aarch64-apple-darwin')).toBe('darwin-arm64')
    expect(tripleForRustTarget('x86_64-apple-darwin')).toBe('darwin-x64')
    expect(tripleForRustTarget('x86_64-pc-windows-msvc')).toBe('win32-x64-msvc')
    expect(tripleForRustTarget('wasm32-unknown-unknown')).toBeNull()
  })
})

describe('hashNativeInputs', () => {
  it('produces identical hashes for identical trees at different absolute paths', () => {
    const first = createPackageFixture()
    const secondRoot = createTempDir()
    cpSync(first.packageDir, join(secondRoot, 'pkg'), { recursive: true })
    const second = join(secondRoot, 'pkg')

    expect(hashNativeInputs(second)).toBe(hashNativeInputs(first.packageDir))
  })

  it('changes the hash when rust input content changes', () => {
    const { packageDir } = createPackageFixture()
    const before = hashNativeInputs(packageDir)
    writeFileSync(
      join(packageDir, 'modules', 'demo', 'lib.rs'),
      'pub fn y() {}\n',
      'utf-8'
    )

    expect(hashNativeInputs(packageDir)).not.toBe(before)
  })

  it('ignores volatile non-rust files so test outputs cannot churn stamps', () => {
    const { packageDir } = createPackageFixture()
    const before = hashNativeInputs(packageDir)
    mkdirSync(join(packageDir, 'modules', 'demo', 'node_modules', 'dep'), {
      recursive: true,
    })
    writeFileSync(join(packageDir, 'modules', 'demo', 'output.json'), '{}\n', 'utf-8')
    writeFileSync(
      join(packageDir, 'modules', 'demo', 'node_modules', 'dep', 'x.js'),
      'x\n',
      'utf-8'
    )

    expect(hashNativeInputs(packageDir)).toBe(before)
  })

  it('changes the hash when a crate manifest changes', () => {
    const { packageDir } = createPackageFixture()
    const before = hashNativeInputs(packageDir)
    writeFileSync(
      join(packageDir, 'modules', 'demo', 'Cargo.toml'),
      '[package]\n',
      'utf-8'
    )

    expect(hashNativeInputs(packageDir)).not.toBe(before)
  })
})

describe('collectNativeFreshnessIssues', () => {
  it('verifies binaries whose stamps match the current inputs hash', () => {
    const { packageDir, nativeDir } = createPackageFixture()
    writeBinary(nativeDir, 'linux-x64-gnu')
    writeNativeStamp({
      nativeDirPath: nativeDir,
      packageDirPath: packageDir,
      triple: 'linux-x64-gnu',
    })

    const report = collectNativeFreshnessIssues({
      nativeDirPath: nativeDir,
      rustTargets: ['x86_64-unknown-linux-gnu'],
      currentHash: hashNativeInputs(packageDir),
    })

    expect(report.issues).toEqual([])
    expect(report.verified).toEqual(['linux-x64-gnu'])
    expect(report.missing).toEqual([])
  })

  it('flags present binaries without stamps as missing-stamp issues', () => {
    const { packageDir, nativeDir } = createPackageFixture()
    writeBinary(nativeDir, 'linux-x64-gnu')

    const report = collectNativeFreshnessIssues({
      nativeDirPath: nativeDir,
      rustTargets: ['x86_64-unknown-linux-gnu'],
      currentHash: hashNativeInputs(packageDir),
    })

    expect(report.issues).toHaveLength(1)
    expect(report.issues[0]).toMatchObject({
      triple: 'linux-x64-gnu',
      kind: 'missing-stamp',
    })
    expect(report.verified).toEqual([])
  })

  it('flags binaries whose stamps predate the current inputs as stale-binary issues', () => {
    const { packageDir, nativeDir } = createPackageFixture()
    writeBinary(nativeDir, 'linux-x64-gnu')
    writeNativeStamp({
      nativeDirPath: nativeDir,
      packageDirPath: packageDir,
      triple: 'linux-x64-gnu',
    })
    writeFileSync(
      join(packageDir, 'modules', 'demo', 'lib.rs'),
      'pub fn y() {}\n',
      'utf-8'
    )

    const report = collectNativeFreshnessIssues({
      nativeDirPath: nativeDir,
      rustTargets: ['x86_64-unknown-linux-gnu'],
      currentHash: hashNativeInputs(packageDir),
    })

    expect(report.issues).toHaveLength(1)
    expect(report.issues[0]).toMatchObject({
      triple: 'linux-x64-gnu',
      kind: 'stale-binary',
    })
    expect(report.verified).toEqual([])
  })

  it('skips absent binaries as missing without failing the gate', () => {
    const { packageDir, nativeDir } = createPackageFixture()

    const report = collectNativeFreshnessIssues({
      nativeDirPath: nativeDir,
      rustTargets: ['x86_64-unknown-linux-gnu', 'x86_64-pc-windows-msvc'],
      currentHash: hashNativeInputs(packageDir),
    })

    expect(report.issues).toEqual([])
    expect(report.missing).toEqual(['linux-x64-gnu', 'win32-x64-msvc'])
  })

  it('flags unknown release targets instead of silently ignoring them', () => {
    const { packageDir, nativeDir } = createPackageFixture()

    const report = collectNativeFreshnessIssues({
      nativeDirPath: nativeDir,
      rustTargets: ['wasm32-unknown-unknown'],
      currentHash: hashNativeInputs(packageDir),
    })

    expect(report.issues).toHaveLength(1)
    expect(report.issues[0]).toMatchObject({
      triple: 'wasm32-unknown-unknown',
      kind: 'unknown-target',
    })
  })

  it('formats failures as a refusing-to-pack error naming each triple', () => {
    const message = formatNativeFreshnessError({
      verified: [],
      missing: [],
      issues: [{ triple: 'linux-x64-gnu', kind: 'stale-binary', detail: 'is old' }],
    })

    expect(message).toContain('Refusing to pack @reference-ui/rust')
    expect(message).toContain('linux-x64-gnu: is old')
  })
})

describe('writeNativeStamp', () => {
  it('records a stamp the gate accepts for the current inputs', () => {
    const { packageDir, nativeDir } = createPackageFixture()
    writeBinary(nativeDir, 'darwin-x64')

    const stampPath = writeNativeStamp({
      nativeDirPath: nativeDir,
      packageDirPath: packageDir,
      triple: 'darwin-x64',
    })

    expect(readFileSync(stampPath, 'utf8').trim()).toBe(hashNativeInputs(packageDir))
  })

  it('refuses unknown triples and missing binaries', () => {
    const { packageDir, nativeDir } = createPackageFixture()

    expect(() =>
      writeNativeStamp({
        nativeDirPath: nativeDir,
        packageDirPath: packageDir,
        triple: 'wasm32',
      })
    ).toThrow('unknown native triple')
    expect(() =>
      writeNativeStamp({
        nativeDirPath: nativeDir,
        packageDirPath: packageDir,
        triple: 'linux-x64-gnu',
      })
    ).toThrow('missing binary')
  })
})
