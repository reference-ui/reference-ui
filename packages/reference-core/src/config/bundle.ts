// Bundling for Neo ui.config files via esbuild.
// It takes a config path and emits bundled code plus local dependency paths. A published base system
// imported by bare specifier is inlined, so every load reads its current file, and its real path is a
// watch input; all other packages stay external and are listed, so a slow evaluation can name them.
// A failed bundle names the files it tried to import.
// It began as a Neo-owned copy of the core config bundler with a Neo-local entry.

import { microBundleWithResult, NEO_PACKAGE_ROOT, type MicroBundleResult } from '../lib/microbundle/index.ts'
import { CONFIG_EXTERNALS } from './constants.ts'
import type * as esbuild from 'esbuild'
import { existsSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

export interface BundleConfigOptions {
  /** Modules to leave as external (not bundled). */
  external?: string[]
}

export interface BundledConfig {
  code: string
  dependencyPaths: string[]
  /** Bare specifiers left as runtime imports, in first-seen order: what evaluating the bundle loads. */
  externalImports: string[]
}

// A published base system is a `baseSystem.mjs` (or `.js`) data module. Inlining
// it makes esbuild read the file on every bundle, so Node's ESM cache cannot pin
// the first-loaded upstream into a later load in the same process.
const BASE_SYSTEM_FILE = /(?:^|[\\/])baseSystem\.m?js$/

// Marks the nested resolve that learns where a bare specifier lands, so the
// plugin steps aside for it instead of recursing into itself.
const PROBE_FLAG = 'neoConfigBareProbe'

// Relative specifiers: `./x`, `../x`, `.` and `..`. The plugin records them and lets esbuild resolve them.
const RELATIVE_SPECIFIER = /^\.\.?(?:\/|$)/

// esbuild's default resolve extensions. A `.js` specifier also resolves to its TypeScript twin.
const RESOLVE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.json']
const TS_TWIN_EXTENSIONS = ['.ts', '.tsx']
const JS_EXTENSION = /\.[mc]?jsx?$/

/**
 * Every path esbuild may settle a relative specifier on: the path as written, each resolve extension, an index
 * file, and the TypeScript twin of a `.js` path. A file created at any of them later must wake the watch.
 */
function importCandidates(resolveDir: string, specifier: string): string[] {
  const base = resolve(resolveDir, specifier)
  const stem = base.replace(JS_EXTENSION, '')
  const twins = stem === base ? [] : TS_TWIN_EXTENSIONS.map((ext) => stem + ext)
  return [
    base,
    ...RESOLVE_EXTENSIONS.map((ext) => base + ext),
    ...RESOLVE_EXTENSIONS.map((ext) => join(base, `index${ext}`)),
    ...twins,
  ]
}

// What the import plugin saw: inlined base-system files, attempted relative paths, external bare specifiers.
interface ConfigImportRecord {
  inlined: Set<string>
  attempted: Set<string>
  external: Set<string>
}

/**
 * esbuild plugin that settles every bare specifier in a config bundle. A
 * published base system resolves to its file and is inlined; any other package
 * stays an external import, as `packages: 'external'` left it. Inlined paths are
 * recorded, and so is every relative import the bundler attempts, so a bundle
 * that fails still names the files it tried, and every external specifier, which
 * is what evaluating the bundle will load.
 */
function configImportPlugin(record: ConfigImportRecord): esbuild.Plugin {
  return {
    name: 'neo-config-imports',
    setup(build) {
      build.onResolve({ filter: RELATIVE_SPECIFIER }, (args) => {
        if (!args.resolveDir) return undefined
        for (const candidate of importCandidates(args.resolveDir, args.path)) record.attempted.add(candidate)
        return undefined
      })
      build.onResolve({ filter: /^[^./]/ }, async (args) => {
        if (args.pluginData?.[PROBE_FLAG] === true) return undefined
        // The probe is a nested resolve with the same importer: it returns the
        // file this plugin needs to decide on, and the flag keeps it from recursing.
        const probe = await build.resolve(args.path, {
          kind: args.kind,
          importer: args.importer,
          resolveDir: args.resolveDir,
          pluginData: { [PROBE_FLAG]: true },
        })
        if (probe.errors.length > 0 || !BASE_SYSTEM_FILE.test(probe.path)) {
          record.external.add(args.path)
          return { path: args.path, external: true }
        }
        record.inlined.add(probe.path)
        return { path: probe.path, external: false }
      })
    },
  }
}

// The paths a failed bundle tried to import, keyed by the error that failed it.
const attemptedByFailure = new WeakMap<object, string[]>()

/**
 * The files a failed config bundle tried to import. The watch keeps them in scope, so a file created after the
 * failure wakes a resync. Empty for any other error.
 */
export function attemptedDependencyPathsOf(failure: unknown): string[] {
  if (typeof failure !== 'object' || failure === null) return []
  return attemptedByFailure.get(failure) ?? []
}

function normalizeConfigDependencyPaths(
  configPath: string,
  inputPaths: readonly string[],
  inlinedPaths: ReadonlySet<string>,
): string[] {
  const normalizePath = (filePath: string) => (existsSync(filePath) ? realpathSync(filePath) : filePath)
  const bundledPaths = inputPaths
    // Metafile inputs are relative to the canon base (absWorkingDir), not
    // the config dir; resolving them from configDir would silently corrupt
    // the watch dependency paths.
    .map((inputPath) => (inputPath.startsWith('/') ? inputPath : resolve(NEO_PACKAGE_ROOT, inputPath)))
    .map(normalizePath)
    .filter((inputPath) => !inputPath.includes('/node_modules/'))
  // An inlined base system is watched at its real path, even inside node_modules.
  // That file is how an upstream re-sync reaches this config, so it must be a watch input.
  const inlined = [...inlinedPaths].map(normalizePath)

  return Array.from(new Set([...bundledPaths, ...inlined, normalizePath(configPath)])).sort()
}

function resolveDefineConfigEntry(): string {
  const currentFile = fileURLToPath(import.meta.url)
  return resolve(dirname(currentFile), '..', 'index.ts')
}

/**
 * Bundle a config file with esbuild.
 * @param configPath - Absolute path to the config file
 * @returns The bundled JavaScript code as a string
 */
export async function bundleConfig(
  configPath: string,
  options: BundleConfigOptions = {}
): Promise<string> {
  const bundled = await bundleConfigWithDependencies(configPath, options)
  return bundled.code
}

export async function bundleConfigWithDependencies(
  configPath: string,
  options: BundleConfigOptions = {}
): Promise<BundledConfig> {
  const defineConfigEntry = resolveDefineConfigEntry()
  const record: ConfigImportRecord = { inlined: new Set(), attempted: new Set(), external: new Set() }

  let bundled: MicroBundleResult
  try {
    bundled = await microBundleWithResult(configPath, {
      format: 'esm',
      external: options.external ?? ['esbuild'],
      metafile: true,
      plugins: [configImportPlugin(record)],
      alias: Object.fromEntries(CONFIG_EXTERNALS.map(id => [id, defineConfigEntry])),
      tsconfigRaw: {
        compilerOptions: {},
      },
    })
  } catch (error) {
    if (typeof error === 'object' && error !== null) attemptedByFailure.set(error, [...record.attempted])
    throw error
  }

  return {
    code: bundled.code,
    dependencyPaths: normalizeConfigDependencyPaths(
      configPath,
      Object.keys(bundled.metafile?.inputs ?? {}),
      record.inlined,
    ),
    externalImports: [...record.external],
  }
}
