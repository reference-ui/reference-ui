import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
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
})