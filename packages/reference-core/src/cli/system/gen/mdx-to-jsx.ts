import { readFileSync } from 'node:fs'
import { log } from '../../lib/log'
import { transformMdx } from '../../lib/microbundle'

/**
 * Convert MDX to JS using esbuild + @mdx-js/esbuild plugin.
 * Uses Go/esbuild instead of V8 compile(); typically 20-80MB lighter.
 * Output is suitable for Panda style extraction.
 */
export async function mdxToJSX(mdxContent: string, sourceFile: string): Promise<string> {
  try {
    return await transformMdx(mdxContent, sourceFile)
  } catch (error) {
    log.error(
      `⚠️  Failed to compile MDX file ${sourceFile}:`,
      error instanceof Error ? error.message : error
    )
    return `// Failed to compile ${sourceFile}\nexport {}\n`
  }
}

/**
 * Convert MDX file to JSX and return the compiled content.
 */
export async function mdxToJSXFromFile(mdxFilePath: string): Promise<string> {
  const mdxContent = readFileSync(mdxFilePath, 'utf-8')
  return mdxToJSX(mdxContent, mdxFilePath)
}
