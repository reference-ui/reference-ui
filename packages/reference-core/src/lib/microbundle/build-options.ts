import type * as esbuild from 'esbuild'
import { DEFAULT_EXTERNALS } from './externals'
import { getPlugins } from './plugins'
import type { MicroBundleOptions } from './types'

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

  // Esbuild 0.27 requires external to be string[] (no RegExp)
  const externalStrings = (Array.isArray(external) ? external : []).filter(
    (e): e is string => typeof e === 'string'
  )

  return {
    entryPoints: [entryPath],
    bundle: true,
    format,
    platform,
    target,
    write: false,
    external: externalStrings,
    plugins: getPlugins(options),
    minify,
    keepNames,
    treeShaking,
    splitting: false,
    mainFields,
    conditions,
  }
}
