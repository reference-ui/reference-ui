import { compile } from '@mdx-js/mdx'
import { log } from '../../utils/log'

/**
 * Convert MDX to JSX using the official MDX compiler.
 * Generates JSX that Panda can scan for style extraction.
 *
 * Strategy:
 * - Use @mdx-js/mdx to compile MDX to JSX
 * - Return the compiled JSX output
 * - Panda scans the JSX file to extract CSS
 */
export async function mdxToJsx(mdxContent: string, sourceFile: string): Promise<string> {
  try {
    // Compile MDX to JSX
    const result = await compile(mdxContent, {
      jsx: true,
      format: 'mdx',
      development: false,
    })

    log.debug(`[virtual] Compiled MDX to JSX: ${sourceFile}`)
    return String(result.value)
  } catch (error) {
    log.error(
      `Failed to compile MDX file ${sourceFile}:`,
      error instanceof Error ? error.message : error
    )
    return `// Failed to compile ${sourceFile}\nexport {}\n`
  }
}
