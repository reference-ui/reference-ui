import { resolve, dirname } from 'node:path'
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import type { PackageDefinition } from '../package'
import { bundleWithEsbuild } from './esbuild'
import { copyDirectory, copyFileWithTransforms } from './files'
import { writePackageJson } from './package'

export interface BundleOptions {
  coreDir: string
  outDir: string
  targetDir: string
  pkg: PackageDefinition
}

async function copyEntry(options: BundleOptions): Promise<void> {
  const { coreDir, targetDir, pkg } = options
  if (!pkg.entry) return

  const entrySource = resolve(coreDir, pkg.entry)
  if (!existsSync(entrySource)) return

  const outfile = pkg.main?.replace('./', '') || 'index.js'
  const destPath = resolve(targetDir, outfile)

  if (pkg.bundle) {
    await bundleWithEsbuild(coreDir, targetDir, pkg.entry, outfile)
    return
  }

  mkdirSync(dirname(destPath), { recursive: true })
  cpSync(entrySource, destPath)
}

async function copyPackageFile(srcPath: string, destPath: string): Promise<void> {
  if (!existsSync(srcPath)) return

  mkdirSync(dirname(destPath), { recursive: true })

  await copyFileWithTransforms(srcPath, destPath)
}

function getCopySourceRoot(options: BundleOptions, from: 'cli' | 'outDir'): string {
  return from === 'cli' ? options.coreDir : options.outDir
}

async function copyPackageAssets(options: BundleOptions): Promise<void> {
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

/**
 * Bundle a package using esbuild or copy its contents
 */
export async function bundlePackage(options: BundleOptions): Promise<void> {
  const { targetDir, pkg } = options
  mkdirSync(targetDir, { recursive: true })

  await copyEntry(options)
  await copyPackageAssets(options)
  writePackageJson(targetDir, pkg)
}
