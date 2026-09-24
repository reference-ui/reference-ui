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
 * at the Neo-owned root barrel, and react imports at the unbound react shim
 * (E2 roster plus runtime css and recipe), so fragment execution can happen
 * first. Fragment evaluation never renders and unbound primitives throw on
 * render, so the eval-safe barrel contract holds by construction.
 *
 * No styled ids: core aliases four because its generated primitives import
 * the box pattern, but Neo primitives resolve styles through css() with no
 * styled edge, and no fragment file imports a styled id — nothing to target.
 */
export function getFragmentBootstrapImportMap(): Record<string, string> {
  const baseDir = dirname(fileURLToPath(import.meta.url))
  const authorEntry = resolve(baseDir, '..', '..', 'index.ts')
  const reactEntry = resolve(baseDir, '..', '..', 'entry', 'react-unbound.ts')

  return {
    '@reference-ui/neo': authorEntry,
    '@reference-ui/neo/config': authorEntry,
    '@reference-ui/system': authorEntry,
    '@reference-ui/core/config': authorEntry,
    '@reference-ui/cli/config': authorEntry,
    '@reference-ui/react': reactEntry,
  }
}
