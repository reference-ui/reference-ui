import * as esbuild from 'esbuild'

export interface MicroBundleOptions {
  /** Modules to leave as require/import (not bundled). */
  external?: string[]
  format?: 'esm' | 'cjs' | 'iife'
  platform?: 'node' | 'browser' | 'neutral'
  target?: string | string[]
  minify?: boolean
  keepNames?: boolean
  treeShaking?: boolean
  mainFields?: string[]
  conditions?: string[]
}

const DEFAULT_EXTERNALS: string[] = []

/** Externals for bundling the Panda config entry (avoids bundling Panda CLI deps). Internal to microBundle. */
const PANDA_BUNDLE_EXTERNALS: string[] = [
  '@pandacss/dev',
  'esbuild',
  'fast-glob',
  'tsdown',
  'rolldown',
  'unconfig',
  'unrun',
  'birpc',
]

/**
 * Micro-bundle the Panda config entry. Uses Panda-specific externals internally.
 */
export async function microBundlePanda(entryPath: string): Promise<string> {
  return microBundle(entryPath, { external: PANDA_BUNDLE_EXTERNALS })
}

/**
 * Micro-bundle an entry file with esbuild and return the output as a string.
 * Uses in-memory output (write: false) so no temp file is created.
 *
 * @param entryPath - Absolute path to the entry file
 * @param options - Optional esbuild overrides (externals, format, etc.)
 * @returns The bundled code as string (ESM by default)
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
    throw new Error('esbuild produced no output')
  }
  return output.text
}
