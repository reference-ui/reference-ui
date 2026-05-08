import type { Output } from '@rspress/mdx-rs'
import { compile } from '@rspress/mdx-rs'
import { log, warnRefSync } from '../../../lib/log'

function hasNonEmptyFrontmatterObject(frontmatterJson: string): boolean {
  try {
    const parsed = JSON.parse(frontmatterJson) as Record<string, unknown>
    return Object.keys(parsed).length > 0
  } catch {
    return false
  }
}

/**
 * The native compiler often reports parse errors on stderr but still resolves with a
 * minimal fallback module (empty fragment). stderr bypasses `process.stderr`, so we
 * infer that case from the emitted shape.
 */
function isLikelySilentMdxParseFailure(mdxContent: string, result: Output): boolean {
  if (!mdxContent.trim()) return false
  if (result.html.length > 0) return false
  if (hasNonEmptyFrontmatterObject(result.frontmatter)) return false
  return /^import \{[^\n]*\} from "@mdx-js\/react";\s*\nfunction _createMdxContent/m.test(
    result.code
  )
}

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

    if (isLikelySilentMdxParseFailure(mdxContent, result)) {
      warnRefSync(
        `MDX Parse Warning: ${sourceFile}`
      )
    }

    return result.code
  } catch (error) {
    log.error(
      `Failed to compile MDX file ${sourceFile}:`,
      error instanceof Error ? error.message : error
    )
    return `// Failed to compile ${sourceFile}\nexport {}\n`
  }
}
