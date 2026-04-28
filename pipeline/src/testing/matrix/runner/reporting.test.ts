import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  describeMatrixEnvironment,
  appendOutputBlock,
  collectMatrixFailureDetails,
  createAbortedMatrixPackageResult,
  formatRuntimeMemory,
  normalizeCapturedOutput,
} from './reporting.js'
import type { MatrixPackageRunContext } from './types.js'

function createPackageRunContext(): MatrixPackageRunContext {
  return {
    config: {
      name: 'distro',
      refSync: {
        mode: 'full',
      },
      bundlers: ['vite7'],
      react: 'react19',
      runTypecheck: true,
    },
    displayName: '@matrix/distro',
    logPrefix: 'matrix-distro',
    source: {
      fixturePackageJson: {
        name: '@matrix/distro',
      },
      hasPlaywrightTests: false,
      hasVitestTests: true,
    },
    workspacePackage: {
      dependencies: {},
      dir: '/tmp/matrix-typescript',
      name: '@matrix/typescript',
      private: true,
      scripts: {},
      version: '0.0.0-test',
    },
  }
}

describe('matrix runner reporting helpers', () => {
  it('formats runtime memory in GiB', () => {
    assert.equal(formatRuntimeMemory(null), null)
    assert.equal(formatRuntimeMemory(24 * 1024 ** 3), '24.0 GiB')
  })

  it('describes the managed matrix environment succinctly', () => {
    assert.equal(describeMatrixEnvironment(createPackageRunContext()), 'react19 + vite7 + full-sync')
  })

  it('collects stdout and stderr failure sections', () => {
    assert.deepEqual(
      collectMatrixFailureDetails({
        stdout: Buffer.from('stdout line\n'),
        stderr: 'stderr line\n',
      }),
      [
        '  matrix stdout:\nstdout line',
        '  matrix stderr:\nstderr line',
      ],
    )
  })

  it('appends output blocks only when there is trimmed output', () => {
    const lines = ['heading']
    appendOutputBlock(lines, '  \n')
    appendOutputBlock(lines, 'hello\nworld\n')

    assert.deepEqual(lines, ['heading', '', 'hello\nworld'])
  })

  it('normalizes carriage-return-heavy captured output', () => {
    assert.equal(
      normalizeCapturedOutput('line 1\rprogress\r\n\r\nline 2\n\n\nline 3\n'),
      'line 1\nprogress\n\nline 2\n\nline 3',
    )
  })

  it('creates an aborted package result without extra timing noise', () => {
    const result = createAbortedMatrixPackageResult(['@matrix/distro'], 'setup')

    assert.equal(result.failed, false)
    assert.match(result.output, /Aborted before setup after another matrix package failed\./)
  })
})