/** Internal type surface for the Reference UI Vite integration. */

import type {
  ReferenceBundlerOptions,
  ReferenceProjectPaths,
  ReferenceSyncSessionReader,
} from '../bundlers/types'

export type ReferenceViteSyncSessionReader = ReferenceSyncSessionReader

export type ReferenceViteInternals = NonNullable<ReferenceBundlerOptions['internals']>

export type ReferenceViteOptions = ReferenceBundlerOptions

/**
 * Structural Vite plugin. Not typed as `import('vite').Plugin` so it stays
 * assignable across pnpm-isolated Vite copies and the plugin's 5/6/7 peer range.
 */
export interface ReferenceVitePlugin {
  name: string
  config: (userConfig: ReferenceViteUserConfig) => { optimizeDeps: { exclude: string[] } }
  configResolved: (config: { root: string }) => void
  configureServer: (devServer: unknown) => void
  closeBundle: () => void
  handleHotUpdate: (ctx: { file: string; modules?: { length: number } }) => void | []
}

/** Subset of Vite user config read by {@link withManagedPackageExcludes}. */
export interface ReferenceViteUserConfig {
  optimizeDeps?: { exclude?: string[] }
}

export interface ReferenceViteResolvedConfig {
  root: string
}

export type ReferenceViteProjectPaths = ReferenceProjectPaths

export interface ReferenceViteUpdate {
  type: 'js-update' | 'css-update'
  path: string
  acceptedPath: string
  timestamp: number
}

export interface ReferenceViteUpdatePayload {
  type: 'update'
  updates: ReferenceViteUpdate[]
}
