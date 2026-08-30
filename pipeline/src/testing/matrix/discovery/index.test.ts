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
  parseMatrixReactRuntime,
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
        reactVersions: ['react19'],
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
        /refSync\.mode as "full", "watch-ready", or "watch-full"/,
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
        /react as "react17", "react18", "react19"/,
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

  it('accepts a react compatibility array and uses the first entry as the default runtime', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ref-pipeline-matrix-'))

    try {
      await writeFile(
        join(tempDir, 'matrix.json'),
        '{"name":"lib","refSync":{"mode":"watch-ready"},"bundlers":["vite7"],"react":["react19","react18","react17"]}\n',
      )

      assert.deepEqual(readMatrixPackageConfig(tempDir), {
        name: 'lib',
        refSync: {
          mode: 'watch-ready',
        },
        bundlers: ['vite7'],
        react: 'react19',
        reactVersions: ['react19', 'react18', 'react17'],
        runTypecheck: false,
      })
    } finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })

  it('keeps the first react array entry as default even when a newer runtime follows', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ref-pipeline-matrix-'))

    try {
      await writeFile(
        join(tempDir, 'matrix.json'),
        '{"name":"lib","refSync":{"mode":"watch-ready"},"bundlers":["vite7"],"react":["react18","react19"]}\n',
      )

      const config = readMatrixPackageConfig(tempDir)

      assert.equal(config?.react, 'react18')
      assert.deepEqual(config?.reactVersions, ['react18', 'react19'])
    } finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })

  it('parses CLI React runtime aliases', () => {
    assert.equal(parseMatrixReactRuntime('react19'), 'react19')
    assert.equal(parseMatrixReactRuntime('18'), 'react18')
    assert.throws(() => parseMatrixReactRuntime('react16'), /Unknown React runtime/)
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