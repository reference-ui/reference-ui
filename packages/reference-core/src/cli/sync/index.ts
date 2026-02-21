import { log, initLog } from '../utils/log'
import { loadUserConfig } from '../config'

// reads config from ui.config.ts, copies user files to codegen, runs Panda codegen and css, generates primitives, and copies final artifacts to node_modules

export const syncCommand = async (cwd: string, options: { watch?: boolean }) => {
  const config = await loadUserConfig(cwd)
  initLog(config)
  
  log.debug('Loaded config:', config)
  log('hi from sync command! (stub implementation)')
}