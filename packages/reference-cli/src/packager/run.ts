import { log } from '../lib/log'
import { emit } from '../lib/event-bus'
import { resolveCorePackageDir } from '../lib/paths'
import { installPackages } from './install'
import { PACKAGES } from './config'

export interface RunBundlePayload {
  cwd: string
}

/**
 * Run full bundle + install. Emits packager:complete when done.
 */
export async function runBundle(payload: RunBundlePayload): Promise<void> {
  const { cwd } = payload
  const coreDir = resolveCorePackageDir(cwd)

  log.debug('packager', '📦 Packaging...')
  await installPackages(coreDir, cwd, PACKAGES)
  log.debug('packager', `✅ ${PACKAGES.length} package(s) ready`)

  emit('packager:complete')
}
