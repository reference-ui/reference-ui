import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  cpSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { resolve, extname } from 'node:path'
import { transformTypeScriptFile } from './transform'

/**
 * Write content only if it changed — avoids Vite HMR cascade when JS bundle is unchanged.
 */
export function writeIfChanged(filePath: string, newContent: string): boolean {
  try {
    const existing = readFileSync(filePath, 'utf-8')
    if (existing === newContent) return false
  } catch {
    // File doesn't exist, write it
  }
  writeFileSync(filePath, newContent, 'utf-8')
  return true
}

/**
 * Recursively copy a directory, transforming TS files to JS
 */
export async function copyDirRecursive(srcDir: string, destDir: string): Promise<void> {
  mkdirSync(destDir, { recursive: true })
  const entries = readdirSync(srcDir)

  for (const entry of entries) {
    const srcPath = resolve(srcDir, entry)
    const stat = statSync(srcPath)

    if (stat.isDirectory()) {
      const destPath = resolve(destDir, entry)
      await copyDirRecursive(srcPath, destPath)
    } else if (stat.isFile()) {
      const ext = extname(entry)
      if (ext === '.ts' || ext === '.tsx') {
        const destPath = resolve(destDir, entry)
        await transformTypeScriptFile(srcPath, destPath)
      } else {
        const destPath = resolve(destDir, entry)
        cpSync(srcPath, destPath)
      }
    }
  }
}

/**
 * Copy directories, transforming TypeScript files to JavaScript
 */
export async function copyDirectories(
  coreDir: string,
  targetDir: string,
  dirs: Array<{ src: string; dest?: string }>
): Promise<void> {
  const { log } = await import('../../lib/log')
  for (const { src, dest } of dirs) {
    const srcPath = resolve(coreDir, src)
    const destPath = dest ? resolve(targetDir, dest) : targetDir

    if (!existsSync(srcPath)) {
      log.error(`⚠️  Source directory not found: ${srcPath}`)
      continue
    }
    await copyDirRecursive(srcPath, destPath)
  }
}
