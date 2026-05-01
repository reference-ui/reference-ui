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

function shouldTransformJavaScript(ext: string, content: string): boolean {
  return ['.js', '.jsx', '.ts', '.tsx'].includes(ext) && content.includes(CORE_PACKAGE)
}

async function maybeTransformMdx(
  content: string,
  extension: string,
  relativePath: string,
): Promise<{ content: string; extension: string; transformed: boolean }> {
  if (extension !== '.mdx') {
    return { content, extension, transformed: false }
  }

  const { mdxToJsx } = await import('./mdx-to-jsx')
  return {
    content: await mdxToJsx(content, relativePath),
    extension: '.jsx',
    transformed: true,
  }
}

async function applyCorePackageTransforms(
  content: string,
  relativePath: string,
): Promise<string> {
  const { rewriteCvaImports } = await import('./cva-imports')
  const { rewriteCssImports } = await import('./css-imports')
  const { applyResponsiveStyles } = await import('./apply-responsive-styles')
  const { neutralizeStyleCalls } = await import('./neutralize-style-calls')

  const rewritten = applyResponsiveStyles(
    rewriteCssImports(rewriteCvaImports(content, relativePath), relativePath),
    relativePath,
  )

  if (relativePath.startsWith(REFERENCE_UI_ARTIFACT_PREFIX)) {
    return rewritten
  }

  return neutralizeStyleCalls(rewritten, relativePath)
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
  const sourceExtension = extname(sourcePath)
  const mdxResult = await maybeTransformMdx(content, sourceExtension, relativePath)
  let transformedContent = mdxResult.content
  const finalExtension = mdxResult.extension
  let wasTransformed = mdxResult.transformed

  if (shouldTransformJavaScript(finalExtension, transformedContent)) {
    const before = transformedContent
    transformedContent = await applyCorePackageTransforms(transformedContent, relativePath)
    if (transformedContent !== before) {
      wasTransformed = true
    }
  }

  return {
    content: transformedContent,
    extension: finalExtension === sourceExtension ? undefined : finalExtension,
    transformed: wasTransformed,
  }
}

export { mdxToJsx } from './mdx-to-jsx'
export { rewriteCvaImports } from './cva-imports'
export { rewriteCssImports } from './css-imports'
export { applyResponsiveStyles } from './apply-responsive-styles'
export { neutralizeStyleCalls } from './neutralize-style-calls'
