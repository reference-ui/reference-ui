import { subscribe } from '@parcel/watcher'
import { relative, resolve } from 'node:path'
import picomatch from 'picomatch'

import { getWatchIgnoreGlobs } from './gitignore'
import { deriveWatchRoots } from './roots'
import type { FileEvent, WatchPayload } from './types'

const EVENT_MAP = {
  create: 'add' as const,
  update: 'change' as const,
  delete: 'unlink' as const,
}

export interface WatchChange {
  event: FileEvent
  path: string
  relativePath: string
  requiresFullResync: boolean
}

export interface WatchCallbacks {
  onError(error: Error): void
  onChange(change: WatchChange): void
}

export function getWatcherState(payload: WatchPayload): { include: string[]; dependencyPaths: string[]; watchRoots: string[] } {
  const { projectRoot, config } = payload
  const dependencyPaths = Array.from(new Set((config.dependencyPaths ?? []).map((path) => resolve(projectRoot, path))))

  return {
    include: config.include,
    dependencyPaths,
    watchRoots: deriveWatchRoots(projectRoot, config.include, dependencyPaths),
  }
}

export async function startWatcher(payload: WatchPayload, callbacks: WatchCallbacks): Promise<void> {
  const { projectRoot } = payload
  const { include, dependencyPaths, watchRoots } = getWatcherState(payload)
  const isMatch = picomatch(include)
  const dependencyPathSet = new Set(dependencyPaths)

  await Promise.all(
    watchRoots.map(async (watchRoot) =>
      subscribe(
        watchRoot,
        (err, events) => {
          if (err) {
            callbacks.onError(err)
            return
          }

          for (const ev of events) {
            const relativePath = relative(projectRoot, ev.path)
            const resolvedPath = resolve(ev.path)
            if (!isMatch(relativePath) && !dependencyPathSet.has(resolvedPath)) continue

            callbacks.onChange({
              event: EVENT_MAP[ev.type as keyof typeof EVENT_MAP],
              path: ev.path,
              relativePath,
              requiresFullResync: dependencyPathSet.has(resolvedPath),
            })
          }
        },
        { ignore: getWatchIgnoreGlobs(watchRoot) },
      ),
    ),
  )
}
