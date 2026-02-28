import { resolveCorePackageDir } from '../lib/resolve-core'
import { debounce } from '../lib/debounce'
import type { ReferenceUIConfig } from '../config'
import { log } from '../lib/log'
import { emit, on } from '../event-bus'
import { installPackages, copyStylesToReactPackage } from './install'
import { PACKAGES } from './packages'

export interface PackagerWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  /** When true, stay alive and rebundle on system:compiled */
  watchMode?: boolean
}

async function runPackagerCore(payload: PackagerWorkerPayload): Promise<void> {
  const { cwd } = payload
  const coreDir = resolveCorePackageDir(cwd)

  log.debug('packager', '📦 Packaging...')
  await installPackages(coreDir, cwd, PACKAGES)
  log.debug('packager', `✅ ${PACKAGES.length} package(s) ready`)

  emit('packager:complete', {})
}

function copyStylesOnly(payload: PackagerWorkerPayload): void {
  const { cwd } = payload
  const coreDir = resolveCorePackageDir(cwd)
  if (copyStylesToReactPackage(coreDir, cwd)) {
    log.debug('packager', 'styles.css → React package (hot path)')
  }
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
    // Hot path: copy styles.css immediately when Panda writes it
    on('panda:stylecss:change', () => copyStylesOnly(payload))

    const debouncedBundle = debounce(async () => {
      log.debug('packager:worker', 'system:compiled → bundling packages')
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
