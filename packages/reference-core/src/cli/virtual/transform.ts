import { relative } from 'node:path'
import { applyTransforms } from './transforms'
import type { TransformOptions, TransformResult } from './types'

/**
 * Transform a file based on its extension and content.
 * Applies all necessary transforms to make files work with Panda CSS.
 *
 * Transform pipeline:
 * 1. MDX → JSX (if .mdx file)
 * 2. Rewrite cva/recipe imports from @reference-ui/core
 * 3. Rewrite css imports from @reference-ui/core
 */
export async function transformFile(options: TransformOptions): Promise<TransformResult> {
  const { sourcePath, destPath, content, debug, sourceDir } = options

  // Calculate relative path for import rewriting
  // If sourceDir is provided, use it; otherwise calculate from sourcePath
  const relativePath = sourceDir ? relative(sourceDir, sourcePath) : sourcePath

  // Apply all transforms via the controller
  const result = await applyTransforms({
    sourcePath,
    relativePath,
    content,
    debug,
  })

  return result
}
