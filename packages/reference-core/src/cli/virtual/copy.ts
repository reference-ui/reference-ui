import { mkdir, copyFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, extname } from 'node:path'
import { existsSync } from 'node:fs'
import { transformFile } from './transform'
import { log } from '../lib/log'
import { TRANSFORMED_EXTENSIONS } from './config.internal'

/**
 * Copy a file to the virtual directory, applying transforms if needed.
 * Creates parent directories as needed.
 * @returns The absolute path of the file written in the virtual dir (with any extension transform applied)
 */
export async function copyToVirtual(
  sourcePath: string,
  sourceDir: string,
  virtualDir: string,
  options: { debug?: boolean } = {}
): Promise<string> {
  const { debug } = options

  // Calculate relative path from source directory
  const relativePath = relative(sourceDir, sourcePath)

  // Build destination path in virtual directory
  let destPath = join(virtualDir, relativePath)

  // Ensure destination directory exists
  const destDir = dirname(destPath)
  if (!existsSync(destDir)) {
    await mkdir(destDir, { recursive: true })
  }

  // Read source content
  const fs = await import('node:fs/promises')
  const content = await fs.readFile(sourcePath, 'utf-8')

  // Apply transforms
  const result = await transformFile({
    sourcePath,
    destPath,
    content,
    sourceDir,
    debug,
  })

  // Update destination path if extension changed
  if (result.extension) {
    const oldExt = extname(destPath)
    destPath = destPath.slice(0, -oldExt.length) + result.extension
  }

  // Write transformed content
  await writeFile(destPath, result.content, 'utf-8')

  // Only log if transformed, otherwise silent
  if (result.transformed) {
    log.debug('virtual', `✓ ${relativePath}`)
  }

  return destPath
}

/**
 * Remove a file from the virtual directory.
 */
export async function removeFromVirtual(
  sourcePath: string,
  sourceDir: string,
  virtualDir: string,
  options: { debug?: boolean } = {}
): Promise<void> {
  const { debug } = options
  const fs = await import('node:fs/promises')

  // Calculate relative path
  const relativePath = relative(sourceDir, sourcePath)
  const destPath = join(virtualDir, relativePath)

  log.debug(`[virtual] Removing: ${relativePath}`)

  // Remove file if it exists
  if (existsSync(destPath)) {
    await fs.unlink(destPath)
  }

  // Also check for transformed versions (e.g., .jsx from .mdx)
  for (const ext of TRANSFORMED_EXTENSIONS) {
    const transformedPath = destPath.replace(extname(destPath), ext)
    if (existsSync(transformedPath) && transformedPath !== destPath) {
      await fs.unlink(transformedPath)
    }
  }
}
