// Import map for fragment bundles that run during Neo sync bootstrap.
// It takes nothing and emits module id aliases pointing at Neo source entries.
// Authors import author calls and react primitives before any package exists.

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/**
 * Import map for fragment bundles that run during sync bootstrap.
 *
 * At this point no generated package exists under `.reference-ui/` yet. We still
 * need to execute user fragment files so token, font, keyframe, and pattern
 * collectors can build the evaluated spec. This map points those imports back
 * at the Neo-owned author entry, and react imports at the Neo-owned react
 * source entry, so fragment execution can happen first.
 *
 * No styled ids: core aliases four because its generated primitives import
 * the box pattern, but Neo primitives resolve styles through css() with no
 * styled edge, and no fragment file imports a styled id — nothing to target.
 */
export function getFragmentBootstrapImportMap(): Record<string, string> {
  const baseDir = dirname(fileURLToPath(import.meta.url))
  const authorEntry = resolve(baseDir, '..', '..', 'author', 'index.ts')
  const reactEntry = resolve(baseDir, '..', '..', 'entry', 'react.ts')

  return {
    '@reference-ui/neo': authorEntry,
    '@reference-ui/neo/config': authorEntry,
    '@reference-ui/system': authorEntry,
    '@reference-ui/core/config': authorEntry,
    '@reference-ui/cli/config': authorEntry,
    '@reference-ui/react': reactEntry,
  }
}
