import { resolveCorePackageDir } from '../lib/resolve-core'
import type { ReferenceUIConfig } from '../config'
import { log } from '../lib/log'
import { emit, on } from '../event-bus'
import { bundleAllPackages } from './bundler'
import { PACKAGES } from './packages'

export interface PackagerWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  /** When true, stay alive and rebundle on system:compiled */
  watchMode?: boolean
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      timeout = null
      fn(...args)
    }, ms)
  }) as T
}

async function runPackagerCore(payload: PackagerWorkerPayload): Promise<void> {
  const { cwd } = payload
  const coreDir = resolveCorePackageDir()

  log('')
  log('📦 Packaging Reference UI...')
  log('')

  await bundleAllPackages(coreDir, cwd, PACKAGES)

  log('')
  log('✅ Packages ready!')
  log(`   ${PACKAGES.length} package(s) installed to node_modules`)
  log('')

  emit('packager:complete', {})
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
  const { watchMode = false } = payload

  await runPackagerCore(payload)

  if (watchMode) {
    const debouncedBundle = debounce(async () => {
      log.debug('[packager:worker] system:compiled → bundling packages')
      try {
        await runPackagerCore(payload)
      } catch (err) {
        log.error('[packager:worker] Bundle failed:', err)
      }
    }, 400)

    on('system:compiled', () => debouncedBundle())

    // Stay alive
    return new Promise(() => {})
  }
}

export default runPackager
