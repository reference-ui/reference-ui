import { join, relative, extname } from 'node:path'
import { TRANSFORM_EXTENSIONS } from './config.internal'

/**
 * Compute the absolute path in .reference-ui/virtual/ for a source file.
 * Handles extension transforms (e.g. .mdx → .jsx).
 */
export function getVirtualPath(
  sourcePath: string,
  sourceDir: string,
  virtualDir: string
): string {
  const relPath = relative(sourceDir, sourcePath)
  const ext = extname(relPath)
  const outExt = TRANSFORM_EXTENSIONS.get(ext) ?? ext
  const base = relPath.slice(0, -ext.length)
  return join(virtualDir, base + outExt)
}
