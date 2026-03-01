import type { ReferenceUIConfig } from '../config'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { debounce } from '../lib/debounce'
import { log } from '../lib/log'
import { emit } from '../event-bus'
import { installPackages, copyStylesToReactPackage } from './install'
import { PACKAGES } from './packages'

export interface PackagerWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  watchMode?: boolean
}

/** Run full bundle + install. Emits packager:complete when done. */
export async function runBundle(payload: PackagerWorkerPayload): Promise<void> {
  const { cwd } = payload
  const coreDir = resolveCorePackageDir(cwd)

  log.debug('packager', '📦 Packaging...')
  await installPackages(coreDir, cwd, PACKAGES)
  log.debug('packager', `✅ ${PACKAGES.length} package(s) ready`)

  emit('packager:complete', {})
}

/** Copy styles.css only (hot path when Panda compiles). */
export function runCopyStyles(payload: PackagerWorkerPayload): void {
  const { cwd } = payload
  const coreDir = resolveCorePackageDir(cwd)
  if (copyStylesToReactPackage(coreDir, cwd)) {
    log.debug('packager', 'styles.css → React package (hot path)')
  }
}

/** Returns handler for panda:css:compiled – copy styles only. */
export function onPandaCssCompiled(payload: PackagerWorkerPayload): () => void {
  return () => runCopyStyles(payload)
}

/** Returns debounced handler for system:compiled – full bundle. */
export function onSystemCompiled(payload: PackagerWorkerPayload): () => void {
  return debounce(async () => {
    log.debug('packager:worker', 'system:compiled → bundling packages')
    try {
      await runBundle(payload)
    } catch (err) {
      log.error('[packager:worker] Bundle failed:', err)
    }
  }, 400)
}
