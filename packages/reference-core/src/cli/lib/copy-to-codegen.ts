import fg from 'fast-glob'
import { existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'

/**
 * Copy user files matching include patterns to codegen folder in @reference-ui/core.
 * This isolates Panda CSS processing from the user's source files.
 * 
 * Strategy:
 * 1. Resolve all files matching the include patterns from consumer cwd
 * 2. Clean the codegen folder in node_modules/@reference-ui/core
 * 3. Copy files to node_modules/@reference-ui/core/codegen/ maintaining relative paths
 * 4. Panda scans the codegen/ folder (reference-core ships source, runs from node_modules)
 */
export function copyToCodegen(consumerCwd: string, coreDir: string, includePatterns: string[]): void {
  const codegenDir = resolve(coreDir, 'codegen')
  
  // Step 1: Clean codegen folder
  if (existsSync(codegenDir)) {
    rmSync(codegenDir, { recursive: true, force: true })
  }
  mkdirSync(codegenDir, { recursive: true })

  // Step 2: Resolve files matching include patterns from consumer directory
  const files = fg.sync(includePatterns, {
    cwd: consumerCwd,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
    ],
  })

  if (files.length === 0) {
    console.warn(
      `⚠️  No files matched your include patterns:\n` +
      includePatterns.map(p => `   - ${p}`).join('\n')
    )
    return
  }

  // Step 3: Copy files to node_modules/@reference-ui/core/codegen maintaining directory structure
  let copiedCount = 0
  for (const file of files) {
    const relativePath = relative(consumerCwd, file)
    const destPath = resolve(codegenDir, relativePath)
    
    // Create parent directories
    mkdirSync(dirname(destPath), { recursive: true })
    
    // Copy file
    copyFileSync(file, destPath)
    copiedCount++
  }

  console.log(`📦 Copied ${copiedCount} file(s) to codegen/`)
}
