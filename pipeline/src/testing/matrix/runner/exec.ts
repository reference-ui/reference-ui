/**
 * Execution helpers for matrix Dagger containers.
 *
 * The runner mostly wants one policy here: when the user disables Dagger exec
 * result caching, every relevant exec gets a fresh cache-busting env value.
 */

import { randomUUID } from 'node:crypto'
import type { MatrixRunOptions } from './types.js'

const daggerExecCacheBusterEnvVar = 'REFERENCE_UI_DAGGER_EXEC_CACHE_BUSTER'

export function withDaggerExecCacheBuster<T extends { withEnvVariable(name: string, value: string): T }>(
  target: T,
  options: MatrixRunOptions,
  scope: string,
): T {
  if (!options.disableDaggerExecCache) {
    return target
  }

  return target.withEnvVariable(daggerExecCacheBusterEnvVar, `${scope}-${randomUUID()}`)
}