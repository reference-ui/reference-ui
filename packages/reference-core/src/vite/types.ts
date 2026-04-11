/** Internal type surface for the Reference UI Vite integration. */

import type {
  ReferenceBundlerOptions,
  ReferenceProjectPaths,
  ReferenceSyncSessionReader,
} from '../bundlers/types'

export type ReferenceViteSyncSessionReader = ReferenceSyncSessionReader

export type ReferenceViteInternals = NonNullable<ReferenceBundlerOptions['internals']>

export type ReferenceViteOptions = ReferenceBundlerOptions

export interface ReferenceViteUserConfig {
  optimizeDeps?: { exclude?: string[] }
}

export interface ReferenceViteResolvedConfig {
  root: string
}

export interface ReferenceViteHotUpdateContext {
  file: string
}

export interface ReferenceVitePlugin {
  name: string
  config?: (userConfig: ReferenceViteUserConfig) => {
    optimizeDeps: { exclude: string[] }
  }
  configResolved?: (config: ReferenceViteResolvedConfig) => void
  configureServer?: (devServer: ReferenceViteDevServer) => (() => void) | void
  handleHotUpdate?: (ctx: ReferenceViteHotUpdateContext) => [] | void | Promise<[] | void>
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

export interface ReferenceViteModule {
  url: string
  type: 'js' | 'css' | 'asset'
}

export interface ReferenceViteDevServer {
  ws: {
    send(payload: ReferenceViteUpdatePayload): void
  }
  moduleGraph: {
    getModulesByFile(file: string): Set<ReferenceViteModule> | undefined
    invalidateModule(
      module: ReferenceViteModule,
      seen: Set<ReferenceViteModule>,
      timestamp: number,
      isHmr: boolean
    ): void
  }
}