import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const fg = require('fast-glob')
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { subscribe } from '@parcel/watcher'
import { log } from '../../lib/log'
import { mdxToJSX } from './mdx-to-jsx'
import { rewriteCvaImports } from './rewrite-cva-imports'
import { rewriteCssImports } from './rewrite-css-imports'

/**
 * Apply all import rewrites to source code.
 * This ensures cva/recipe and css imports from @reference-ui/core are rewritten
 * to use the local styled-system/css exports.
 */
function rewriteImports(sourceCode: string, relativePath: string): string {
  let result = sourceCode
  result = rewriteCvaImports(result, relativePath)
  result = rewriteCssImports(result, relativePath)
  return result
}

/**
 * Copy user files matching include patterns to codegen folder in @reference-ui/core.
 * This isolates Panda CSS processing from the user's source files.
 *
 * Strategy:
 * 1. Resolve all files matching the include patterns from consumer cwd
 * 2. Clean the codegen folder in node_modules/@reference-ui/core
 * 3. Copy files to node_modules/@reference-ui/core/codegen/ maintaining relative paths
 * 4. MDX files are converted to JSX for Panda scanning
 * 5. TS/TSX/JSX: AST transform rewrites `cva`/`recipe`/`css` from @reference-ui/core to separate imports from styled-system/css so Panda resolves them from outdir
 * 6. Panda scans the codegen/ folder (reference-core ships source, runs from node_modules)
 */
export async function copyToCodegen(
  consumerCwd: string,
  coreDir: string,
  includePatterns: string[]
): Promise<void> {
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
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
  })

  if (files.length === 0) {
    log.error(
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

    // Convert MDX to JSX, otherwise copy as-is (with cva import rewrite for TS/TSX/JSX)
    if (file.endsWith('.mdx')) {
      const mdxContent = readFileSync(file, 'utf-8')
      const jsxContent = await mdxToJSX(mdxContent, relativePath)
      const jsxDestPath = destPath.replace(/\.mdx$/, '.jsx')
      mkdirSync(dirname(jsxDestPath), { recursive: true })
      writeFileSync(jsxDestPath, jsxContent, 'utf-8')
    } else {
      mkdirSync(dirname(destPath), { recursive: true })
      const ext = file.slice(file.lastIndexOf('.'))
      if (ext === '.ts' || ext === '.tsx' || ext === '.jsx') {
        const content = readFileSync(file, 'utf-8')
        const rewritten = rewriteImports(content, relativePath)
        writeFileSync(destPath, rewritten, 'utf-8')
      } else {
        copyFileSync(file, destPath)
      }
    }
    copiedCount++
  }

  log.debug(`📦 Copied ${copiedCount} file(s) to codegen/`)
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

async function copyFileToCodegen(
  file: string,
  consumerCwd: string,
  codegenDir: string
): Promise<string> {
  const relativePath = relative(consumerCwd, file)
  const destPath = resolve(codegenDir, relativePath)

  if (file.endsWith('.mdx')) {
    const mdxContent = readFileSync(file, 'utf-8')
    const jsxContent = await mdxToJSX(mdxContent, relativePath)
    const jsxDestPath = destPath.replace(/\.mdx$/, '.jsx')
    mkdirSync(dirname(jsxDestPath), { recursive: true })
    writeFileSync(jsxDestPath, jsxContent, 'utf-8')
  } else {
    mkdirSync(dirname(destPath), { recursive: true })
    const ext = file.slice(file.lastIndexOf('.'))
    if (ext === '.ts' || ext === '.tsx' || ext === '.jsx') {
      const content = readFileSync(file, 'utf-8')
      const rewritten = rewriteImports(content, relativePath)
      writeFileSync(destPath, rewritten, 'utf-8')
    } else {
      copyFileSync(file, destPath)
    }
  }
  return relativePath
}

/**
 * Watch user files and copy them to codegen on change.
 * Logs syncs in Vite HMR style.
 */
export async function watchAndCopyToCodegen(
  consumerCwd: string,
  coreDir: string,
  includePatterns: string[]
): Promise<void> {
  const codegenDir = resolve(coreDir, 'codegen')

  // Resolve files matching include patterns (for count / validation)
  const files = fg.sync(includePatterns, {
    cwd: consumerCwd,
    absolute: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
  })

  if (files.length === 0) {
    log.error(
      `⚠️  No files matched your include patterns:\n` +
        includePatterns.map(p => `   - ${p}`).join('\n')
    )
    return
  }

  // Parcel: watch consumerCwd, only emit for include patterns (ignore all, then un-ignore includes)
  const ignore = ['**', ...includePatterns.map(p => `!${p}`)]

  await subscribe(
    consumerCwd,
    async (err, events) => {
      if (err) {
        log.error(`⚠️  Watcher error: ${err}`)
        return
      }
      for (const ev of events) {
        if (ev.type === 'delete') continue
        const relPath = await copyFileToCodegen(ev.path, consumerCwd, codegenDir)
        logSync(relPath)
      }
    },
    { ignore }
  )

  log.debug(`📦 Watching ${files.length} file(s) for changes...`)
}
