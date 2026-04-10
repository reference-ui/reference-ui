import { resolve } from 'node:path'
import { getSyncSession, type GetSyncSessionOptions, type SyncSession } from '../session'

const MANAGED_PACKAGES = [
  '@reference-ui/react',
  '@reference-ui/system',
  '@reference-ui/styled',
  '@reference-ui/types',
] as const

const DEFAULT_OUT_DIR = '.reference-ui'

interface ReferenceViteInternals {
  getSyncSession?: (options: GetSyncSessionOptions) => SyncSession
}

export interface ReferenceViteOptions {
  internals?: ReferenceViteInternals
}

export function referenceVite(options: ReferenceViteOptions = {}): ReferenceVitePlugin {
  let rootDir = resolve(process.cwd())
  let outDir = resolve(rootDir, DEFAULT_OUT_DIR)
  let managedRoots = createManagedRoots(outDir)
  const pendingFiles = new Set<string>()
  const getSession = options.internals?.getSyncSession ?? getSyncSession
  let server: ReferenceViteDevServer | null = null
  let session: SyncSession | null = null

  const flushPendingChanges = () => {
    if (!server || pendingFiles.size === 0) return
    const updates = collectUpdates(server, pendingFiles)
    pendingFiles.clear()

    if (updates.length === 0) {
      return
    }

    const payload: { type: 'update'; updates: ReferenceViteUpdate[] } = {
      type: 'update',
      updates,
    }
    server.ws.send(payload)
  }

  return {
    name: 'reference-ui:vite',

    config(userConfig: { optimizeDeps?: { exclude?: string[] } }): { optimizeDeps: { exclude: string[] } } {
      const existingExcludes = userConfig.optimizeDeps?.exclude ?? []
      return {
        optimizeDeps: {
          exclude: Array.from(new Set([...existingExcludes, ...MANAGED_PACKAGES])),
        },
      }
    },

    configResolved(config: { root: string }) {
      rootDir = resolve(config.root)
      outDir = resolve(rootDir, DEFAULT_OUT_DIR)
      managedRoots = createManagedRoots(outDir)
    },

    configureServer(devServer: any) {
      server = devServer as ReferenceViteDevServer
      session = getSession({ cwd: rootDir, outDir })
      const unsubscribe = session.onRefresh(() => {
        flushPendingChanges()
      })

      return () => {
        unsubscribe()
        session?.dispose()
        session = null
        server = null
        pendingFiles.clear()
      }
    },

    handleHotUpdate(ctx: { file: string }) {
      if (!isManagedOutputFile(ctx.file, managedRoots)) return
      pendingFiles.add(normalizePath(ctx.file))
      return []
    },
  }
}

function createManagedRoots(outDir: string): Set<string> {
  return new Set(['react', 'system', 'styled', 'types'].map(name => normalizePath(resolve(outDir, name))))
}

function isManagedOutputFile(file: string, managedRoots: Set<string>): boolean {
  const normalizedFile = normalizePath(file)
  for (const root of managedRoots) {
    if (normalizedFile === root || normalizedFile.startsWith(`${root}/`)) {
      return true
    }
  }
  return false
}

function collectUpdates(server: ReferenceViteDevServer, pendingFiles: Set<string>): ReferenceViteUpdate[] {
  const timestamp = Date.now()
  const updates: ReferenceViteUpdate[] = []
  const seen = new Set<string>()

  for (const file of pendingFiles) {
    const modules = server.moduleGraph.getModulesByFile(file)
    if (!modules) continue

    for (const module of modules) {
      server.moduleGraph.invalidateModule(module, new Set<ReferenceViteModule>(), timestamp, true)

      const update = toViteUpdate(module, timestamp)
      if (!update) continue

      const key = `${update.type}:${update.path}:${update.acceptedPath}`
      if (seen.has(key)) continue
      seen.add(key)
      updates.push(update)
    }
  }

  return updates
}

function toViteUpdate(module: ReferenceViteModule, timestamp: number): ReferenceViteUpdate | null {
  if (!module.url) return null

  return {
    type: module.type === 'css' ? 'css-update' : 'js-update',
    path: module.url,
    acceptedPath: module.url,
    timestamp,
  }
}

function normalizePath(file: string): string {
  return file.replace(/\\/g, '/')
}

interface ReferenceVitePlugin {
  name: string
  config?: (userConfig: any) => {
    optimizeDeps: { exclude: string[] }
  }
  configResolved?: (config: any) => void
  configureServer?: (devServer: any) => (() => void) | void
  handleHotUpdate?: (ctx: any) => [] | void | Promise<[] | void>
}

interface ReferenceViteUpdate {
  type: 'js-update' | 'css-update'
  path: string
  acceptedPath: string
  timestamp: number
}

interface ReferenceViteModule {
  url: string
  type: 'js' | 'css' | 'asset'
}

interface ReferenceViteDevServer {
  ws: {
    send(payload: { type: 'update'; updates: ReferenceViteUpdate[] }): void
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