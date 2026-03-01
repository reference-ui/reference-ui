import { relative } from 'node:path'

/**
 * Converts an absolute path to a relative import path from refDir.
 * Strips .ts/.tsx extension and normalizes separators for use in import statements.
 */
export function toRelativeImport(refDir: string, absolutePath: string): string {
  const rel = relative(refDir, absolutePath)
    .replace(/\.tsx?$/, '')
    .replace(/\\/g, '/')
  return rel.startsWith('.') ? rel : `./${rel}`
}
