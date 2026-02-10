import fg from 'fast-glob'
import { existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import * as chokidar from 'chokidar'

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

/**
 * Format timestamp in Vite style (HH:MM:SS AM/PM)
 */
function formatTime(): string {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes}:${seconds} ${ampm}`
}

/**
 * Log a sync event in Vite HMR style
 * Uses stderr to avoid being cleared by Vite's console management
 */
function logSync(relativePath: string): void {
  process.stderr.write(`${formatTime()} [ref sync] synced ${relativePath}\n`)
}

/**
 * Watch user files and copy them to codegen on change.
 * Logs syncs in Vite HMR style.
 */
export function watchAndCopyToCodegen(
  consumerCwd: string,
  coreDir: string,
  includePatterns: string[]
): void {
  const codegenDir = resolve(coreDir, 'codegen')

  // Resolve files matching include patterns
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

  // Create watcher for all matched files
  const watcher = chokidar.watch(files, {
    persistent: true,
    ignoreInitial: false, // Process existing files on startup
    awaitWriteFinish: {
      stabilityThreshold: 50,
      pollInterval: 10,
    },
  })

  // Track if this is initial scan
  let isReady = false
  let initialCount = 0

  watcher
    .on('add', (file) => {
      const relativePath = relative(consumerCwd, file)
      const destPath = resolve(codegenDir, relativePath)

      mkdirSync(dirname(destPath), { recursive: true })
      copyFileSync(file, destPath)

      if (isReady) {
        logSync(relativePath)
      } else {
        initialCount++
      }
    })
    .on('change', (file) => {
      const relativePath = relative(consumerCwd, file)
      const destPath = resolve(codegenDir, relativePath)

      mkdirSync(dirname(destPath), { recursive: true })
      copyFileSync(file, destPath)

      logSync(relativePath)
    })
    .on('ready', () => {
      isReady = true
      console.log(`📦 Watching ${initialCount} file(s) for changes...`)
    })
    .on('error', (error) => {
      console.error(`⚠️  Watcher error: ${error}`)
    })
}
