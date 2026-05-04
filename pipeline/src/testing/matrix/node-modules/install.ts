import { randomUUID } from 'node:crypto'
import {
  MATRIX_INSTALL_CACHE_KEY_ENV_VAR,
  MATRIX_INSTALL_CACHE_MARKER_PATH,
  MATRIX_INSTALL_CACHE_PROBE_ENV_VAR,
  MATRIX_NODE_MODULES_STATE_PATH,
  MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR,
  MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH,
  MATRIX_SHARED_NODE_MODULES_PATH,
  MATRIX_SHARED_NODE_MODULES_ROOT_PATH,
  MATRIX_SHARED_NODE_MODULES_STATE_PATH,
} from './constants.js'

interface EnvVariableTarget<T> {
  withEnvVariable(name: string, value: string): T
}

interface ExecTarget<T> extends EnvVariableTarget<T> {
  withExec(args: string[]): {
    stdout(): Promise<string>
  }
}

export function createWarmMatrixInstallCacheProbeCommand(): string[] {
  return [
    'sh',
    '-lc',
    [
      `[ -f "${MATRIX_INSTALL_CACHE_MARKER_PATH}" ]`,
      `&& [ -f "${MATRIX_NODE_MODULES_STATE_PATH}" ]`,
      `&& [ "$(cat "${MATRIX_INSTALL_CACHE_MARKER_PATH}" 2>/dev/null)" = "$${MATRIX_INSTALL_CACHE_KEY_ENV_VAR}" ]`,
      `&& printf 'warm\\n'`,
      `|| printf 'cold\\n'`,
    ].join(' '),
  ]
}

export function createWarmSharedMatrixInstallCacheProbeCommand(): string[] {
  return [
    'sh',
    '-lc',
    [
      `[ -f "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" ]`,
      `&& [ -f "${MATRIX_SHARED_NODE_MODULES_STATE_PATH}" ]`,
      `&& [ "$(cat "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" 2>/dev/null)" = "$${MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR}" ]`,
      `&& printf 'warm\\n'`,
      `|| printf 'cold\\n'`,
    ].join(' '),
  ]
}

export function createMatrixInstallCommand(registryUrl: string): string[] {
  return [
    'sh',
    '-lc',
    [
      `pnpm install --reporter append-only --registry ${registryUrl}`,
      `printf '%s\\n' "$${MATRIX_INSTALL_CACHE_KEY_ENV_VAR}" > "${MATRIX_INSTALL_CACHE_MARKER_PATH}"`,
    ].join(' && '),
  ]
}

export function createHydrateMatrixInstallCacheFromSharedCommand(): string[] {
  return [
    'sh',
    '-lc',
    [
      `[ -f "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" ]`,
      `&& [ -f "${MATRIX_SHARED_NODE_MODULES_STATE_PATH}" ]`,
      `&& [ "$(cat "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" 2>/dev/null)" = "$${MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR}" ]`,
      '&& mkdir -p "/consumer/node_modules"',
      `&& cp -a "${MATRIX_SHARED_NODE_MODULES_PATH}/." "/consumer/node_modules/"`,
      `&& printf '%s\\n' "$${MATRIX_INSTALL_CACHE_KEY_ENV_VAR}" > "${MATRIX_INSTALL_CACHE_MARKER_PATH}"`,
      `&& printf 'hydrated\\n'`,
      `|| printf 'cold\\n'`,
    ].join(' '),
  ]
}

export function createPopulateSharedMatrixInstallCacheCommand(): string[] {
  return [
    'sh',
    '-lc',
    [
      `mkdir -p "${MATRIX_SHARED_NODE_MODULES_ROOT_PATH}"`,
      `if mkdir "${MATRIX_SHARED_NODE_MODULES_ROOT_PATH}/.populate.lock" 2>/dev/null; then`,
      `trap 'rmdir "${MATRIX_SHARED_NODE_MODULES_ROOT_PATH}/.populate.lock"' EXIT`,
      `if [ ! -f "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" ] || [ ! -f "${MATRIX_SHARED_NODE_MODULES_STATE_PATH}" ] || [ "$(cat "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}" 2>/dev/null)" != "$${MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR}" ]; then`,
      `rm -rf "${MATRIX_SHARED_NODE_MODULES_PATH}"`,
      `mkdir -p "${MATRIX_SHARED_NODE_MODULES_PATH}"`,
      `cp -a "/consumer/node_modules/." "${MATRIX_SHARED_NODE_MODULES_PATH}/"`,
      `printf '%s\\n' "$${MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR}" > "${MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH}"`,
      'fi',
      'fi',
    ].join(' ; '),
  ]
}

export function withForcedUncachedExec<T extends EnvVariableTarget<T>>(
  target: T,
  scope: string,
): T {
  return target.withEnvVariable(MATRIX_INSTALL_CACHE_PROBE_ENV_VAR, `${scope}-${randomUUID()}`)
}

export async function hasWarmMatrixInstallCache<T extends ExecTarget<T>>(
  consumerBase: T,
  cacheKey: string,
  logPrefix: string,
): Promise<boolean> {
  const probeOutput = await withForcedUncachedExec(
    consumerBase.withEnvVariable(MATRIX_INSTALL_CACHE_KEY_ENV_VAR, cacheKey),
    `${logPrefix}-install-cache-probe`,
  ).withExec(createWarmMatrixInstallCacheProbeCommand()).stdout()

  return probeOutput.trim() === 'warm'
}

export async function hasWarmSharedMatrixInstallCache<T extends ExecTarget<T>>(
  consumerBase: T,
  cacheKey: string,
  logPrefix: string,
): Promise<boolean> {
  const probeOutput = await withForcedUncachedExec(
    consumerBase.withEnvVariable(MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR, cacheKey),
    `${logPrefix}-shared-install-cache-probe`,
  ).withExec(createWarmSharedMatrixInstallCacheProbeCommand()).stdout()

  return probeOutput.trim() === 'warm'
}