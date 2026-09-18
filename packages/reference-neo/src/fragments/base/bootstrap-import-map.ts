// Import map for fragment bundles that run during Neo sync bootstrap.
// It takes nothing and emits module id aliases pointing at the Neo author entry.
// Authors import author calls from Neo ids before any generated package exists.

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/**
 * Import map for fragment bundles that run during sync bootstrap.
 *
 * At this point no generated package exists under `.reference-ui/` yet. We still
 * need to execute user fragment files so token, font, keyframe, and pattern
 * collectors can build the evaluated spec. This map points those imports back
 * at the Neo-owned author entry so fragment execution can happen first.
 */
export function getFragmentBootstrapImportMap(): Record<string, string> {
  const authorEntry = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'author', 'index.ts')

  return {
    '@reference-ui/neo': authorEntry,
    '@reference-ui/neo/config': authorEntry,
    '@reference-ui/system': authorEntry,
    '@reference-ui/core/config': authorEntry,
    '@reference-ui/cli/config': authorEntry,
  }
}
