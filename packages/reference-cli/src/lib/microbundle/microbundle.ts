import * as esbuild from 'esbuild'
import { DEFAULT_EXTERNALS } from './externals'
import type { MicroBundleOptions } from './types'

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

  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    format,
    platform,
    target,
    write: false,
    external,
    minify,
    keepNames,
    treeShaking,
    splitting: false,
    mainFields,
    conditions,
  })

  const output = result.outputFiles?.[0]
  if (!output?.text) {
    return ''
  }
  return output.text
}
