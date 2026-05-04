import { readFile } from 'node:fs/promises'

/**
 * Import specifiers that classify a file as fragment-oriented config input.
 * This mirrors the fragment collector import surface in system/base/fragments.
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
 * Returns true when a watched file imports from the fragment/config surface.
 *
 * The virtual worker uses this to emit `virtual:fragment:change`, which tells
 * sync to regenerate config and Panda output without forcing the broader
 * reference rebuild path used for normal runtime source changes.
 */
export async function isFragmentFile(sourcePath: string, event: 'add' | 'change' | 'unlink'): Promise<boolean> {
  if (event === 'unlink') return false

  try {
    const content = await readFile(sourcePath, 'utf-8')
    return FRAGMENT_IMPORT_PATTERNS.some((pattern) => pattern.test(content))
  } catch {
    return false
  }
}