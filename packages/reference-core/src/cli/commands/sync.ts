import { copyToNodeModules } from '../lib/copy-to-node-modules.js'
import { resolveCorePackageDir } from '../lib/resolve-core.js'
import { runGeneratePrimitives } from '../lib/run-generate-primitives.js'
import { runPandaCodegen, runPandaCss } from '../lib/run-panda-codegen.js'

export interface SyncOptions {
  watch?: boolean
}

/**
 * Elegant Panda Integration for Library-Owned Design System
 * 
 * Principles:
 * - Core owns Panda compilation
 * - Scans real consumer source (no copying/rewriting)
 * - TypeScript paths align Panda + TS resolution
 * - Outputs directly to src/system/ (committed, imported by entry)
 * 
 * No hacks. Clean boundaries. Works with Panda, not against it.
 */
export async function syncCommand(cwd: string, options: SyncOptions = {}): Promise<void> {
  const coreDir = resolveCorePackageDir()

  if (options.watch) {
    console.log('🔄 Starting watch mode...')
    console.log('   Panda will watch for changes in core + consumer source')
    console.log('   Press Ctrl+C to stop')
    console.log('')
    
    // Run Panda in watch mode (both codegen and css)
    runPandaCodegen(coreDir, { watch: true })
    
    // Watch mode never returns (runs until Ctrl+C)
    return
  }

  // Step 1: Run Panda codegen (scans core + consumer source directly)
  console.log('Running panda codegen (scanning core + consumer source)...')
  runPandaCodegen(coreDir)

  // Step 2: Emit styles.css (preflight + tokens + static CSS + consumer styles)
  console.log('Generating styles.css...')
  runPandaCss(coreDir)

  // Step 3: Generate primitives (depends on src/system/)
  console.log('Generating design system primitives...')
  runGeneratePrimitives(coreDir)

  // Step 4: Copy final artifacts to node_modules
  console.log('Copying to node_modules...')
  copyToNodeModules(cwd, coreDir)

  console.log('✅ Sync complete! Design system is ready.')
  console.log('🎨 Panda scanned real source. No copying. No rewriting.')
}
