import { log, initLog } from '../lib/log'
import { initEventBus } from '../event-bus'
import { loadUserConfig } from '../config'
import { runWorker } from '../thread-pool'
import { initVirtual } from '../virtual'

// reads config from ui.config.ts, copies user files to codegen, runs Panda codegen and css, generates primitives, and copies final artifacts to node_modules

export const syncCommand = async (cwd: string, options: { watch?: boolean }) => {
  const config = await loadUserConfig(cwd)

  // Initialize event bus first (enables debug logging if configured)
  initEventBus(config)

  // Initialize logging system (sets up log event listeners)
  initLog(config)

  log.debug('Loaded config:', config)

  initVirtual(cwd, config, {
    watch: options.watch,
    virtualDir: config.virtualDir,
  })

  await runWorker('system', { config })
}
