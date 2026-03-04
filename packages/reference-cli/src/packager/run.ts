import { log } from '../lib/log'
import { emit } from '../lib/event-bus'
import { resolveCliPackageDir } from '../lib/paths'
import { installPackages } from './install'
import { PACKAGES } from './packages'

export interface RunBundlePayload {
  cwd: string
}

/**
 * Run full bundle + install. Emits packager:complete when done.
 */
export async function runBundle(payload: RunBundlePayload): Promise<void> {
  const { cwd } = payload
  const cliDir = resolveCliPackageDir(cwd)

  log.debug('packager', '📦 Packaging...')
  await installPackages(cliDir, cwd, PACKAGES)
  log.debug('packager', `✅ ${PACKAGES.length} package(s) ready`)

  emit('packager:complete')
}
