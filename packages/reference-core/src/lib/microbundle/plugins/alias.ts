// Exact-match module id aliasing for Neo esbuild bundles.
// It takes an id to path map and emits a resolve plugin honoring it.
// This module is a Neo-owned copy of the core alias plugin.

import type * as esbuild from 'esbuild'

/**
 * esbuild plugin that resolves given module ids to absolute paths.
 * Used when bundling config files so e.g. @reference-ui/neo → local entry.
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
