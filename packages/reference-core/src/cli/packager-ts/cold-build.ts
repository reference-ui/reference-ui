import { join, resolve } from 'node:path'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { log } from '../lib/log'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { runTsc } from './run-tsc'
import { createTsConfig } from './tsconfig-generator'
import type { ReferenceUIConfig } from '../config'

/**
 * Generate TypeScript declarations using tsc CLI.
 * More reliable than programmatic API - battle-tested for library packaging.
 */
export async function runColdBuild(
  cwd: string,
  packages: Array<{ name: string; sourceEntry: string; outFile: string }>,
  _config: ReferenceUIConfig
): Promise<void> {
  const coreDir = resolveCorePackageDir(cwd)

  for (const pkg of packages) {
    const packageDir = join(cwd, 'node_modules', pkg.name)
    const entryPath = resolve(coreDir, pkg.sourceEntry)

    if (!existsSync(entryPath)) {
      log(`[packager-ts] Skipping ${pkg.name} (no ${pkg.sourceEntry})`)
      continue
    }

    log(`[packager-ts] Generating types for ${pkg.name}...`)

    mkdirSync(packageDir, { recursive: true })

    // Generate tsconfig for this package
    const tsconfigPath = join(packageDir, 'tsconfig.declarations.json')
    const tsconfigContent = createTsConfig({
      rootDir: coreDir,
      outDir: packageDir,
      entryFiles: [entryPath],
    })

    writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent, null, 2), 'utf-8')

    // Run tsc to generate declarations
    try {
      await runTsc(coreDir, ['-p', tsconfigPath])
      log(`[packager-ts] ✓ Declarations generated for ${pkg.name}`)
    } catch (error) {
      log(`[packager-ts] ✗ Failed to generate declarations for ${pkg.name}:`, error)
      throw error
    }

    // Update package.json types to point at the emitted entry .d.ts
    const typesPath = `./${pkg.sourceEntry.replace(/\.tsx?$/, '.d.ts')}`
    const pkgJsonPath = join(packageDir, 'package.json')
    if (existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
      pkgJson.types = typesPath
      if (pkgJson.exports && pkgJson.exports['.']) {
        pkgJson.exports['.'].types = typesPath
      }
      writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf-8')
    }

    log(`[packager-ts] Types entry: ${typesPath}`)
  }
}
