import type * as esbuild from 'esbuild'
import { DEFAULT_EXTERNALS } from './externals'
import { getPlugins } from './plugins'
import type { MicroBundleOptions } from './types'

function normalizeExternal(external: MicroBundleOptions['external']): string[] {
  return (Array.isArray(external) ? external : []).filter(
    (entry): entry is string => typeof entry === 'string'
  )
}

export function buildMicroBundleOptions(
  entryPath: string,
  options: MicroBundleOptions
): esbuild.BuildOptions {
  const {
    external = DEFAULT_EXTERNALS,
    format = 'esm',
    platform = 'node',
    target = 'node18',
    minify = false,
    keepNames = true,
    treeShaking = true,
    mainFields = ['module', 'main'],
    conditions = ['import', 'node'],
  } = options

  return {
    entryPoints: [entryPath],
    bundle: true,
    format,
    platform,
    target,
    write: false,
    // Esbuild 0.27 requires external to be string[] (no RegExp)
    external: normalizeExternal(external),
    plugins: getPlugins(options),
    minify,
    keepNames,
    treeShaking,
    splitting: false,
    mainFields,
    conditions,
  }
}
