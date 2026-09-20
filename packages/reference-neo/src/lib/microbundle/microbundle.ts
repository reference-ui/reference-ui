// In-memory esbuild bundling for Neo config and fragment sources.
// It takes an entry path plus overrides and emits bundled code with metafile.
// This module is a Neo-owned copy of the core microbundle seam.

import * as esbuild from 'esbuild'
import { buildMicroBundleOptions } from './build-options.ts'
import type { MicroBundleOptions, MicroBundleResult } from './types.ts'

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
  const files = result.outputFiles ?? []
  // Esbuild does not promise js-first ordering, so both outputs match by
  // extension: the map carries `.map`, the bundle is the other file.
  const codeFile = files.find(file => !file.path.endsWith('.map')) ?? files[0]
  const mapFile = files.find(file => file.path.endsWith('.map'))
  return {
    code: codeFile?.text ?? '',
    map: mapFile?.text,
    metafile: result.metafile,
  }
}
