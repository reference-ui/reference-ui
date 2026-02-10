import { copyToNodeModules } from '../lib/copy-to-node-modules.js'
import { resolveCorePackageDir } from '../lib/resolve-core.js'
import { runGeneratePrimitives } from '../lib/run-generate-primitives.js'
import { runPandaCodegen, runPandaCss } from '../lib/run-panda-codegen.js'
import { loadUserConfig } from '../lib/load-config.js'
import { copyToCodegen, watchAndCopyToCodegen } from '../lib/copy-to-codegen.js'

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
  copyToCodegen(cwd, coreDir, userConfig.include)

  // Step 3: Run Panda codegen (scans core + codegen folder)
  console.log('🎨 Running panda codegen...')
  runPandaCodegen(coreDir)

  // Step 4: Emit styles.css (preflight + tokens + static CSS + consumer styles)
  console.log('💅 Generating styles.css...')
  runPandaCss(coreDir)

  // Step 5: Generate primitives (depends on src/system/)
  console.log('🔧 Generating design system primitives...')
  runGeneratePrimitives(coreDir)

  // Step 6: Copy final artifacts to node_modules
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
