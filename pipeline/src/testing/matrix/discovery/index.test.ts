import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, it } from 'node:test'
import { repoRoot } from '../../../build/workspace.js'
import { getMatrixPackageName, isMatrixWorkspacePackageDir, readMatrixPackageConfig } from './index.js'

describe('readMatrixPackageConfig', () => {
  it('returns null when a package has no matrix.json', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ref-pipeline-matrix-'))

    try {
      assert.equal(readMatrixPackageConfig(tempDir), null)
    } finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })

  it('returns a config when matrix.json declares matrix true', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ref-pipeline-matrix-'))

    try {
      await writeFile(join(tempDir, 'matrix.json'), '{"name":"typescript","refSync":{"mode":"full"},"runTypecheck":true}\n')

      assert.deepEqual(readMatrixPackageConfig(tempDir), {
        name: 'typescript',
        refSync: {
          mode: 'full',
        },
        runTypecheck: true,
      })
    } finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })

  it('requires an explicit refSync mode in matrix.json', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ref-pipeline-matrix-'))

    try {
      await writeFile(join(tempDir, 'matrix.json'), '{"name":"typescript"}\n')

      assert.throws(
        () => readMatrixPackageConfig(tempDir),
        /refSync\.mode as "full" or "watch-ready"/,
      )
    } finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })

  it('derives the managed matrix workspace package name from the matrix config name', () => {
    assert.equal(getMatrixPackageName({ name: 'typescript' }), '@matrix/typescript')
  })
})

describe('isMatrixWorkspacePackageDir', () => {
  it('returns true only for workspace packages under the top-level matrix directory', () => {
    assert.equal(isMatrixWorkspacePackageDir(resolve(repoRoot, 'matrix', 'install')), true)
    assert.equal(isMatrixWorkspacePackageDir(resolve(repoRoot, 'matrix', 'typescript')), true)
    assert.equal(isMatrixWorkspacePackageDir(resolve(repoRoot, 'fixtures', 'extend-library')), false)
    assert.equal(isMatrixWorkspacePackageDir(resolve(repoRoot, 'packages', 'reference-core')), false)
  })
})