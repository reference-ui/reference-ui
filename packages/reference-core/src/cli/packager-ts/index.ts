import { log } from '../lib/log'
import { runWorker } from '../thread-pool'
import { buildDeclarations } from './build'
import type { TsPackagerWorkerPayload } from './types'
import type { ReferenceUIConfig } from '../config'
import { PACKAGES } from '../packager/packages'

/**
 * Main entry - runs declaration build for packages
 */
export async function runTsPackager(payload: TsPackagerWorkerPayload): Promise<void> {
  const { cwd, config, packages } = payload

  log.debug('packager-ts', '')
  log.debug('packager-ts', '🔷 Generating TypeScript declarations...')
  log.debug('packager-ts', '')

  try {
    await buildDeclarations(cwd, packages, config)
    log.debug('packager-ts', '')
  } catch (error) {
    log.debug('packager-ts', 'Error:', error)
    throw error
  }
}

/**
 * Initialize packager-ts from main thread.
 * Generates .d.ts from TypeScript source (not bundled .js)
 * to preserve proper types like PrimitiveProps<T>, BoxProps, etc.
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
