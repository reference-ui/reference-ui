import { relative } from 'node:path'
import { applyTransforms } from './transforms'
import type { TransformOptions, TransformResult } from './types'

/**
 * Transform a file based on its extension and content.
 * Applies all necessary transforms to make files work with Panda CSS.
 */
export async function transformFile(options: TransformOptions): Promise<TransformResult> {
  const { sourcePath, content, debug, sourceDir, breakpoints } = options

  const relativePath = sourceDir ? relative(sourceDir, sourcePath) : sourcePath

  const result = await applyTransforms({
    sourcePath,
    relativePath,
    content,
    debug,
    breakpoints,
  })

  return result
}
