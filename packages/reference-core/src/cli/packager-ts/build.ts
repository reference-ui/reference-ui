import { join, resolve, relative, dirname } from 'node:path'
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  copyFileSync,
} from 'node:fs'
import { log } from '../lib/log'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { compileDeclarations } from './compiler'
import { createTsConfig } from './config'
import type { ReferenceUIConfig } from '../config'

/**
 * Recursively copy pre-existing .d.ts files from source.
 * Handles Panda CSS generated declarations that TS doesn't process.
 */
function copyExistingDeclarations(
  srcDir: string,
  destDir: string,
  rootDir: string
): void {
  if (!existsSync(srcDir)) {
    return
  }

  const entries = readdirSync(srcDir)

  for (const entry of entries) {
    const srcPath = join(srcDir, entry)
    const stat = statSync(srcPath)

    if (stat.isDirectory()) {
      copyExistingDeclarations(srcPath, destDir, rootDir)
    } else if (stat.isFile() && entry.endsWith('.d.ts')) {
      const relativePath = relative(rootDir, srcPath)
      const destPath = join(destDir, relativePath)

      mkdirSync(dirname(destPath), { recursive: true })
      copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * Update package.json to point to generated type declarations
 */
function updatePackageTypes(packageDir: string, typesPath: string): void {
  const pkgJsonPath = join(packageDir, 'package.json')

  if (!existsSync(pkgJsonPath)) {
    return
  }

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
  pkgJson.types = typesPath

  if (pkgJson.exports && pkgJson.exports['.']) {
    pkgJson.exports['.'].types = typesPath
  }

  writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf-8')
}

/**
 * Build TypeScript declarations for packages.
 * Main orchestration function.
 */
export async function buildDeclarations(
  cwd: string,
  packages: Array<{ name: string; sourceEntry: string; outFile: string }>,
  _config: ReferenceUIConfig
): Promise<void> {
  const coreDir = resolveCorePackageDir(cwd)
  const srcDir = join(coreDir, 'src')

  for (const pkg of packages) {
    const packageDir = join(cwd, 'node_modules', pkg.name)
    const entryPath = resolve(coreDir, pkg.sourceEntry)

    if (!existsSync(entryPath)) {
      log.debug('packager-ts', `Skipping ${pkg.name} (no ${pkg.sourceEntry})`)
      continue
    }

    log.debug('packager-ts', `Building types for ${pkg.name}...`)

    mkdirSync(packageDir, { recursive: true })

    // Generate tsconfig for this package
    const tsconfigPath = join(packageDir, 'tsconfig.declarations.json')
    const tsconfigContent = createTsConfig({
      rootDir: coreDir,
      outDir: packageDir,
      entryFiles: [entryPath],
    })

    writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent, null, 2), 'utf-8')

    // Compile declarations using TypeScript compiler
    try {
      await compileDeclarations(coreDir, tsconfigPath)
      log.debug('packager-ts', `✓ Compiled ${pkg.name}`)
    } catch (error) {
      log.debug('packager-ts', `✗ Failed to compile ${pkg.name}:`, error)
      throw error
    }

    // Copy pre-existing .d.ts files from source
    copyExistingDeclarations(srcDir, packageDir, coreDir)

    // Update package.json types field
    const typesPath = `./${pkg.sourceEntry.replace(/\.tsx?$/, '.d.ts')}`
    updatePackageTypes(packageDir, typesPath)

    log.debug('packager-ts', `✓ ${pkg.name} ready`)
  }
}
