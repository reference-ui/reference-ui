import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'

/**
 * Transform a TypeScript file to JavaScript
 */
export async function transformTypeScriptFile(
  srcPath: string,
  destPath: string,
  rewriteImports = false
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

  if (rewriteImports) {
    const content = readFileSync(finalDestPath, 'utf-8')
    const rewritten = content
      .replace(/from ["']\.\.\/([^"']+)["']/g, 'from "./$1"')
      .replace(/import ["']\.\.\/([^"']+)["']/g, 'import "./$1"')
      .replace(/export \* from ["']\.\.\/([^"']+)["']/g, 'export * from "./$1"')
      .replace(/export {([^}]+)} from ["']\.\.\/([^"']+)["']/g, 'export {$1} from "./$2"')
    writeFileSync(finalDestPath, rewritten, 'utf-8')
  }
}
