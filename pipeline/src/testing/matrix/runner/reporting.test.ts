import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import {
  appendOutputBlock,
  collectMatrixFailureDetails,
  createAbortedMatrixPackageResult,
  formatPhaseTimingSummary,
  formatRuntimeMemory,
} from './reporting.js'
import type { MatrixPackageRunContext } from './types.js'

function createPackageRunContext(): MatrixPackageRunContext {
  return {
    config: {
      name: 'distro',
      refSync: {
        mode: 'full',
      },
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

  it('formats phase timing summaries in execution order', () => {
    assert.equal(
      formatPhaseTimingSummary(
        {
          install: 352,
          setup: 5_800,
          'test:vitest': 827,
        },
        8_979,
      ),
      'install=352ms, setup=5.8s, test:vitest=827ms, total=9.0s',
    )
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

  it('creates an aborted package result with timing summary', () => {
    const packageRunContext = createPackageRunContext()
    const consoleLog = mock.method(console, 'log', () => {})
    const now = mock.method(Date, 'now', () => 4_200)

    try {
      const result = createAbortedMatrixPackageResult(
        packageRunContext,
        ['@matrix/distro'],
        { install: 352 },
        1_000,
        'setup',
      )

      assert.equal(result.failed, false)
      assert.match(result.output, /Aborted before setup after another matrix package failed\./)
      assert.match(result.output, /Timings so far: install=352ms, total=3\.2s/)
      assert.equal(consoleLog.mock.calls.length, 1)
    } finally {
      consoleLog.mock.restore()
      now.mock.restore()
    }
  })
})