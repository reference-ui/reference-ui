import { watch as fsWatch, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { readManifest, SESSION_FILE } from './files'
import type { GetSyncSessionOptions, RefreshHandler, SyncSession } from './types'

const DEFAULT_OUT_DIR = '.reference-ui'

/**
 * Discover the `.reference-ui` output directory by walking up from `cwd`.
 * Returns the first ancestor directory that contains `session.json`, or falls
 * back to `cwd/.reference-ui` if none is found.
 */
function findOutDir(cwd: string): string {
  let dir = resolve(cwd)
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, DEFAULT_OUT_DIR)
    if (existsSync(join(candidate, SESSION_FILE))) {
      return candidate
    }
    const parent = resolve(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return join(resolve(cwd), DEFAULT_OUT_DIR)
}

/**
 * Attach to the Reference sync session for the given project root.
 *
 * Watches `.reference-ui/session.json` for changes and fires `onRefresh`
 * handlers each time a logical build transitions to `ready`.
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
  const outDir = findOutDir(options.cwd)
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

  function startWatching(): void {
    const sessionFile = join(outDir, SESSION_FILE)
    if (!existsSync(sessionFile)) return
    try {
      watcher = fsWatch(sessionFile, () => {
        checkForRefresh()
      })
      watcher.on('error', () => {
        // Ignore watcher errors — the consumer can re-call getSyncSession.
      })
    } catch {
      // File may disappear between the existsSync check and the watch call.
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
