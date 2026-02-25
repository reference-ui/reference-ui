import { extname } from 'node:path'

const CORE_PACKAGE = '@reference-ui/react'

export interface ApplyTransformsOptions {
  /**
   * Source file path (for determining transforms to apply)
   */
  sourcePath: string

  /**
   * Relative path from user's project root (for import path calculations)
   */
  relativePath: string

  /**
   * File content to transform
   */
  content: string

  /**
   * Enable debug logging
   */
  debug?: boolean
}

export interface ApplyTransformsResult {
  /**
   * Transformed content
   */
  content: string

  /**
   * New file extension if changed (e.g., .mdx -> .jsx)
   */
  extension?: string

  /**
   * Whether any transforms were applied
   */
  transformed: boolean
}

/**
 * Apply all transforms to a file in the correct order.
 *
 * Transform pipeline:
 * 1. MDX → JSX (if .mdx file)
 * 2. Rewrite cva/recipe imports from @reference-ui/core
 * 3. Rewrite css imports from @reference-ui/core
 *
 * This ensures Panda CSS can properly scan the virtual files.
 */
export async function applyTransforms(
  options: ApplyTransformsOptions
): Promise<ApplyTransformsResult> {
  const { sourcePath, relativePath, content, debug } = options
  const ext = extname(sourcePath)

  let transformedContent = content
  let newExtension: string | undefined
  let wasTransformed = false

  // Step 1: MDX → JSX transformation
  if (ext === '.mdx') {
    const { mdxToJsx } = await import('./mdx-to-jsx')
    transformedContent = await mdxToJsx(transformedContent, relativePath)
    newExtension = '.jsx'
    wasTransformed = true
  }

  // Step 2 & 3: Apply Panda-specific import rewrites to JS/TS/JSX/TSX files
  // These transforms are applied AFTER MDX compilation (so .jsx from .mdx gets rewritten too)
  const finalExt = newExtension || ext
  if (['.js', '.jsx', '.ts', '.tsx'].includes(finalExt)) {
    const originalContent = transformedContent

    if (transformedContent.includes(CORE_PACKAGE)) {
      const { rewriteCvaImports } = await import('./rewrite-cva-imports')
      const { rewriteCssImports } = await import('./rewrite-css-imports')

      // Rewrite cva/recipe imports
      transformedContent = await rewriteCvaImports(transformedContent, relativePath)

      // Rewrite css imports
      transformedContent = await rewriteCssImports(transformedContent, relativePath)
    }

    if (transformedContent !== originalContent) {
      wasTransformed = true
    }
  }

  return {
    content: transformedContent,
    extension: newExtension,
    transformed: wasTransformed,
  }
}

// Re-export individual transforms for direct use if needed
export { mdxToJsx } from './mdx-to-jsx'
export { rewriteCvaImports } from './rewrite-cva-imports'
export { rewriteCssImports } from './rewrite-css-imports'
