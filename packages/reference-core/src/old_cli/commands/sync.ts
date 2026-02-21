import { copyToNodeModules } from '../workspace/copy-to-node-modules'
import { resolveCorePackageDir } from '../workspace/resolve-core'
import { runGeneratePrimitives } from '../lib/run-generate-primitives'
import { runPandaCodegen, runPandaCss } from '../../cli/system/gen/runner'
import { loadUserConfig } from '../config/load-config'
import { copyToCodegen, watchAndCopyToCodegen } from '../panda/gen/copy-to-codegen'
import { createPandaConfig } from '../panda/config/createPandaConfig'

export interface SyncOptions {
  watch?: boolean
}

/**
 * Isolated Panda Integration for Reference UI
 *
 * New Approach:
 * - Load user's ui.config.ts to get include patterns
 * - Copy user files to reference-core/codegen folder
 * - Run Panda on isolated codegen (not real user source)
 * - Panda config statically includes codegen folder pattern
 * - This fully isolates Panda CSS processing
 *
 * Benefits:
 * - Clean separation between user code and Panda
 * - User configures via ui.config.ts
 * - No direct scanning of user source
 * - No dynamic config generation needed
 */
export async function syncCommand(cwd: string, options: SyncOptions = {}): Promise<void> {
  const coreDir = resolveCorePackageDir()

  // Step 1: Load user configuration
  console.log('📖 Loading ui.config.ts...')
  const userConfig = await loadUserConfig(cwd)

  // Step 2: Copy user files to reference-core/codegen folder (one-time sync)
  console.log('📦 Copying user files to codegen...')
  await copyToCodegen(cwd, coreDir, userConfig.include)

  // Step 3: Bundle panda config with codegen in include (so Panda scans copied files)
  console.log('🔍 Bundling panda config...')
  await createPandaConfig(coreDir, { includeCodegen: true })

  // Step 4: Run Panda codegen (scans core + codegen folder)
  console.log('🎨 Running panda codegen...')
  runPandaCodegen(coreDir)

  // Step 5: Generate primitives (depends on src/system/recipes from codegen)
  console.log('🔧 Generating design system primitives...')
  runGeneratePrimitives(coreDir)

  // Step 6: Emit styles.css (must run after primitives so recipe usage is scanned)
  console.log('💅 Generating styles.css...')
  runPandaCss(coreDir)

  // Step 7: Copy final artifacts to node_modules
  console.log('📂 Copying to node_modules...')
  copyToNodeModules(cwd, coreDir)

  console.log('')
  console.log('✅ Sync complete! Design system is ready.')
  console.log(`   ${userConfig.include.length} pattern(s) processed`)

  if (options.watch) {
    // Watch mode: set up file watcher and run Panda in watch mode
    console.log('🔄 Starting watch mode...')
    console.log('   Press Ctrl+C to stop')
    console.log('')

    // Watch user files and copy to codegen on change
    watchAndCopyToCodegen(cwd, coreDir, userConfig.include)

    // Run Panda in watch mode (both codegen and css)
    runPandaCodegen(coreDir, { watch: true })

    // Watch mode never returns (runs until Ctrl+C)
    return
  }
}
