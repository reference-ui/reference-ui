import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createHydrateMatrixInstallCacheFromSharedCommand,
  createMatrixInstallCommand,
  createPopulateSharedMatrixInstallCacheCommand,
  createWarmMatrixInstallCacheProbeCommand,
  createWarmSharedMatrixInstallCacheProbeCommand,
  hasWarmSharedMatrixInstallCache,
  hasWarmMatrixInstallCache,
} from './install.js'
import {
  MATRIX_INSTALL_CACHE_KEY_ENV_VAR,
  MATRIX_INSTALL_CACHE_MARKER_PATH,
  MATRIX_NODE_MODULES_STATE_PATH,
  MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR,
  MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH,
  MATRIX_SHARED_NODE_MODULES_PATH,
  MATRIX_SHARED_NODE_MODULES_STATE_PATH,
} from './constants.js'

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
        `[ -f "${MATRIX_INSTALL_CACHE_MARKER_PATH}" ]`,
        `&& [ -f "${MATRIX_NODE_MODULES_STATE_PATH}" ]`,
        `&& [ "$(cat "${MATRIX_INSTALL_CACHE_MARKER_PATH}" 2>/dev/null)" = "$${MATRIX_INSTALL_CACHE_KEY_ENV_VAR}" ]`,
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
        `printf '%s\\n' "$${MATRIX_INSTALL_CACHE_KEY_ENV_VAR}" > "${MATRIX_INSTALL_CACHE_MARKER_PATH}"`,
      ].join(' && '),
    ])
  })

  it('builds the warm shared install cache probe command from the shared node_modules state', () => {
    assert.deepEqual(createWarmSharedMatrixInstallCacheProbeCommand(), [
      'sh',
      '-lc',
      [
        `[ -f "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" ]`,
        `&& [ -f "${MATRIX_SHARED_NODE_MODULES_STATE_PATH}" ]`,
        `&& [ "$(cat "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" 2>/dev/null)" = "$${MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR}" ]`,
        `&& printf 'warm\\n'`,
        `|| printf 'cold\\n'`,
      ].join(' '),
    ])
  })

  it('builds the hydrate command that copies shared node_modules into the local cache', () => {
    assert.deepEqual(createHydrateMatrixInstallCacheFromSharedCommand(), [
      'sh',
      '-lc',
      [
        `[ -f "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" ]`,
        `&& [ -f "${MATRIX_SHARED_NODE_MODULES_STATE_PATH}" ]`,
        `&& [ "$(cat "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" 2>/dev/null)" = "$${MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR}" ]`,
        `&& mkdir -p "/consumer/node_modules"`,
        `&& cp -a "${MATRIX_SHARED_NODE_MODULES_PATH}/." "/consumer/node_modules/"`,
        `&& printf '%s\\n' "$${MATRIX_INSTALL_CACHE_KEY_ENV_VAR}" > "${MATRIX_INSTALL_CACHE_MARKER_PATH}"`,
        `&& printf 'hydrated\\n'`,
        `|| printf 'cold\\n'`,
      ].join(' '),
    ])
  })

  it('builds the shared cache population command from the local node_modules tree', () => {
    assert.deepEqual(createPopulateSharedMatrixInstallCacheCommand(), [
      'sh',
      '-lc',
      [
        'mkdir -p "/matrix-node-modules-shared"',
        'if mkdir "/matrix-node-modules-shared/.populate.lock" 2>/dev/null; then',
        "trap 'rmdir \"/matrix-node-modules-shared/.populate.lock\"' EXIT",
        `if [ ! -f "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" ] || [ ! -f "${MATRIX_SHARED_NODE_MODULES_STATE_PATH}" ] || [ "$(cat "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" 2>/dev/null)" != "$${MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR}" ]; then`,
        `rm -rf "${MATRIX_SHARED_NODE_MODULES_PATH}"`,
        `mkdir -p "${MATRIX_SHARED_NODE_MODULES_PATH}"`,
        `cp -a "/consumer/node_modules/." "${MATRIX_SHARED_NODE_MODULES_PATH}/"`,
        `printf '%s\\n' "$${MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR}" > "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}"`,
        'fi',
        'fi',
      ].join(' ; '),
    ])
  })

  it('detects a warm cache hit via the probe container', async () => {
    const target = new FakeProbeTarget('warm\n')

    const warm = await hasWarmMatrixInstallCache(target, 'cache-key-123', 'matrix-typescript')

    assert.equal(warm, true)
    assert.equal(target.envCalls[0]?.name, MATRIX_INSTALL_CACHE_KEY_ENV_VAR)
    assert.equal(target.envCalls[0]?.value, 'cache-key-123')
    assert.match(target.envCalls[1]?.value ?? '', /^matrix-typescript-install-cache-probe-/)
    assert.deepEqual(target.execArgs, createWarmMatrixInstallCacheProbeCommand())
  })

  it('treats non-warm probe output as a cold cache', async () => {
    const target = new FakeProbeTarget('cold\n')

    const warm = await hasWarmMatrixInstallCache(target, 'cache-key-123', 'matrix-typescript')

    assert.equal(warm, false)
  })

  it('detects a warm shared cache hit via the probe container', async () => {
    const target = new FakeProbeTarget('warm\n')

    const warm = await hasWarmSharedMatrixInstallCache(target, 'shared-cache-key-123', 'matrix-typescript')

    assert.equal(warm, true)
    assert.equal(target.envCalls[0]?.name, MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR)
    assert.equal(target.envCalls[0]?.value, 'shared-cache-key-123')
    assert.match(target.envCalls[1]?.value ?? '', /^matrix-typescript-shared-install-cache-probe-/)
    assert.deepEqual(target.execArgs, createWarmSharedMatrixInstallCacheProbeCommand())
  })
})