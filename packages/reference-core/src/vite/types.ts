/** Internal type surface for the Reference UI Vite integration. */

import type {
  ReferenceBundlerOptions,
  ReferenceProjectPaths,
  ReferenceSyncSessionReader,
} from '../bundlers/types'

export type ReferenceViteSyncSessionReader = ReferenceSyncSessionReader

export type ReferenceViteInternals = NonNullable<ReferenceBundlerOptions['internals']>

export type ReferenceViteOptions = ReferenceBundlerOptions

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
