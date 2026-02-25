import { log } from '../../lib/log'
import { transformMdx } from '../../lib/microbundle'

/**
 * Convert MDX to JS using esbuild + @mdx-js/esbuild plugin.
 * Uses Go/esbuild for heavy lifting instead of V8 compile(); typically 20-80MB lighter.
 * Output is suitable for Panda style extraction.
 */
export async function mdxToJsx(mdxContent: string, sourceFile: string): Promise<string> {
  try {
    return await transformMdx(mdxContent, sourceFile)
  } catch (error) {
    log.error(
      `Failed to compile MDX file ${sourceFile}:`,
      error instanceof Error ? error.message : error
    )
    return `// Failed to compile ${sourceFile}\nexport {}\n`
  }
}
