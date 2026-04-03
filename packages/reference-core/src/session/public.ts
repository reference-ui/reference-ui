import { watch as fsWatch, existsSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
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
 * Watches `.reference-ui/session.json` (or the path given by `options.outDir`)
 * for changes and fires `onRefresh` handlers each time a logical build
 * transitions to `ready`.
 *
 * If `session.json` does not exist yet when `getSyncSession` is called (e.g.
 * the bundler plugin starts before `ref sync` has written the manifest), the
 * watcher automatically promotes itself from a directory probe to a file
 * watcher the moment the file appears — no polling required.
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

  function attachToFile(sessionFile: string): void {
    try {
      const fw = fsWatch(sessionFile, { persistent: false }, () => {
        checkForRefresh()
      })
      fw.on('error', () => {
        // Ignore — the consumer can re-call getSyncSession if the file is gone.
      })
      watcher = fw
    } catch {
      // File may have disappeared between the existsSync check and fsWatch call.
    }
  }

  function startWatching(): void {
    const sessionFile = join(outDir, SESSION_FILE)

    if (existsSync(sessionFile)) {
      attachToFile(sessionFile)
      return
    }

    // session.json absent — watch the nearest existing ancestor directory so
    // we can promote to a file watcher the moment the file is created.
    const watchTarget = existsSync(outDir) ? outDir : dirname(outDir)
    if (!existsSync(watchTarget)) return

    try {
      const probe = fsWatch(watchTarget, { persistent: false }, () => {
        if (existsSync(sessionFile)) {
          probe.close()
          watcher = null
          attachToFile(sessionFile)
          // Catch the ready state that triggered the creation.
          checkForRefresh()
        }
      })
      probe.on('error', () => {})
      watcher = probe
    } catch {
      // Ignore — outDir may vanish (e.g. after ref clean).
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
