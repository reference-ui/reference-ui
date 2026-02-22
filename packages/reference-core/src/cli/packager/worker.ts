import { resolveCorePackageDir } from '../lib/resolve-core'
import type { ReferenceUIConfig } from '../config'
import { log } from '../lib/log'
import { bundleAllPackages } from './bundler'
import { PACKAGES } from './packages'

export interface PackagerWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
}

/**
 * Packager worker - bundles and installs packages to node_modules
 *
 * This runs after the system worker has generated all design tokens,
 * CSS utilities, and primitives. It takes the generated code and
 * bundles it into proper npm packages that are installed into the
 * user's node_modules directory.
 *
 * Packages created:
 * - @reference-ui/system: Design tokens, CSS utilities, patterns, recipes
 * - @reference-ui/react: React components, runtime APIs, configuration
 */
export async function runPackager(payload: PackagerWorkerPayload): Promise<void> {
  const { cwd, config } = payload
  const coreDir = resolveCorePackageDir()

  log('')
  log('📦 Packaging Reference UI...')
  log('')

  await bundleAllPackages(coreDir, cwd, PACKAGES)

  log('')
  log('✅ Packages ready!')
  log(`   ${PACKAGES.length} package(s) installed to node_modules`)
  log('')
}

export default runPackager
