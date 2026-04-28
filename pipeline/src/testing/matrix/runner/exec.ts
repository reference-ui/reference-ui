/**
 * Execution helpers for matrix Dagger containers.
 *
 * Matrix test runs intentionally force fresh Dagger exec for install/setup/test
 * commands. The useful reuse already comes from the pnpm store and warmed
 * node_modules caches.
 */

import { randomUUID } from 'node:crypto'
import { DISABLE_DAGGER_CACHE } from '../../../../config.js'

const daggerExecCacheBusterEnvVar = 'REFERENCE_UI_DAGGER_EXEC_CACHE_BUSTER'

export function withDaggerExecCacheBuster<T extends { withEnvVariable(name: string, value: string): T }>(
  target: T,
  scope: string,
): T {
  if (!DISABLE_DAGGER_CACHE) {
    return target
  }

  return target.withEnvVariable(daggerExecCacheBusterEnvVar, `${scope}-${randomUUID()}`)
}