import { extname } from 'node:path'

const CORE_PACKAGE = '@reference-ui/react'
const REFERENCE_UI_ARTIFACT_PREFIX = '__reference__ui/'

/**
 * Virtual transform orchestration.
 *
 * This file owns the ordered pipeline and leaves the atomic rewrite/lowering
 * steps to the sibling transform modules in their own folders.
 */

export interface ApplyTransformsOptions {
  sourcePath: string
  relativePath: string
  content: string
  debug?: boolean
}

export interface ApplyTransformsResult {
  content: string
  extension?: string
  transformed: boolean
}

/**
 * Apply all transforms to a file in the correct order.
 *
 * Transform pipeline:
 * 1. MDX → JSX (if .mdx file)
 * 2. Rewrite cva/recipe imports from @reference-ui/react
 * 3. Rewrite css imports from @reference-ui/react
 * 4. Lower responsive `r` sugar in canonical css()/cva() calls
 */
export async function applyTransforms(
  options: ApplyTransformsOptions
): Promise<ApplyTransformsResult> {
  const { sourcePath, relativePath, content } = options
  const ext = extname(sourcePath)

  let transformedContent = content
  let newExtension: string | undefined
  let wasTransformed = false

  if (ext === '.mdx') {
    const { mdxToJsx } = await import('./mdx-to-jsx')
    transformedContent = await mdxToJsx(transformedContent, relativePath)
    newExtension = '.jsx'
    wasTransformed = true
  }

  const finalExt = newExtension || ext
  if (['.js', '.jsx', '.ts', '.tsx'].includes(finalExt) && transformedContent.includes(CORE_PACKAGE)) {
    const { rewriteCvaImports } = await import('./cva-imports')
    const { rewriteCssImports } = await import('./css-imports')
    const { applyResponsiveStyles } = await import('./apply-responsive-styles')
    const { neutralizeStyleCalls } = await import('./neutralize-style-calls')
    const before = transformedContent
    transformedContent = applyResponsiveStyles(
      rewriteCssImports(rewriteCvaImports(transformedContent, relativePath), relativePath),
      relativePath,
    )
    if (!relativePath.startsWith(REFERENCE_UI_ARTIFACT_PREFIX)) {
      transformedContent = neutralizeStyleCalls(transformedContent)
    }
    if (transformedContent !== before) wasTransformed = true
  }

  return {
    content: transformedContent,
    extension: newExtension,
    transformed: wasTransformed,
  }
}

export { mdxToJsx } from './mdx-to-jsx'
export { rewriteCvaImports } from './cva-imports'
export { rewriteCssImports } from './css-imports'
export { applyResponsiveStyles } from './apply-responsive-styles'
export { neutralizeStyleCalls } from './neutralize-style-calls'
