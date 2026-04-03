import { readFileSync } from 'node:fs'

/**
 * Import specifiers that identify a file as a fragment file.
 * Mirrors the importFrom list in system/base/fragments.ts.
 */
const FRAGMENT_IMPORT_SPECIFIERS = [
  '@reference-ui/system',
  '@reference-ui/core/config',
  '@reference-ui/cli/config',
] as const

const FRAGMENT_IMPORT_PATTERNS: RegExp[] = FRAGMENT_IMPORT_SPECIFIERS.map(
  (id) => new RegExp(`\\bfrom\\s*['"]${id.replace(/\//g, '\\/')}['"]|\\bimport\\s*['"]${id.replace(/\//g, '\\/')}['"]`, 'm')
)

/**
 * Returns true if the file at sourcePath imports from the system fragment API.
 * Used by the virtual worker to decide whether to emit virtual:fragment:change
 * (config-only rebuild) instead of virtual:fs:change (full rebuild).
 *
 * Unlink events always return false — the file is gone so no content check is
 * possible, and the sync pipeline will re-scan on the next config run anyway.
 */
export function isFragmentFile(sourcePath: string, event: 'add' | 'change' | 'unlink'): boolean {
  if (event === 'unlink') return false
  try {
    const content = readFileSync(sourcePath, 'utf-8')
    return FRAGMENT_IMPORT_PATTERNS.some((pattern) => pattern.test(content))
  } catch {
    return false
  }
}
