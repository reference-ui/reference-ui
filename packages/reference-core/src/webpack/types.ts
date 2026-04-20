/** Internal type surface for the Reference UI Webpack integration. */

import type {
  ManagedOutputWriteSubscriber,
  ReferenceBundlerOptions,
  ReferenceSyncSessionReader,
} from '../bundlers/types'

export type ReferenceWebpackSyncSessionReader = ReferenceSyncSessionReader

export interface ReferenceWebpackInternals extends NonNullable<ReferenceBundlerOptions['internals']> {
  subscribeToManagedOutputWrites?: ManagedOutputWriteSubscriber
}

export interface ReferenceWebpackOptions extends ReferenceBundlerOptions {
  internals?: ReferenceWebpackInternals
}

export interface ReferenceWebpackWatching {
  invalidate(callback?: () => void): void
}

export interface ReferenceWebpackCompiler {
  context: string
  watching?: ReferenceWebpackWatching
  options: {
    cache?: boolean | Record<string, unknown>
    resolve?: {
      alias?: Record<string, string>
    }
    module?: {
      unsafeCache?: boolean
    }
    snapshot?: {
      immutablePaths?: unknown[]
      managedPaths?: unknown[]
    }
    watchOptions?: {
      ignored?: unknown
    }
  }
  hooks: {
    watchClose: {
      tap(name: string, handler: () => void): void
    }
  }
}

export interface ReferenceWebpackPlugin {
  apply(compiler: ReferenceWebpackCompiler): void
}