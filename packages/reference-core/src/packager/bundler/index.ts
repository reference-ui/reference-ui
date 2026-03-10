import { resolve, dirname } from 'node:path'
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import type { PackageDefinition } from '../package'
import { bundleWithEsbuild } from './esbuild'
import { copyDirectories } from './files'
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
  if (pkg.bundle) {
    await bundleWithEsbuild(coreDir, targetDir, pkg.entry, outfile)
  } else {
    cpSync(entrySource, resolve(targetDir, outfile))
  }
}

async function copyFile(srcPath: string, destPath: string): Promise<void> {
  if (!existsSync(srcPath)) return
  mkdirSync(dirname(destPath), { recursive: true })
  if (srcPath.endsWith('.ts') || srcPath.endsWith('.tsx')) {
    const { transformTypeScriptFile } = await import('./transform')
    await transformTypeScriptFile(srcPath, destPath)
  } else {
    cpSync(srcPath, destPath)
  }
}

function resolveAssetRoot(options: BundleOptions, from: 'cli' | 'outDir'): string {
  return from === 'cli' ? options.coreDir : options.outDir
}

async function createPackageContent(options: BundleOptions): Promise<void> {
  const { targetDir, pkg } = options

  await copyEntry(options)

  if (pkg.copyFrom) {
    for (const entry of pkg.copyFrom) {
      const rootDir = resolveAssetRoot(options, entry.from)
      if (entry.kind === 'dir') {
        await copyDirectories(rootDir, targetDir, [{ src: entry.src, dest: entry.dest }])
      } else {
        await copyFile(resolve(rootDir, entry.src), resolve(targetDir, entry.dest))
      }
    }
  }
}

/**
 * Bundle a package using esbuild or copy its contents
 */
export async function bundlePackage(options: BundleOptions): Promise<void> {
  const { targetDir, pkg } = options
  mkdirSync(targetDir, { recursive: true })
  await createPackageContent(options)
  writePackageJson(targetDir, pkg)
}
