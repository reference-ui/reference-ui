import { build } from 'esbuild'
import { writeFileAtomic } from '../../lib/fs/write-file-atomic'

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
  const result = await build({
    entryPoints: [srcPath],
    write: false,
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    jsx: 'automatic',
    jsxImportSource: 'react',
    bundle: false,
    sourcemap: false,
    logLevel: 'warning',
  })

  const [outputFile] = result.outputFiles ?? []
  if (!outputFile) {
    throw new Error(`esbuild produced no output for ${srcPath}`)
  }

  writeFileAtomic(finalDestPath, outputFile.text, 'utf-8')
}
