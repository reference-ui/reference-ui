import { build } from 'esbuild'

/**
 * Transform a TypeScript file to JavaScript
 */
export async function transformTypeScriptFile(
  srcPath: string,
  destPath: string
): Promise<void> {
  const finalDestPath = destPath.replace(/\.tsx?$/, match =>
    match === '.tsx' ? '.jsx' : '.js'
  )

  await build({
    entryPoints: [srcPath],
    outfile: finalDestPath,
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    jsx: 'automatic',
    jsxImportSource: 'react',
    bundle: false,
    sourcemap: false,
    logLevel: 'warning',
  })
}
