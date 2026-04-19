import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { DEFAULT_OUT_DIR } from '../constants'
import { readManifest, SESSION_FILE } from './files'
import { createSessionWatcher } from './watch'
import type { GetSyncSessionOptions, RefreshHandler, SyncSession } from './types'

/**
 * Resolve the output directory to watch.
 *
 * - If `options.outDir` is supplied it is used directly (resolved relative to
 *   `cwd` if relative), supporting projects that override the default outDir.
 * - Otherwise walk up from `cwd` looking for `session.json` next to each ancestor
 *   under the default sync output directory, falling back to that directory under
 *   `cwd` when none is found.
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
 * Watches the sync output directory (default: {@link DEFAULT_OUT_DIR}, or the
 * path given by `options.outDir`) for changes and fires `onRefresh` handlers each time a
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
  let lastReadySignature: string | null = null

  function getReadySignature(updatedAt: string, pid: number): string {
    return `${pid}:${updatedAt}`
  }

  function checkForRefresh(): void {
    const manifest = readManifest(outDir)
    if (!manifest) return

    if (manifest.buildState === 'ready') {
      const readySignature = getReadySignature(manifest.updatedAt, manifest.pid)
      if (readySignature === lastReadySignature) {
        lastBuildState = 'ready'
        return
      }

      const shouldEmit = lastBuildState !== 'ready' || readySignature !== lastReadySignature
      lastBuildState = 'ready'
      lastReadySignature = readySignature

      if (shouldEmit) {
        const event = { changedOutputs: [] }
        for (const handler of handlers) {
          try {
            handler(event)
          } catch {
            // Isolate handler errors so one bad plugin cannot block others.
          }
        }
      }
    } else {
      lastBuildState = manifest.buildState
    }
  }
  const watcher = createSessionWatcher(outDir, checkForRefresh)
  watcher.restart()

  return {
    onRefresh(handler: RefreshHandler): () => void {
      handlers.add(handler)
      return () => {
        handlers.delete(handler)
      }
    },

    dispose(): void {
      watcher.dispose()
      handlers.clear()
    },
  }
}
