// Default esbuild option assembly for the Neo microbundle seam.
// It takes an entry plus overrides and emits a full esbuild build config.
// This module is a Neo-owned copy of the core build options.

import type * as esbuild from 'esbuild'
import { DEFAULT_EXTERNALS } from './externals.ts'
import { getPlugins } from './plugins/index.ts'
import type { MicroBundleOptions } from './types.ts'

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
