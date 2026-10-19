// Exact-match module id aliasing for Core esbuild bundles.
// It takes an id to path map and emits a resolve plugin honoring it.

import type * as esbuild from 'esbuild'

/**
 * esbuild plugin that resolves given module ids to absolute paths.
 * Used when bundling config files so e.g. @reference-ui/core → local entry.
 */
export function aliasPlugin(alias: Record<string, string>): esbuild.Plugin {
  return {
    name: 'alias',
    setup(build) {
      for (const [id, path] of Object.entries(alias)) {
        const filter = new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
        build.onResolve({ filter }, () => ({ path }))
      }
    },
  }
}
