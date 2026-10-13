// Bundling for Neo ui.config files via esbuild.
// It takes a config path and emits bundled code plus local dependency paths.
// A published base system imported by bare specifier is inlined, so every load
// reads its current file; all other packages stay external.
// It began as a Neo-owned copy of the core config bundler with a Neo-local entry.

import { microBundleWithResult, NEO_PACKAGE_ROOT } from '../lib/microbundle/index.ts'
import { CONFIG_EXTERNALS } from './constants.ts'
import type * as esbuild from 'esbuild'
import { existsSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

export interface BundleConfigOptions {
  /** Modules to leave as external (not bundled). */
  external?: string[]
}

export interface BundledConfig {
  code: string
  dependencyPaths: string[]
}

// A published base system is a `baseSystem.mjs` (or `.js`) data module. Inlining
// it makes esbuild read the file on every bundle, so Node's ESM cache cannot pin
// the first-loaded upstream into a later load in the same process.
const BASE_SYSTEM_FILE = /(?:^|[\\/])baseSystem\.m?js$/

// Marks the nested resolve that learns where a bare specifier lands, so the
// plugin steps aside for it instead of recursing into itself.
const PROBE_FLAG = 'neoConfigBareProbe'

/**
 * esbuild plugin that settles every bare specifier in a config bundle. A
 * published base system resolves to its file and is inlined; any other package
 * stays an external import, as `packages: 'external'` left it. Inlined paths are
 * recorded so they can be kept out of the watch dependency list.
 */
function bareSpecifierPlugin(inlinedPaths: Set<string>): esbuild.Plugin {
  return {
    name: 'neo-config-bare-specifiers',
    setup(build) {
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
          return { path: args.path, external: true }
        }
        inlinedPaths.add(probe.path)
        return { path: probe.path, external: false }
      })
    },
  }
}

function normalizeConfigDependencyPaths(
  configPath: string,
  inputPaths: readonly string[],
  inlinedPaths: ReadonlySet<string>,
): string[] {
  const normalizePath = (filePath: string) => (existsSync(filePath) ? realpathSync(filePath) : filePath)
  // Inlined base systems stay out of the watch scope: bare imports never were in it.
  const inlined = new Set([...inlinedPaths].map(normalizePath))

  return Array.from(
    new Set(
      inputPaths
        // Metafile inputs are relative to the canon base (absWorkingDir), not
        // the config dir; resolving them from configDir would silently corrupt
        // the watch dependency paths.
        .map((inputPath) => (inputPath.startsWith('/') ? inputPath : resolve(NEO_PACKAGE_ROOT, inputPath)))
        .map(normalizePath)
        .filter((inputPath) => !inputPath.includes('/node_modules/'))
        .filter((inputPath) => !inlined.has(inputPath))
        .concat(normalizePath(configPath)),
    ),
  ).sort()
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
  const inlinedPaths = new Set<string>()

  const bundled = await microBundleWithResult(configPath, {
    format: 'esm',
    external: options.external ?? ['esbuild'],
    metafile: true,
    plugins: [bareSpecifierPlugin(inlinedPaths)],
    alias: Object.fromEntries(CONFIG_EXTERNALS.map(id => [id, defineConfigEntry])),
    tsconfigRaw: {
      compilerOptions: {},
    },
  })

  return {
    code: bundled.code,
    dependencyPaths: normalizeConfigDependencyPaths(
      configPath,
      Object.keys(bundled.metafile?.inputs ?? {}),
      inlinedPaths,
    ),
  }
}
