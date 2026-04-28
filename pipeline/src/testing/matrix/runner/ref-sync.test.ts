import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { describe, it } from 'node:test'
import type { MatrixPackageConfig } from '../discovery/index.js'
import {
  createMatrixRefSyncWatchCommand,
  matrixRefSyncPhasesEnvVar,
  matrixRefSyncSupportScripts,
  matrixRefSyncWaitReadyScriptRelativePath,
  matrixRefSyncWatchSessionScriptRelativePath,
  parseMatrixRefSyncWatchOutput,
  resolveMatrixRefSyncStrategy,
} from './ref-sync.js'

function createMatrixPackageConfig(
  name: string,
  mode: MatrixPackageConfig['refSync']['mode'],
  runTypecheck = false,
): MatrixPackageConfig {
  return {
    name,
    refSync: {
      mode,
    },
    bundlers: ['vite7'],
    runTypecheck,
  }
}

describe('matrix runner ref sync helpers', () => {
  it('keeps explicitly configured full-sync packages on full mode', () => {
    assert.deepEqual(resolveMatrixRefSyncStrategy(createMatrixPackageConfig('install', 'full')), {
      mode: 'full',
      runTypecheck: false,
    })
    assert.deepEqual(resolveMatrixRefSyncStrategy(createMatrixPackageConfig('mcp', 'full')), {
      mode: 'full',
      runTypecheck: false,
    })
    assert.deepEqual(resolveMatrixRefSyncStrategy(createMatrixPackageConfig('typescript', 'full', true)), {
      mode: 'full',
      runTypecheck: true,
    })
  })

  it('uses watch-ready sync when matrix.json opts into runtime-ready output', () => {
    assert.deepEqual(resolveMatrixRefSyncStrategy(createMatrixPackageConfig('playwright', 'watch-ready')), {
      mode: 'watch-ready',
      runTypecheck: false,
    })
  })

  it('creates a watch-backed runner command with cleanup and readiness wait', () => {
    const command = createMatrixRefSyncWatchCommand()

    assert.deepEqual(command, ['node', matrixRefSyncWatchSessionScriptRelativePath])
  })

  it('parses shared watch timing markers and strips them from command output', () => {
    assert.deepEqual(
      parseMatrixRefSyncWatchOutput([
        '[matrix ref sync] ready-duration-ms=2310',
        '',
        ' RUN  v4.1.5 /consumer',
        '[matrix ref sync] phase=test:vitest duration-ms=381',
        '  1 passed (826ms)',
        '[matrix ref sync] phase=test:playwright duration-ms=1174',
      ].join('\n')),
      {
        cleanedOutput: ['RUN  v4.1.5 /consumer', '  1 passed (826ms)'].join('\n'),
        phaseDurations: {
          'test:playwright': 1174,
          'test:vitest': 381,
        },
        readyDurationMs: 2310,
      },
    )
  })

  it('declares the staged ref sync support scripts explicitly', () => {
    assert.deepEqual(
      matrixRefSyncSupportScripts.map(script => script.outputRelativePath),
      [
        matrixRefSyncWaitReadyScriptRelativePath,
        matrixRefSyncWatchSessionScriptRelativePath,
      ],
    )

    for (const script of matrixRefSyncSupportScripts) {
      assert.equal(existsSync(script.sourceFilePath), true)
    }
  })

  it('exposes the shared watch session phases env var explicitly', () => {
    assert.equal(matrixRefSyncPhasesEnvVar, 'REFERENCE_UI_MATRIX_REF_SYNC_PHASES_JSON')
  })
})