import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { copyDirectory, copyFileWithTransforms } from './files'
import type { BundleOptions } from './types'

async function copyPackageFile(srcPath: string, destPath: string): Promise<void> {
  if (!existsSync(srcPath)) return

  mkdirSync(dirname(destPath), { recursive: true })
  await copyFileWithTransforms(srcPath, destPath)
}

function getCopySourceRoot(options: BundleOptions, from: 'cli' | 'outDir'): string {
  return from === 'cli' ? options.coreDir : options.outDir
}

/**
 * Copy any extra files or directories declared by the package definition into
 * the final package output.
 */
export async function copyPackageAssets(options: BundleOptions): Promise<void> {
  const { targetDir, pkg } = options
  if (!pkg.copyFrom) return

  for (const entry of pkg.copyFrom) {
    const sourceRoot = getCopySourceRoot(options, entry.from)

    if (entry.kind === 'dir') {
      await copyDirectory(sourceRoot, targetDir, entry.src, entry.dest)
      continue
    }

    await copyPackageFile(resolve(sourceRoot, entry.src), resolve(targetDir, entry.dest))
  }
}
