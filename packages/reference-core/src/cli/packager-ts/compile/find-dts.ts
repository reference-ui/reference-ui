import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Recursively find the first .d.ts or .d.mts file in a directory.
 *
 * tsdown's output structure is not reliably predictable (flat vs nested, .d.ts vs .d.mts).
 * We scan for whatever declaration file tsdown produced.
 */
export function findDtsFile(dir: string): string | null {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      const found = findDtsFile(path)
      if (found) return found
    } else if (name.endsWith('.d.mts') || name.endsWith('.d.ts')) {
      return path
    }
  }
  return null
}
