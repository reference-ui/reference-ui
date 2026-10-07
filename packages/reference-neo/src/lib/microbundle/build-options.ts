// Default esbuild option assembly for the Neo microbundle seam.
// It takes an entry plus overrides and emits a full esbuild build config.
// The working directory is pinned to the Neo package root so module
// annotation banners and metafile keys never depend on the caller's cwd.
// This module is a Neo-owned copy of the core build options.

import type * as esbuild from 'esbuild'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_EXTERNALS } from './externals.ts'
import { getPlugins } from './plugins/index.ts'
import type { MicroBundleOptions } from './types.ts'

const NEO_MANIFEST_NAME = '@reference-ui/neo'

function manifestName(dir: string): string | undefined {
  try {
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name?: unknown }
    return typeof manifest.name === 'string' ? manifest.name : undefined
  } catch {
    return undefined
  }
}

/**
 * The canon base for esbuild banners and metafile keys. Climbing from this
 * module to the `@reference-ui/neo` manifest makes src, dist, and packed
 * layouts agree on one root. A host that bundles this seam (mcp) carries no
 * Neo manifest, so the climb falls back to this module's directory — still
 * one stable base, and never the caller's cwd.
 */
function resolveCanonBase(startDir: string): string {
  let dir = startDir
  for (let depth = 0; depth < 6; depth += 1) {
    if (manifestName(dir) === NEO_MANIFEST_NAME) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return startDir
}

// The one base every emitted banner and metafile key renders relative to.
export const NEO_PACKAGE_ROOT = resolveCanonBase(dirname(fileURLToPath(import.meta.url)))

const DEFAULT_BUILD_OPTION_VALUES = {
  format: 'esm',
  platform: 'node',
  target: 'node18',
  minify: false,
  keepNames: true,
  treeShaking: true,
  metafile: false,
} as const

const DEFAULT_MAIN_FIELDS = ['module', 'main']
const DEFAULT_CONDITIONS = ['import', 'node']

function normalizeExternal(external: MicroBundleOptions['external']): string[] {
  return (Array.isArray(external) ? external : []).filter(
    (entry): entry is string => typeof entry === 'string'
  )
}

function resolveBuildOptionDefaults(options: MicroBundleOptions) {
  return {
    ...DEFAULT_BUILD_OPTION_VALUES,
    ...options,
    external: options.external ?? DEFAULT_EXTERNALS,
    mainFields: options.mainFields ?? DEFAULT_MAIN_FIELDS,
    conditions: options.conditions ?? DEFAULT_CONDITIONS,
  }
}

export function buildMicroBundleOptions(
  entryPath: string,
  options: MicroBundleOptions
): esbuild.BuildOptions {
  const resolvedOptions = resolveBuildOptionDefaults(options)

  return {
    absWorkingDir: NEO_PACKAGE_ROOT,
    entryPoints: [entryPath],
    bundle: true,
    format: resolvedOptions.format,
    platform: resolvedOptions.platform,
    target: resolvedOptions.target,
    write: false,
    // Esbuild 0.27 requires external to be string[] (no RegExp)
    external: normalizeExternal(resolvedOptions.external),
    packages: resolvedOptions.packages,
    plugins: getPlugins(options),
    minify: resolvedOptions.minify,
    keepNames: resolvedOptions.keepNames,
    treeShaking: resolvedOptions.treeShaking,
    splitting: false,
    mainFields: resolvedOptions.mainFields,
    conditions: resolvedOptions.conditions,
    metafile: resolvedOptions.metafile,
    sourcemap: resolvedOptions.sourcemap,
    outfile: resolvedOptions.outfile,
    tsconfigRaw: resolvedOptions.tsconfigRaw,
  }
}
