import { extname } from 'node:path'

const CORE_PACKAGE = '@reference-ui/react'

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
    const { rewriteCvaImports } = await import('./rewrite-cva-imports')
    const { rewriteCssImports } = await import('./rewrite-css-imports')
    const before = transformedContent
    transformedContent = rewriteCssImports(rewriteCvaImports(transformedContent, relativePath), relativePath)
    if (transformedContent !== before) wasTransformed = true
  }

  return {
    content: transformedContent,
    extension: newExtension,
    transformed: wasTransformed,
  }
}

export { mdxToJsx } from './mdx-to-jsx'
export { rewriteCvaImports } from './rewrite-cva-imports'
export { rewriteCssImports } from './rewrite-css-imports'
