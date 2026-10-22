// Import map for fragment bundles that run during Core sync bootstrap.
// It takes nothing and emits module id aliases pointing at Core source entries.
// Authors import author calls and react primitives before any package exists.

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/**
 * Import map for fragment bundles that run during sync bootstrap.
 *
 * At this point no generated package exists under `.reference-ui/` yet. We still
 * need to execute user fragment files so token, font, keyframe, and pattern
 * collectors can build the evaluated spec. This map points the core ids at the
 * core-owned root barrel, the system id at the sync-time system barrel (system-alias.ts,
 * which exports the generated entry's names), and react imports at the unbound react shim
 * (unbound primitives roster plus runtime css and recipe), so fragment execution can happen
 * first. Fragment evaluation never renders and unbound primitives throw on
 * render, so the eval-safe barrel contract holds by construction.
 *
 * No styled ids: the retired reference-core aliases four because its generated primitives import
 * the box pattern, but Core primitives resolve styles through css() with no
 * styled edge, and no fragment file imports a styled id — nothing to target.
 */
export function getFragmentBootstrapImportMap(): Record<string, string> {
  const baseDir = dirname(fileURLToPath(import.meta.url))
  const authorEntry = resolve(baseDir, '..', '..', 'index.ts')
  const systemEntry = resolve(baseDir, 'system-alias.ts')
  const reactEntry = resolve(baseDir, '..', '..', 'entry', 'react-unbound.ts')

  return {
    '@reference-ui/core': authorEntry,
    '@reference-ui/core/config': authorEntry,
    '@reference-ui/system': systemEntry,
    '@reference-ui/cli/config': authorEntry,
    '@reference-ui/react': reactEntry,
  }
}
