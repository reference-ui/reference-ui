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
  const { cwd, config } = payload
  const coreDir = resolveCorePackageDir(cwd)

  log.debug('packager', '📦 Packaging...')
  await installPackages(coreDir, cwd, PACKAGES)
  if (copyStylesToReactPackage(coreDir, cwd, config)) {
    log.debug('packager', 'styles.css (+layers) → React package')
  }
  log.debug('packager', `✅ ${PACKAGES.length} package(s) ready`)

  emit('packager:complete', {})
}

/** Copy styles.css only (hot path when Panda compiles). */
export function runCopyStyles(payload: PackagerWorkerPayload): void {
  const { cwd, config } = payload
  const coreDir = resolveCorePackageDir(cwd)
  if (copyStylesToReactPackage(coreDir, cwd, config)) {
    log.debug('packager', 'styles.css → React package (hot path)')
  }
}

/** Returns handler for panda:css:compiled – copy styles only. */
export function onPandaCssCompiled(payload: PackagerWorkerPayload): () => void {
  return () => runCopyStyles(payload)
}

/** Returns handler for system:compiled – full bundle. Uses config from event when provided (ui.config reload). */
export function onSystemCompiled(
  payload: PackagerWorkerPayload
): (evt: { config?: ReferenceUIConfig }) => void {
  const run = async (p: PackagerWorkerPayload) => {
    log.debug('packager:worker', 'system:compiled → bundling packages')
    try {
      await runBundle(p)
    } catch (err) {
      log.error('[packager:worker] Bundle failed:', err)
    }
  }
  const debounced = debounce((...args: unknown[]) => run(args[0] as PackagerWorkerPayload), 400)
  return (evt: { config?: ReferenceUIConfig }) => {
    const config = evt?.config ?? payload.config
    debounced({ ...payload, config })
  }
}
