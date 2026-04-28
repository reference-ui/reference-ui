import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createMatrixInstallCommand,
  createWarmMatrixInstallCacheProbeCommand,
  hasWarmMatrixInstallCache,
  matrixInstallCacheKeyEnvVar,
  matrixInstallCacheMarkerPath,
  matrixNodeModulesStatePath,
} from './install.js'

class FakeProbeTarget {
  readonly envCalls: Array<{ name: string; value: string }> = []
  execArgs: string[] | undefined

  constructor(private readonly stdoutValue: string) {}

  withEnvVariable(name: string, value: string): this {
    this.envCalls.push({ name, value })
    return this
  }

  withExec(args: string[]) {
    this.execArgs = args

    return {
      stdout: async () => this.stdoutValue,
    }
  }
}

describe('matrix node_modules install helpers', () => {
  it('builds the warm install cache probe command from node_modules state', () => {
    assert.deepEqual(createWarmMatrixInstallCacheProbeCommand(), [
      'sh',
      '-lc',
      [
        `[ -f "${matrixInstallCacheMarkerPath}" ]`,
        `&& [ -f "${matrixNodeModulesStatePath}" ]`,
        `&& [ "$(cat "${matrixInstallCacheMarkerPath}" 2>/dev/null)" = "$${matrixInstallCacheKeyEnvVar}" ]`,
        `&& printf 'warm\\n'`,
        `|| printf 'cold\\n'`,
      ].join(' '),
    ])
  })

  it('builds the install command that refreshes the cache marker', () => {
    assert.deepEqual(createMatrixInstallCommand('http://registry:4873'), [
      'sh',
      '-lc',
      [
        'pnpm install --reporter append-only --registry http://registry:4873',
        `printf '%s\\n' "$${matrixInstallCacheKeyEnvVar}" > "${matrixInstallCacheMarkerPath}"`,
      ].join(' && '),
    ])
  })

  it('detects a warm cache hit via the probe container', async () => {
    const target = new FakeProbeTarget('warm\n')

    const warm = await hasWarmMatrixInstallCache(target, 'cache-key-123', 'matrix-typescript')

    assert.equal(warm, true)
    assert.equal(target.envCalls[0]?.name, matrixInstallCacheKeyEnvVar)
    assert.equal(target.envCalls[0]?.value, 'cache-key-123')
    assert.match(target.envCalls[1]?.value ?? '', /^matrix-typescript-install-cache-probe-/)
    assert.deepEqual(target.execArgs, createWarmMatrixInstallCacheProbeCommand())
  })

  it('treats non-warm probe output as a cold cache', async () => {
    const target = new FakeProbeTarget('cold\n')

    const warm = await hasWarmMatrixInstallCache(target, 'cache-key-123', 'matrix-typescript')

    assert.equal(warm, false)
  })
})