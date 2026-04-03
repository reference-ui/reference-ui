import { watch as fsWatch, existsSync } from 'node:fs'
import { resolve, join, dirname, basename } from 'node:path'
import { readManifest, SESSION_FILE } from './files'
import type { GetSyncSessionOptions, RefreshHandler, SyncSession } from './types'

const DEFAULT_OUT_DIR = '.reference-ui'

/**
 * Resolve the output directory to watch.
 *
 * - If `options.outDir` is supplied it is used directly (resolved relative to
 *   `cwd` if relative), supporting projects that override the default outDir.
 * - Otherwise walk up from `cwd` looking for a `.reference-ui/session.json`,
 *   falling back to `cwd/.reference-ui` when none is found.
 */
function findOutDir(options: GetSyncSessionOptions): string {
  if (options.outDir) return resolve(options.cwd, options.outDir)

  let dir = resolve(options.cwd)
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, DEFAULT_OUT_DIR)
    if (existsSync(join(candidate, SESSION_FILE))) {
      return candidate
    }
    const parent = resolve(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return join(resolve(options.cwd), DEFAULT_OUT_DIR)
}

/**
 * Attach to the Reference sync session for the given project root.
 *
 * Watches the `.reference-ui` output directory (or the path given by
 * `options.outDir`) for changes and fires `onRefresh` handlers each time a
 * logical build transitions to `ready`.
 *
 * The watcher targets the **directory**, not the file, so atomic rename-based
 * writes (which replace the inode) are detected reliably on Linux/inotify as
 * well as macOS/FSEvents.
 *
 * If `outDir` does not exist yet when `getSyncSession` is called (e.g. the
 * bundler plugin starts before `ref sync` has created the output directory),
 * the watcher automatically promotes itself once the directory appears — no
 * polling required.
 *
 * ```ts
 * import { getSyncSession } from '@reference-ui/core'
 *
 * const session = getSyncSession({ cwd: process.cwd() })
 * const stop = session.onRefresh(event => {
 *   // safe point for Vite/Webpack invalidation
 * })
 * ```
 */
export function getSyncSession(options: GetSyncSessionOptions): SyncSession {
  const outDir = findOutDir(options)
  const handlers = new Set<RefreshHandler>()
  let lastBuildState: string | null = null
  let watcher: ReturnType<typeof fsWatch> | null = null

  function checkForRefresh(): void {
    const manifest = readManifest(outDir)
    if (!manifest) return

    if (manifest.buildState === 'ready' && lastBuildState !== 'ready') {
      lastBuildState = 'ready'
      const event = { changedOutputs: [] }
      for (const handler of handlers) {
        try {
          handler(event)
        } catch {
          // Isolate handler errors so one bad plugin cannot block others.
        }
      }
    } else {
      lastBuildState = manifest.buildState
    }
  }

  /**
   * Watch `outDir` for any change to `session.json`.
   * Using a directory watcher (rather than a file watcher) ensures that
   * atomic renames — which replace the inode — are still detected.
   */
  function watchOutDir(): void {
    try {
      const fw = fsWatch(outDir, { persistent: false }, (_, filename) => {
        if (filename === SESSION_FILE) checkForRefresh()
      })
      fw.on('error', () => {})
      watcher = fw
    } catch {
      // outDir may have been removed (e.g. ref clean); nothing to do.
    }
  }

  function startWatching(): void {
    if (existsSync(outDir)) {
      watchOutDir()
      return
    }

    // outDir absent — watch its parent so we can promote once it is created.
    const parent = dirname(outDir)
    const outDirName = basename(outDir)
    if (!existsSync(parent)) return

    try {
      const probe = fsWatch(parent, { persistent: false }, (_, filename) => {
        if (filename === outDirName && existsSync(outDir)) {
          probe.close()
          watcher = null
          watchOutDir()
          checkForRefresh()
        }
      })
      probe.on('error', () => {})
      watcher = probe
    } catch {
      // Ignore — parent may not be watchable.
    }
  }

  startWatching()

  return {
    onRefresh(handler: RefreshHandler): () => void {
      handlers.add(handler)
      return () => {
        handlers.delete(handler)
      }
    },

    dispose(): void {
      watcher?.close()
      watcher = null
      handlers.clear()
    },
  }
}
