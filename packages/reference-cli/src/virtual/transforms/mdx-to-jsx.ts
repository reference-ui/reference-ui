import { compile } from '@rspress/mdx-rs'
import { log } from '../../lib/log'

/**
 * Convert MDX to JS using @rspress/mdx-rs (Rust/NAPI binding).
 * ~10x faster than @mdx-js/mdx, lower memory than esbuild + unified stack.
 * Output is suitable for Panda style extraction.
 */
export async function mdxToJsx(mdxContent: string, sourceFile: string): Promise<string> {
  try {
    const result = await compile({
      value: mdxContent,
      filepath: sourceFile.endsWith('.mdx') ? sourceFile : `${sourceFile}.mdx`,
      development: false,
      root: '',
    })
    return result.code
  } catch (error) {
    log.error(
      `Failed to compile MDX file ${sourceFile}:`,
      error instanceof Error ? error.message : error
    )
    return `// Failed to compile ${sourceFile}\nexport {}\n`
  }
}
