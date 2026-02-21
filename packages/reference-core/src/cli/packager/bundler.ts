import { build } from 'esbuild'
import { resolve, dirname } from 'node:path'
import { mkdirSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import type { PackageDefinition } from './packages'

export interface BundleOptions {
  coreDir: string
  targetDir: string
  pkg: PackageDefinition
}

/**
 * Bundle a package using esbuild (for packages that need bundling)
 */
async function bundleWithEsbuild(
  coreDir: string,
  targetDir: string,
  entryPath: string
): Promise<void> {
  await build({
    entryPoints: [resolve(coreDir, entryPath)],
    bundle: false, // Don't bundle - just transform and preserve imports
    outfile: resolve(targetDir, 'index.js'),
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    jsx: 'automatic',
    jsxImportSource: 'react',
    external: [],
    sourcemap: true,
    treeShaking: false,
    minify: false,
    logLevel: 'warning',
  })
}

/**
 * Copy directories for packages that don't need bundling
 */
function copyDirectories(
  coreDir: string,
  targetDir: string,
  dirs: Array<{ src: string; dest?: string }>
): void {
  for (const { src, dest } of dirs) {
    const srcPath = resolve(coreDir, src)
    const destPath = dest ? resolve(targetDir, dest) : targetDir

    if (existsSync(srcPath)) {
      cpSync(srcPath, destPath, { recursive: true })
    } else {
      console.warn(`⚠️  Source directory not found: ${srcPath}`)
    }
  }
}

/**
 * Create or copy package content based on configuration
 */
async function createPackageContent(options: BundleOptions): Promise<void> {
  const { coreDir, targetDir, pkg } = options

  // First, copy directories if specified
  if (pkg.copyDirs) {
    copyDirectories(coreDir, targetDir, pkg.copyDirs)
  }

  // Then, if we have an entry to transform, do that
  if (pkg.entry) {
    const entrySource = resolve(coreDir, pkg.entry)
    const entryDest = resolve(targetDir, 'index.js')

    if (existsSync(entrySource)) {
      if (pkg.bundle) {
        await bundleWithEsbuild(coreDir, targetDir, pkg.entry)
      } else {
        // Just copy the entry file directly
        cpSync(entrySource, entryDest)
      }
    }
  }

  // Copy additional files
  if (pkg.additionalFiles) {
    for (const { src, dest } of pkg.additionalFiles) {
      const srcPath = resolve(coreDir, src)
      const destPath = resolve(targetDir, dest)

      if (existsSync(srcPath)) {
        mkdirSync(dirname(destPath), { recursive: true })
        cpSync(srcPath, destPath)
      }
    }
  }
}

/**
 * Bundle a package using esbuild or copy its contents
 */
export async function bundlePackage(options: BundleOptions): Promise<void> {
  const { targetDir, pkg } = options

  // Ensure target directory exists
  mkdirSync(targetDir, { recursive: true })

  // Create package content
  await createPackageContent(options)

  // Generate package.json
  const packageJson = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    type: 'module',
    main: './index.js',
    types: './index.d.ts',
    exports: pkg.exports,
  }

  writeFileSync(
    resolve(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf-8'
  )
}

/**
 * Bundle all packages and place them in the user's node_modules
 */
export async function bundleAllPackages(
  coreDir: string,
  userProjectDir: string,
  packages: PackageDefinition[]
): Promise<void> {
  const nodeModulesDir = resolve(userProjectDir, 'node_modules')

  // Ensure @reference-ui scope exists
  mkdirSync(resolve(nodeModulesDir, '@reference-ui'), { recursive: true })

  // Bundle each package
  for (const pkg of packages) {
    const targetDir = resolve(nodeModulesDir, pkg.name)

    console.log(`📦 ${pkg.bundle ? 'Bundling' : 'Copying'} ${pkg.name}...`)

    await bundlePackage({
      coreDir,
      targetDir,
      pkg,
    })

    console.log(`   ✓ ${pkg.name} → ${targetDir}`)
  }
}
