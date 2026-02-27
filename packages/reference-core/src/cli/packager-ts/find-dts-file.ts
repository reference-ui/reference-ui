import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Recursively find the first .d.ts or .d.mts file in a directory.
 *
 * We need this because tsdown's output structure is not reliably predictable:
 * - It may emit `.d.ts` or `.d.mts` depending on format/version
 * - The output layout can be flat (react.d.mts) or nested (src/entry/react.d.ts)
 * - When run from a linked node_modules copy (e.g. sandbox tests), tsdown may
 *   skip dts entirely or use different paths than when run from the workspace
 *
 * Rather than hardcoding an expected path like `join(tmpOut, 'react.d.mts')`,
 * we scan the temp dir for whatever declaration file tsdown actually produced.
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
