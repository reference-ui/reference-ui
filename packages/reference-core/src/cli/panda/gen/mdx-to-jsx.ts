import { readFileSync } from 'node:fs'
import { compile } from '@mdx-js/mdx'

/**
 * Convert MDX to JSX using the official MDX compiler.
 * Generates JSX that Panda can scan for style extraction.
 * 
 * Strategy:
 * - Use @mdx-js/mdx to compile MDX to JSX
 * - Return the compiled JSX output
 * - Panda scans the JSX file to extract CSS
 */
export async function mdxToJSX(mdxContent: string, sourceFile: string): Promise<string> {
  try {
    // Compile MDX to JSX
    const result = await compile(mdxContent, {
      jsx: true,
      format: 'mdx',
      development: false,
    })
    
    return String(result.value)
  } catch (error) {
    console.warn(`⚠️  Failed to compile MDX file ${sourceFile}:`, error instanceof Error ? error.message : error)
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
