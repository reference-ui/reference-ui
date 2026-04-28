import { randomUUID } from 'node:crypto'
import { CONSUMER_DIR_IN_CONTAINER } from '../../../../config.js'

export const matrixInstallCacheKeyEnvVar = 'REFERENCE_UI_MATRIX_INSTALL_CACHE_KEY'
export const matrixInstallCacheProbeEnvVar = 'REFERENCE_UI_DAGGER_UNCACHED_EXEC_PROBE'
export const matrixInstallCacheMarkerPath = `${CONSUMER_DIR_IN_CONTAINER}/node_modules/.reference-ui-install-cache-key`
export const matrixNodeModulesStatePath = `${CONSUMER_DIR_IN_CONTAINER}/node_modules/.modules.yaml`

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
      `[ -f "${matrixInstallCacheMarkerPath}" ]`,
      `&& [ -f "${matrixNodeModulesStatePath}" ]`,
      `&& [ "$(cat "${matrixInstallCacheMarkerPath}" 2>/dev/null)" = "$${matrixInstallCacheKeyEnvVar}" ]`,
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
      `printf '%s\\n' "$${matrixInstallCacheKeyEnvVar}" > "${matrixInstallCacheMarkerPath}"`,
    ].join(' && '),
  ]
}

export function withForcedUncachedExec<T extends EnvVariableTarget<T>>(
  target: T,
  scope: string,
): T {
  return target.withEnvVariable(matrixInstallCacheProbeEnvVar, `${scope}-${randomUUID()}`)
}

export async function hasWarmMatrixInstallCache<T extends ExecTarget<T>>(
  consumerBase: T,
  cacheKey: string,
  logPrefix: string,
): Promise<boolean> {
  const probeOutput = await withForcedUncachedExec(
    consumerBase.withEnvVariable(matrixInstallCacheKeyEnvVar, cacheKey),
    `${logPrefix}-install-cache-probe`,
  ).withExec(createWarmMatrixInstallCacheProbeCommand()).stdout()

  return probeOutput.trim() === 'warm'
}