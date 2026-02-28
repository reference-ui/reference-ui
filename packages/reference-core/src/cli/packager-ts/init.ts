import { runWorker } from '../thread-pool'
import type { ReferenceUIConfig } from '../config'
import { PACKAGES } from '../packager/packages'

/**
 * Initialize packager-ts from main thread.
 * Generates .d.ts from TypeScript source (not bundled .js)
 * to preserve proper types like PrimitiveProps<T>, BoxProps, etc.
 */
export async function initTsPackager(
  cwd: string,
  config: ReferenceUIConfig
): Promise<void> {
  if (config.skipTypescript) return

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
