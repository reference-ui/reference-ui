import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { writeIfChanged } from './files'

/**
 * Bundle a package using esbuild (for packages that need bundling).
 * Only writes the main JS output if content changed, to avoid Vite invalidating everything.
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
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    sourcemap: false,
    treeShaking: true,
    minify: false,
    logLevel: 'warning',
  })

  const out = result.outputFiles?.[0]
  if (!out) throw new Error('esbuild produced no output')

  mkdirSync(targetDir, { recursive: true })
  writeIfChanged(destPath, out.text)
}
