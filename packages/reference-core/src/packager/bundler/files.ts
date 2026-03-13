import { cpSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { transformTypeScriptFile } from './transform'

const TEXT_ENCODING = 'utf-8'

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  )
}

function isTypeScriptFile(filePath: string): boolean {
  const extension = extname(filePath)
  return extension === '.ts' || extension === '.tsx'
}

/**
 * Write content only if it changed — avoids unnecessary file writes.
 */
export function writeIfChanged(filePath: string, newContent: string): boolean {
  try {
    const existing = readFileSync(filePath, TEXT_ENCODING)
    if (existing === newContent) return false
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error
    }
  }

  writeFileSync(filePath, newContent, TEXT_ENCODING)
  return true
}

/**
 * Copy a file, transforming TypeScript sources to JavaScript on the way out.
 */
export async function copyFileWithTransforms(srcPath: string, destPath: string): Promise<void> {
  if (isTypeScriptFile(srcPath)) {
    await transformTypeScriptFile(srcPath, destPath)
    return
  }

  cpSync(srcPath, destPath)
}

/**
 * Recursively copy a directory, transforming TS files to JS.
 */
export async function copyDirectoryRecursive(srcDir: string, destDir: string): Promise<void> {
  mkdirSync(destDir, { recursive: true })

  for (const entry of readdirSync(srcDir)) {
    const srcPath = resolve(srcDir, entry)
    const destPath = resolve(destDir, entry)
    const entryStats = statSync(srcPath)

    if (entryStats.isDirectory()) {
      await copyDirectoryRecursive(srcPath, destPath)
      continue
    }

    if (entryStats.isFile()) {
      await copyFileWithTransforms(srcPath, destPath)
    }
  }
}

/**
 * Copy a source directory into the package output.
 */
export async function copyDirectory(
  sourceRoot: string,
  targetDir: string,
  src: string,
  dest?: string
): Promise<void> {
  const { log } = await import('../../lib/log')

  const srcPath = resolve(sourceRoot, src)
  const destPath = dest ? resolve(targetDir, dest) : targetDir

  try {
    const entryStats = statSync(srcPath)
    if (!entryStats.isDirectory()) {
      log.error(`⚠️  Source directory not found: ${srcPath}`)
      return
    }
  } catch (error) {
    if (isMissingFileError(error)) {
      log.error(`⚠️  Source directory not found: ${srcPath}`)
      return
    }

    throw error
  }

  await copyDirectoryRecursive(srcPath, destPath)
}
