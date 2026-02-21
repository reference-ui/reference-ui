import { log, initLog } from '../lib/log'
import { initEventBus } from '../event-bus'
import { loadUserConfig } from '../config'
import { initSystem } from '../system'
import { initVirtual } from '../virtual'

// reads config from ui.config.ts, copies user files to codegen, runs Panda codegen and css, generates primitives, and copies final artifacts to node_modules

export const syncCommand = async (cwd: string, options: { watch?: boolean }) => {
  const config = await loadUserConfig(cwd)

  initEventBus(config)
  initLog(config)

  initVirtual(cwd, config, {
    watch: options.watch,
    virtualDir: config.virtualDir,
  })

  initSystem(config)
}
