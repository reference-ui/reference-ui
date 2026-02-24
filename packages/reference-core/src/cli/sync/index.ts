import { initLog } from '../lib/log'
import { initEventBus } from '../event-bus'
import { loadUserConfig } from '../config'
import { initSystem } from '../system'
import { initVirtual } from '../virtual'
import { initWatch } from '../watch'
import { initPackager } from '../packager'
import { initTsPackager } from '../packager-ts'
import { log } from '../lib/log'

export const syncCommand = async (cwd: string, options: { watch?: boolean }) => {
  const config = await loadUserConfig(cwd)

  initEventBus(config)
  initLog(config)

  if (options.watch) {
    initWatch(cwd, config)
  }

  // Initialize virtual filesystem (one-time copy)
  initVirtual(cwd, config, {
    virtualDir: config.virtualDir,
  })

  initSystem(cwd, config)

  // Package the generated code into node_modules
  await initPackager(cwd, config)

  // Generate TypeScript declarations from bundled .js
  await initTsPackager(cwd, config)
}
