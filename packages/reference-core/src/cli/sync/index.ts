import { initLog } from '../lib/log'
import { initEventBus } from '../event-bus'
import { loadUserConfig } from '../config'
import { initSystem } from '../system'
import { initVirtual } from '../virtual'
import { initWatch } from '../watch'
import { initPackager } from '../packager'
import { initTsPackager } from '../packager-ts'

import { log } from '../lib/log'
// reads config from ui.config.ts, copies user files to codegen, runs Panda codegen and css, generates primitives, and copies final artifacts to node_modules

export const syncCommand = async (cwd: string, options: { watch?: boolean }) => {
  console.log('🔍 Debug - CWD:', cwd)
  console.log('🔍 Debug - process.cwd():', process.cwd())

  const config = await loadUserConfig(cwd)

  initEventBus(config)
  initLog(config)

  console.log('🔄 Syncing Reference UI...')

  // Start file watching in a dedicated worker thread (if watch mode)
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
