import { resolve, dirname } from 'node:path'
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import type { PackageDefinition } from '../package'
import { bundleWithEsbuild } from './esbuild'
import { writeIfChanged, copyDirectories } from './files'
import { transformTypeScriptFile } from './transform'
import { writePackageJson } from './package'

export interface BundleOptions {
  coreDir: string
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

async function copyAdditionalFile(
  coreDir: string,
  targetDir: string,
  src: string,
  dest: string
): Promise<void> {
  const srcPath = resolve(coreDir, src)
  if (!existsSync(srcPath)) return

  const destPath = resolve(targetDir, dest)
  mkdirSync(dirname(destPath), { recursive: true })

  if (src.endsWith('.ts') || src.endsWith('.tsx')) {
    await transformTypeScriptFile(srcPath, destPath)
  } else {
    writeIfChanged(destPath, readFileSync(srcPath, 'utf-8'))
  }
}

async function createPackageContent(options: BundleOptions): Promise<void> {
  const { coreDir, targetDir, pkg } = options

  if (pkg.copyDirs) {
    await copyDirectories(coreDir, targetDir, pkg.copyDirs)
  }

  await copyEntry(options)

  if (pkg.additionalFiles) {
    for (const { src, dest } of pkg.additionalFiles) {
      await copyAdditionalFile(coreDir, targetDir, src, dest)
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
