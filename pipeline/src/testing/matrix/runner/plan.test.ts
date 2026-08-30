import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { MatrixWorkspacePackage } from '../discovery/index.js'
import {
  planMatrixExecution,
  planMatrixJobs,
  resolveJobBundlers,
  resolveJobReactRuntimes,
} from './plan.js'

function createMultiReactPackage(): MatrixWorkspacePackage {
  return {
    config: {
      name: 'lib',
      refSync: { mode: 'watch-ready' },
      bundlers: ['vite7'],
      react: 'react19',
      reactVersions: ['react19', 'react18', 'react17'],
      runTypecheck: false,
    },
    configPath: '/tmp/matrix/lib/matrix.json',
    workspacePackage: {
      dependencies: {},
      dir: '/tmp/matrix/lib',
      name: '@matrix/lib',
      private: true,
      scripts: { test: 'pipeline' },
      version: '0.0.1',
    },
  }
}

function createCorePackage(): MatrixWorkspacePackage {
  return {
    config: {
      name: 'tokens',
      refSync: { mode: 'full' },
      bundlers: ['vite7', 'webpack5'],
      react: 'react19',
      reactVersions: ['react19'],
      runTypecheck: false,
    },
    configPath: '/tmp/matrix/tokens/matrix.json',
    workspacePackage: {
      dependencies: {},
      dir: '/tmp/matrix/tokens',
      name: '@matrix/tokens',
      private: true,
      scripts: { test: 'pipeline' },
      version: '0.0.1',
    },
  }
}

function jobKeys(jobs: ReturnType<typeof planMatrixJobs>) {
  return jobs.map(job => ({
    bundlers: [...job.bundlers],
    name: job.package.workspacePackage.name,
    react: job.reactRuntime,
  }))
}

describe('matrix execution plan', () => {
  it('uses the first declared React and the preferred bundler by default', () => {
    const lib = createMultiReactPackage()
    const tokens = createCorePackage()

    assert.deepEqual(resolveJobReactRuntimes(lib, {}), ['react19'])
    assert.deepEqual(resolveJobBundlers(lib, {}), ['vite7'])
    assert.deepEqual(resolveJobBundlers(tokens, {}), ['vite7'])
    assert.deepEqual(
      jobKeys(planMatrixJobs([lib, tokens])),
      [
        { bundlers: ['vite7'], name: '@matrix/lib', react: 'react19' },
        { bundlers: ['vite7'], name: '@matrix/tokens', react: 'react19' },
      ],
    )
  })

  it('pins --react without expanding other declared runtimes', () => {
    const lib = createMultiReactPackage()

    assert.deepEqual(resolveJobReactRuntimes(lib, { react: 'react17' }), ['react17'])
    assert.deepEqual(
      jobKeys(planMatrixJobs([lib], { react: 'react17' })),
      [{ bundlers: ['vite7'], name: '@matrix/lib', react: 'react17' }],
    )
  })

  it('rejects --react when the selected package does not declare that runtime', () => {
    assert.throws(
      () => resolveJobReactRuntimes(createCorePackage(), { react: 'react18' }),
      /does not declare React runtime react18/,
    )
  })

  it('expands declared React and bundlers on --full', () => {
    const lib = createMultiReactPackage()
    const tokens = createCorePackage()

    assert.deepEqual(
      resolveJobReactRuntimes(lib, { full: true }),
      ['react19', 'react18', 'react17'],
    )
    assert.deepEqual(resolveJobBundlers(tokens, { full: true }), ['vite7', 'webpack5'])
    assert.deepEqual(
      jobKeys(planMatrixJobs([lib, tokens], { full: true })),
      [
        { bundlers: ['vite7'], name: '@matrix/lib', react: 'react19' },
        { bundlers: ['vite7'], name: '@matrix/lib', react: 'react18' },
        { bundlers: ['vite7'], name: '@matrix/lib', react: 'react17' },
        { bundlers: ['vite7', 'webpack5'], name: '@matrix/tokens', react: 'react19' },
      ],
    )
  })

  it('lets --react pin a runtime while --full still expands bundlers', () => {
    const tokens = createCorePackage()

    assert.deepEqual(
      jobKeys(planMatrixJobs([tokens], { full: true, react: 'react19' })),
      [{ bundlers: ['vite7', 'webpack5'], name: '@matrix/tokens', react: 'react19' }],
    )
  })

  it('includes every matrix package in the default pipeline fanout', () => {
    const names = planMatrixExecution().jobs.map(job => job.package.workspacePackage.name)

    assert.equal(names.includes('@matrix/lib'), true)
    assert.equal(names.includes('@matrix/tokens'), true)
  })

  it('plans one job per selected package and React runtime', () => {
    const plan = planMatrixExecution({ packageNames: ['@matrix/lib'], react: 'react17' })

    assert.deepEqual(
      jobKeys(plan.jobs),
      [{ bundlers: ['vite7'], name: '@matrix/lib', react: 'react17' }],
    )
  })
})
