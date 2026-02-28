import { resolve, dirname } from 'node:path'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  lstatSync,
  rmSync,
  statSync,
  unlinkSync,
} from 'node:fs'
import symlinkDir from 'symlink-dir'
import { log } from '../../lib/log'
import type { PackageDefinition } from '../packages'
import { bundleWithEsbuild } from './esbuild'
import { writeIfChanged, copyDirectories } from './files'
import { transformTypeScriptFile } from './transform'
import { writePackageJson } from './package'

/** Set to false to skip symlinking .reference-ui/* into node_modules/@reference-ui/* */
export const ENABLE_REFERENCE_UI_SYMLINKS = true

export interface BundleOptions {
  coreDir: string
  targetDir: string
  pkg: PackageDefinition
}

/**
 * Create or copy package content based on configuration
 */
async function createPackageContent(options: BundleOptions): Promise<void> {
  const { coreDir, targetDir, pkg } = options

  if (pkg.copyDirs) {
    await copyDirectories(coreDir, targetDir, pkg.copyDirs)
  }

  if (pkg.entry) {
    const entrySource = resolve(coreDir, pkg.entry)
    const outfile = pkg.main?.replace('./', '') || 'index.js'

    if (existsSync(entrySource)) {
      if (pkg.bundle) {
        await bundleWithEsbuild(coreDir, targetDir, pkg.entry, outfile)
      } else {
        const entryDest = resolve(targetDir, outfile)
        cpSync(entrySource, entryDest)
      }
    }
  }

  if (pkg.additionalFiles) {
    for (const { src, dest } of pkg.additionalFiles) {
      const srcPath = resolve(coreDir, src)
      const destPath = resolve(targetDir, dest)

      if (existsSync(srcPath)) {
        mkdirSync(dirname(destPath), { recursive: true })
        if (src.endsWith('.ts') || src.endsWith('.tsx')) {
          await transformTypeScriptFile(srcPath, destPath)
        } else {
          const newContent = readFileSync(srcPath, 'utf-8')
          writeIfChanged(destPath, newContent)
        }
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

function getShortName(pkgName: string): string {
  const scope = pkgName.indexOf('/')
  return scope >= 0 ? pkgName.slice(scope + 1) : pkgName
}

/**
 * Bundle all packages. When ENABLE_REFERENCE_UI_SYMLINKS is true: output to .reference-ui/
 * and symlink into node_modules (for Vite HMR). When false: output directly to node_modules.
 */
export async function bundleAllPackages(
  coreDir: string,
  userProjectDir: string,
  packages: PackageDefinition[]
): Promise<void> {
  const refUiDir = resolve(userProjectDir, '.reference-ui')
  const nodeModulesDir = resolve(userProjectDir, 'node_modules')
  const refUiScopeDir = resolve(nodeModulesDir, '@reference-ui')

  mkdirSync(refUiScopeDir, { recursive: true })

  for (const pkg of packages) {
    const shortName = getShortName(pkg.name)
    const targetDir = ENABLE_REFERENCE_UI_SYMLINKS
      ? resolve(refUiDir, shortName)
      : resolve(refUiScopeDir, shortName)
    const linkPath = resolve(refUiScopeDir, shortName)

    if (ENABLE_REFERENCE_UI_SYMLINKS) {
      mkdirSync(refUiDir, { recursive: true })
    } else {
      try {
        const stat = lstatSync(linkPath)
        if (stat.isSymbolicLink()) {
          unlinkSync(linkPath)
        } else {
          rmSync(linkPath, { recursive: true, force: true })
        }
      } catch (e: unknown) {
        if ((e as NodeJS.ErrnoException)?.code !== 'ENOENT') throw e
      }
    }

    await bundlePackage({ coreDir, targetDir, pkg })

    if (ENABLE_REFERENCE_UI_SYMLINKS) {
      if (existsSync(linkPath)) {
        rmSync(linkPath, { recursive: true, force: true })
      }
      if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
        throw new Error(
          `Packager target ${targetDir} must be a directory (symlink-dir requires it on Windows)`
        )
      }
      symlinkDir.sync(targetDir, linkPath)
      log.debug('packager', `✓ ${pkg.name} → ${linkPath}`)
    } else {
      log.debug('packager', `✓ ${pkg.name} → ${targetDir}`)
    }
  }
}
