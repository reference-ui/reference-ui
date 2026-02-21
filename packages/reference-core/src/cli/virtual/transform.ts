import { extname } from 'node:path'
import { log } from '../utils/log'
import { TRANSFORM_EXTENSIONS, type SupportedInputExtension } from './config.internal'
import type { TransformOptions, TransformResult } from './types'

/**
 * Transform a file based on its extension and content.
 * Applies minimal AST transforms to make files work with Panda CSS.
 * 
 * Current transforms:
 * - MDX -> JSX (extension change + content transformation)
 * - JS/TS/TSX/JSX -> same (copied as-is)
 */
export async function transformFile(options: TransformOptions): Promise<TransformResult> {
  const { sourcePath, content, debug } = options
  const ext = extname(sourcePath) as SupportedInputExtension

  // Check if this file extension has a transform mapping
  if (TRANSFORM_EXTENSIONS.has(ext)) {
    const outputExt = TRANSFORM_EXTENSIONS.get(ext)!
    
    // MDX files should be transformed to JSX for Panda
    if (ext === '.mdx') {
      return transformMdxToJsx(content, { debug, outputExt })
    }
    
    // Files with identity mappings (e.g., .js -> .js) are kept as-is
    if (ext === outputExt) {
      return {
        content,
        transformed: false
      }
    }
  }

  // Files without a mapping are kept as-is
  return {
    content,
    transformed: false
  }
}

/**
 * Transform MDX content to JSX.
 * This is a simplified transform - we may need a full MDX parser in the future.
 * 
 * For now, we just change the extension and keep content mostly as-is,
 * since Panda CSS mainly needs to extract styled() calls and patterns.
 */
async function transformMdxToJsx(
  content: string,
  options: { debug?: boolean; outputExt: string }
): Promise<TransformResult> {
  // TODO: Implement proper MDX -> JSX transformation
  // For now, we can use a simple approach:
  // - Convert MDX frontmatter to exports
  // - Leave JSX-like content as-is
  
  log.debug('[virtual] Transforming MDX to JSX')

  // Basic transformation: just change extension for now
  // Content can mostly stay the same for Panda's purposes
  return {
    content,
    extension: options.outputExt,
    transformed: true
  }
}

/**
 * Apply AST transforms for Panda CSS-specific patterns.
 * This is where we can rewrite imports or add helpers.
 * 
 * @future
 */
export async function applyPandaTransforms(
  content: string,
  options: { debug?: boolean }
): Promise<string> {
  // TODO: Implement AST transforms for:
  // - Rewriting styled() imports
  // - Adding Panda CSS helpers
  // - Other Panda-specific patterns
  
  return content
}
