import * as esbuild from 'esbuild'
import { buildMicroBundleOptions } from './build-options'
import type { MicroBundleOptions, MicroBundleResult } from './types'

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
  const result = await microBundleWithResult(entryPath, options)
  return result.code
}

export async function microBundleWithResult(
  entryPath: string,
  options: MicroBundleOptions = {}
): Promise<MicroBundleResult> {
  const buildOpts = buildMicroBundleOptions(entryPath, options)
  const result = await esbuild.build(buildOpts)
  const output = result.outputFiles?.[0]
  return {
    code: output?.text ?? '',
    metafile: result.metafile,
  }
}
