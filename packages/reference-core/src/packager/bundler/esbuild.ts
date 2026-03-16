import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { writeIfChanged } from './files'

const ESBUILD_EXTERNALS = [
  '__REFERENCE_UI_TYPES_RUNTIME__',
  'react',
  'react-dom',
  'react/jsx-runtime',
  '@reference-ui/styled',
  '@reference-ui/styled/*',
  '@reference-ui/types',
  '@reference-ui/types/*',
  // Node build-tools (fragments scanner/runner) must stay external for neutral bundles.
  'node:fs',
  'node:path',
  'node:crypto',
  'node:url',
  'url',
  'fast-glob',
  'esbuild',
]

/**
 * Bundle a package using esbuild (for packages that need bundling).
 * Only writes the main JS output if content changed.
 */
export async function bundleWithEsbuild(
  coreDir: string,
  targetDir: string,
  entryPath: string,
  outfile: string
): Promise<void> {
  const destPath = resolve(targetDir, outfile)

  const result = await build({
    entryPoints: [resolve(coreDir, entryPath)],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    jsx: 'automatic',
    jsxImportSource: 'react',
    external: ESBUILD_EXTERNALS,
    sourcemap: false,
    treeShaking: true,
    minify: false,
    logLevel: 'warning',
  })

  const [outputFile] = result.outputFiles ?? []
  if (!outputFile) throw new Error('esbuild produced no output')

  mkdirSync(dirname(destPath), { recursive: true })
  writeIfChanged(destPath, outputFile.text)
}
