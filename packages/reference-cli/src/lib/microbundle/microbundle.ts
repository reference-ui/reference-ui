import * as esbuild from 'esbuild'
import { DEFAULT_EXTERNALS } from './externals'
import { getPlugins } from './plugins'
import type { MicroBundleOptions } from './types'

function buildOptions(
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
    external,
    plugins: getPlugins(options),
    minify,
    keepNames,
    treeShaking,
    splitting: false,
    mainFields,
    conditions,
  }
}

/**
 * Micro-bundle an entry file with esbuild and return the output as a string.
 * Uses in-memory output (write: false) so no temp file is created.
 *
 * @param entryPath - Absolute path to the entry file
 * @param options - Optional esbuild overrides (externals, format, etc.)
 * @returns The bundled JavaScript code as a string (ESM format by default)
 */
export async function microBundle(
  entryPath: string,
  options: MicroBundleOptions = {}
): Promise<string> {
  const buildOpts = buildOptions(entryPath, options)
  const result = await esbuild.build(buildOpts)
  const output = result.outputFiles?.[0]
  return output?.text ?? ''
}
