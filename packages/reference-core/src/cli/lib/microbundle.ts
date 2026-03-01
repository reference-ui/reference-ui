import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as esbuild from 'esbuild'

export interface MicroBundleOptions {
  /** Modules to leave as require/import (not bundled). Defaults to heavy build-tool deps. */
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

/** Default externals: heavy build-tool / CLI deps we typically don't want to inline. */
const DEFAULT_EXTERNALS: string[] = [
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
    // No output means the file has no executable code (comments only, type-only, etc.)
    // This is fine - just return empty string
    return ''
  }
  return output.text
}

/**
 * Transform MDX to JS using esbuild + @mdx-js/esbuild plugin.
 * Uses Go/esbuild for the heavy lifting instead of V8 compile(); typically 20-80MB lighter.
 *
 * @param mdxContent - Raw MDX string
 * @param sourceFile - Path used for error messages and resolution context
 * @returns Compiled JS/JSX output suitable for Panda scanning
 */
export async function transformMdx(
  mdxContent: string,
  sourceFile: string
): Promise<string> {
  const mdx = (await import('@mdx-js/esbuild')).default
  const tmpDir = mkdtempSync(join(tmpdir(), 'mdx-'))
  const tmpPath = join(tmpDir, 'input.mdx')

  try {
    writeFileSync(tmpPath, mdxContent, 'utf-8')

    const result = await esbuild.build({
      entryPoints: [tmpPath],
      bundle: false,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      write: false,
      plugins: [mdx({ jsxImportSource: 'react' })],
    })

    const output = result.outputFiles?.[0]?.text
    if (!output) return ''
    return output
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}
