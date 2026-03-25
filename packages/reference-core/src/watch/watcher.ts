import { subscribe } from '@parcel/watcher'
import { relative } from 'node:path'
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
}

export interface WatchCallbacks {
  onError(error: Error): void
  onChange(change: WatchChange): void
}

export function getWatcherState(payload: WatchPayload): { include: string[]; watchRoots: string[] } {
  const { projectRoot, config } = payload
  return {
    include: config.include,
    watchRoots: deriveWatchRoots(projectRoot, config.include),
  }
}

export async function startWatcher(payload: WatchPayload, callbacks: WatchCallbacks): Promise<void> {
  const { projectRoot } = payload
  const { include, watchRoots } = getWatcherState(payload)
  const isMatch = picomatch(include)

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
            if (!isMatch(relativePath)) continue

            callbacks.onChange({
              event: EVENT_MAP[ev.type as keyof typeof EVENT_MAP],
              path: ev.path,
              relativePath,
            })
          }
        },
        { ignore: getWatchIgnoreGlobs(watchRoot) },
      ),
    ),
  )
}
