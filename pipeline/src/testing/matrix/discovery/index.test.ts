import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, it } from 'node:test'
import { repoRoot } from '../../../build/workspace.js'
import {
  getLatestMatrixBundlerStrategyForPrefix,
  getLatestMatrixReactRuntime,
  getMatrixPackageName,
  getPreferredLocalMatrixBundlers,
  isMatrixWorkspacePackageDir,
  readMatrixPackageConfig,
} from './index.js'

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
      await writeFile(join(tempDir, 'matrix.json'), '{"name":"typescript","refSync":{"mode":"full"},"bundlers":["vite7","webpack5"],"react":"react19","runTypecheck":true}\n')

      assert.deepEqual(readMatrixPackageConfig(tempDir), {
        name: 'typescript',
        refSync: {
          mode: 'full',
        },
        bundlers: ['vite7', 'webpack5'],
        react: 'react19',
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

  it('requires at least one explicit bundler in matrix.json', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ref-pipeline-matrix-'))

    try {
      await writeFile(join(tempDir, 'matrix.json'), '{"name":"typescript","refSync":{"mode":"full"},"bundlers":[]}\n')

      assert.throws(
        () => readMatrixPackageConfig(tempDir),
        /bundlers as a non-empty array/,
      )
    } finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })

  it('requires an explicit managed react runtime in matrix.json', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ref-pipeline-matrix-'))

    try {
      await writeFile(join(tempDir, 'matrix.json'), '{"name":"typescript","refSync":{"mode":"full"},"bundlers":["vite7"]}\n')

      assert.throws(
        () => readMatrixPackageConfig(tempDir),
        /react as one of "react19"/,
      )
    } finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })

  it('derives the managed matrix workspace package name from the matrix config name', () => {
    assert.equal(getMatrixPackageName({ name: 'typescript' }), '@matrix/typescript')
  })

  it('rejects unknown bundler strategies in matrix.json', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ref-pipeline-matrix-'))

    try {
      await writeFile(join(tempDir, 'matrix.json'), '{"name":"typescript","refSync":{"mode":"full"},"bundlers":["vite7","rspack1"],"react":"react19"}\n')

      assert.throws(
        () => readMatrixPackageConfig(tempDir),
        /known strategies \("vite7", "webpack5"\)/,
      )
    } finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })

  it('selects the latest Vite bundler from supported candidates', () => {
    assert.equal(getLatestMatrixBundlerStrategyForPrefix('vite', ['vite7', 'webpack5']), 'vite7')
    assert.equal(getLatestMatrixBundlerStrategyForPrefix('vite', ['webpack5']), null)
  })

  it('selects the latest supported React runtime from metadata', () => {
    assert.equal(getLatestMatrixReactRuntime(), 'react19')
  })

  it('prefers the latest Vite bundler for local matrix setup', () => {
    assert.deepEqual(getPreferredLocalMatrixBundlers(['vite7', 'webpack5']), ['vite7'])
    assert.deepEqual(getPreferredLocalMatrixBundlers(['webpack5']), ['webpack5'])
  })
})

describe('isMatrixWorkspacePackageDir', () => {
  it('returns true only for workspace packages under the top-level matrix directory', () => {
    assert.equal(isMatrixWorkspacePackageDir(resolve(repoRoot, 'matrix', 'distro')), true)
    assert.equal(isMatrixWorkspacePackageDir(resolve(repoRoot, 'matrix', 'playwright')), true)
    assert.equal(isMatrixWorkspacePackageDir(resolve(repoRoot, 'fixtures', 'extend-library')), false)
    assert.equal(isMatrixWorkspacePackageDir(resolve(repoRoot, 'packages', 'reference-core')), false)
  })
})