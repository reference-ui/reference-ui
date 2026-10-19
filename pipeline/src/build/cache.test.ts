/**
 * Unit tests for build input hashing.
 *
 * Covers missing tracked files and symlink targets so fingerprint skips stay deterministic.
 */
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { describe, it } from 'node:test'

import { hashPackageInputFiles } from './cache.js'

describe('hashPackageInputFiles', () => {
  it('does not crash when a tracked input file is missing and hashes that state deterministically', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'reference-ui-build-cache-'))
    const packageJsonPath = resolve(rootDir, 'packages/reference-core/package.json')
    mkdirSync(resolve(rootDir, 'packages/reference-core'), { recursive: true })
    writeFileSync(packageJsonPath, '{"name":"@reference-ui/core"}\n', 'utf8')

    const existingInputs = [
      relative(rootDir, packageJsonPath),
    ]
    const withMissingInputs = [
      ...existingInputs,
      'packages/reference-core/src/packager/ts/compile/find-dts.ts',
    ]

    const existingHash = hashPackageInputFiles({
      packageName: '@reference-ui/core',
      packageVersion: '0.0.22',
      rootDir,
      hashInputs: existingInputs,
    })

    const missingHash = hashPackageInputFiles({
      packageName: '@reference-ui/core',
      packageVersion: '0.0.22',
      rootDir,
      hashInputs: withMissingInputs,
    })

    assert.match(existingHash, /^[a-f0-9]{64}$/)
    assert.match(missingHash, /^[a-f0-9]{64}$/)
    assert.notEqual(existingHash, missingHash)
  })

  it('hashes a tracked symlink to a directory, or one that points nowhere, by its target', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'reference-ui-build-cache-'))
    const caseDir = 'packages/reference-rs/cases/ATM-X/input'
    mkdirSync(resolve(rootDir, caseDir, 'packages/panel'), { recursive: true })
    mkdirSync(resolve(rootDir, caseDir, 'node_modules/@acme'), { recursive: true })
    symlinkSync('../../packages/panel', resolve(rootDir, caseDir, 'node_modules/@acme/panel'))
    symlinkSync('../../.reference-ui/react', resolve(rootDir, caseDir, 'node_modules/@acme/runtime'))
    const hashOf = (hashInputs: string[]) =>
      hashPackageInputFiles({
        packageName: '@reference-ui/rust',
        packageVersion: '0.0.42',
        rootDir,
        hashInputs,
      })

    const linked = hashOf([`${caseDir}/node_modules/@acme/panel`, `${caseDir}/node_modules/@acme/runtime`])
    assert.match(linked, /^[a-f0-9]{64}$/)
    assert.equal(linked, hashOf([`${caseDir}/node_modules/@acme/panel`, `${caseDir}/node_modules/@acme/runtime`]))
    assert.notEqual(linked, hashOf([`${caseDir}/node_modules/@acme/panel`]))
  })
})