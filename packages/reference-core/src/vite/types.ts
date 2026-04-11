/** Internal type surface for the Reference UI Vite integration. */

import type { GetSyncSessionOptions, SyncSession } from '../session'

export type ReferenceViteSyncSessionReader = (options: GetSyncSessionOptions) => SyncSession

export interface ReferenceViteInternals {
  getSyncSession?: ReferenceViteSyncSessionReader
}

export interface ReferenceViteOptions {
  internals?: ReferenceViteInternals
}

export interface ReferenceVitePlugin {
  name: string
  config?: (userConfig: any) => {
    optimizeDeps: { exclude: string[] }
  }
  configResolved?: (config: any) => void
  configureServer?: (devServer: any) => (() => void) | void
  handleHotUpdate?: (ctx: any) => [] | void | Promise<[] | void>
}

export interface ReferenceViteProjectPaths {
  projectRoot: string
  outDir: string
  managedOutputRoots: Set<string>
}

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