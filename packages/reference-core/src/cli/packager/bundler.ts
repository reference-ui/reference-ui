import { build } from 'esbuild'
import { resolve, dirname, extname } from 'node:path'

/** Set to false to skip symlinking .reference-ui/* into node_modules/@reference-ui/* */
export const ENABLE_REFERENCE_UI_SYMLINKS = false
import {
  mkdirSync,
  writeFileSync,
  cpSync,
  existsSync,
  readdirSync,
  statSync,
  lstatSync,
  readFileSync,
  rmSync,
  unlinkSync,
} from 'node:fs'
import symlinkDir from 'symlink-dir'
import { log } from '../lib/log'
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
  entryPath: string,
  outfile: string
): Promise<void> {
  await build({
    entryPoints: [resolve(coreDir, entryPath)],
    bundle: true, // Bundle all dependencies into one file
    outfile: resolve(targetDir, outfile),
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    jsx: 'automatic',
    jsxImportSource: 'react',
    external: ['react', 'react-dom', 'react/jsx-runtime'], // Don't bundle React
    sourcemap: false,
    treeShaking: true,
    minify: false,
    logLevel: 'warning',
  })
}

/**
 * Transform a TypeScript file to JavaScript
 */
async function transformTypeScriptFile(
  srcPath: string,
  destPath: string,
  rewriteImports = false
): Promise<void> {
  // Change .ts/.tsx extension to .js/.jsx
  const finalDestPath = destPath.replace(/\.tsx?$/, match =>
    match === '.tsx' ? '.jsx' : '.js'
  )

  await build({
    entryPoints: [srcPath],
    outfile: finalDestPath,
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    jsx: 'automatic',
    jsxImportSource: 'react',
    bundle: false,
    sourcemap: false,
    logLevel: 'warning',
  })

  // Rewrite imports from ../foo to ./foo if needed
  if (rewriteImports) {
    const content = readFileSync(finalDestPath, 'utf-8')
    const rewritten = content
      // Change ../primitives/ to ./primitives/
      .replace(/from ["']\.\.\/([^"']+)["']/g, 'from "./$1"')
      // Change import .. statements
      .replace(/import ["']\.\.\/([^"']+)["']/g, 'import "./$1"')
      // Change export .. from statements
      .replace(/export \* from ["']\.\.\/([^"']+)["']/g, 'export * from "./$1"')
      .replace(/export {([^}]+)} from ["']\.\.\/([^"']+)["']/g, 'export {$1} from "./$2"')

    writeFileSync(finalDestPath, rewritten, 'utf-8')
  }
}

/**
 * Recursively copy a directory, transforming TS files to JS
 */
async function copyDirRecursive(srcDir: string, destDir: string): Promise<void> {
  mkdirSync(destDir, { recursive: true })

  const entries = readdirSync(srcDir)

  for (const entry of entries) {
    const srcPath = resolve(srcDir, entry)
    const stat = statSync(srcPath)

    if (stat.isDirectory()) {
      const destPath = resolve(destDir, entry)
      await copyDirRecursive(srcPath, destPath)
    } else if (stat.isFile()) {
      const ext = extname(entry)

      if (ext === '.ts' || ext === '.tsx') {
        // Transform TypeScript to JavaScript
        const destPath = resolve(destDir, entry)
        await transformTypeScriptFile(srcPath, destPath)
      } else {
        // Copy other files as-is
        const destPath = resolve(destDir, entry)
        cpSync(srcPath, destPath)
      }
    }
  }
}

/**
 * Copy directories, transforming TypeScript files to JavaScript
 */
async function copyDirectories(
  coreDir: string,
  targetDir: string,
  dirs: Array<{ src: string; dest?: string }>
): Promise<void> {
  for (const { src, dest } of dirs) {
    const srcPath = resolve(coreDir, src)
    const destPath = dest ? resolve(targetDir, dest) : targetDir

    if (!existsSync(srcPath)) {
      log.error(`⚠️  Source directory not found: ${srcPath}`)
      continue
    }

    // Recursively copy and transform
    await copyDirRecursive(srcPath, destPath)
  }
}

/**
 * Create or copy package content based on configuration
 */
async function createPackageContent(options: BundleOptions): Promise<void> {
  const { coreDir, targetDir, pkg } = options

  // First, copy directories if specified (transforms TS to JS)
  if (pkg.copyDirs) {
    await copyDirectories(coreDir, targetDir, pkg.copyDirs)
  }

  // Then, if we have an entry to transform, do that
  if (pkg.entry) {
    const entrySource = resolve(coreDir, pkg.entry)
    const outfile = pkg.main?.replace('./', '') || 'index.js'

    if (existsSync(entrySource)) {
      if (pkg.bundle) {
        await bundleWithEsbuild(coreDir, targetDir, pkg.entry, outfile)
      } else {
        // Just copy the entry file directly
        const entryDest = resolve(targetDir, outfile)
        cpSync(entrySource, entryDest)
      }
    }
  }

  // Copy additional files (transforms TS to JS)
  if (pkg.additionalFiles) {
    for (const { src, dest } of pkg.additionalFiles) {
      const srcPath = resolve(coreDir, src)
      const destPath = resolve(targetDir, dest)

      if (existsSync(srcPath)) {
        mkdirSync(dirname(destPath), { recursive: true })

        // If source is TypeScript, transform it
        if (src.endsWith('.ts') || src.endsWith('.tsx')) {
          // Rewrite imports for entry point files
          const isEntryPoint = src.includes('/entry/')
          await transformTypeScriptFile(srcPath, destPath, isEntryPoint)
        } else {
          cpSync(srcPath, destPath)
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
    main: pkg.main || './index.js',
    types: pkg.types || './index.d.ts',
    exports: pkg.exports,
  }

  writeFileSync(
    resolve(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf-8'
  )
}

/**
 * Short name for a scoped package (e.g. @reference-ui/react -> react)
 */
function getShortName(pkgName: string): string {
  const scope = pkgName.indexOf('/')
  return scope >= 0 ? pkgName.slice(scope + 1) : pkgName
}

/**
 * Bundle all packages. When ENABLE_REFERENCE_UI_SYMLINKS is true: output to .reference-ui/
 * and symlink into node_modules (for Vite HMR). When false: output directly to node_modules
 * (no .reference-ui folder).
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
      // Writing directly to node_modules: remove existing symlink/dir from pnpm file: deps.
      // existsSync returns false for broken symlinks (it follows the link), so use lstatSync.
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

    log(`📦 ${pkg.bundle ? 'Bundling' : 'Copying'} ${pkg.name}...`)

    await bundlePackage({
      coreDir,
      targetDir,
      pkg,
    })

    if (ENABLE_REFERENCE_UI_SYMLINKS) {
      // Remove existing link/dir so we can create a fresh symlink
      if (existsSync(linkPath)) {
        rmSync(linkPath, { recursive: true, force: true })
      }

      if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
        throw new Error(`Packager target ${targetDir} must be a directory (symlink-dir requires it on Windows)`)
      }

      symlinkDir.sync(targetDir, linkPath)
      log(`   ✓ ${pkg.name} → ${linkPath}`)
    } else {
      log(`   ✓ ${pkg.name} → ${targetDir}`)
    }
  }
}
