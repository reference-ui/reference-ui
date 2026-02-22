import { log } from '../lib/log'
import { runWorker } from '../thread-pool'
import { runColdBuild } from './cold-build'
import type { TsPackagerWorkerPayload } from './types'
import type { ReferenceUIConfig } from '../config'
import { PACKAGES } from '../packager/packages'

/**
 * Main entry - runs cold build (one-shot) for TypeScript declaration generation.
 */
export async function runTsPackager(payload: TsPackagerWorkerPayload): Promise<void> {
  const { cwd, config, packages } = payload

  log('')
  log('🔷 Generating TypeScript declarations...')
  log('')

  try {
    await runColdBuild(cwd, packages, config)
    log('')
  } catch (error) {
    log('[packager-ts] Error:', error)
    throw error
  }
}

/**
 * Initialize packager-ts from main thread.
 * Runs after packager; generates .d.ts from TypeScript SOURCE (not bundled .js)
 * so we preserve proper types like PrimitiveProps<T>, BoxProps, etc.
 */
export async function initTsPackager(
  cwd: string,
  config: ReferenceUIConfig
): Promise<void> {
  const packages = PACKAGES.filter(p => p.entry).map(p => ({
    name: p.name,
    sourceEntry: p.entry!,
    outFile: (p.main || './index.js').replace('./', ''),
  }))

  await runWorker('packager-ts', {
    cwd,
    config,
    packages,
  })
}
