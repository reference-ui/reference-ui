import { subscribe, type Event as ParcelEvent } from '@parcel/watcher'
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

export interface WatchSubscription {
  unsubscribe(): Promise<void>
}

export interface WatchEventHandlerOptions {
  projectRoot: string
  isMatch: (path: string) => boolean
  dependencyPathSet: Set<string>
  callbacks: WatchCallbacks
}

export function handleWatchEvents(
  err: Error | null,
  events: ParcelEvent[] | undefined,
  options: WatchEventHandlerOptions,
): void {
  if (err) {
    options.callbacks.onError(err)
    return
  }

  if (!events) return

  for (const ev of events) {
    const relativePath = relative(options.projectRoot, ev.path)
    const resolvedPath = resolve(ev.path)
    if (!options.isMatch(relativePath) && !options.dependencyPathSet.has(resolvedPath)) continue

    options.callbacks.onChange({
      event: EVENT_MAP[ev.type as keyof typeof EVENT_MAP],
      path: ev.path,
      relativePath,
      requiresFullResync: options.dependencyPathSet.has(resolvedPath),
    })
  }
}

export function getWatcherState(payload: WatchPayload): {
  include: string[]
  dependencyPaths: string[]
  watchRoots: string[]
} {
  const { projectRoot, config } = payload
  const dependencyPaths = Array.from(new Set((config.dependencyPaths ?? []).map((path) => resolve(projectRoot, path))))

  return {
    include: config.include,
    dependencyPaths,
    watchRoots: deriveWatchRoots(projectRoot, config.include, dependencyPaths),
  }
}

export async function startWatcher(payload: WatchPayload, callbacks: WatchCallbacks): Promise<WatchSubscription> {
  const { projectRoot } = payload
  const { include, dependencyPaths, watchRoots } = getWatcherState(payload)
  const isMatch = picomatch(include)
  const dependencyPathSet = new Set(dependencyPaths)

  const subscriptions = await Promise.all(
    watchRoots.map((watchRoot) =>
      subscribe(
        watchRoot,
        (err, events) =>
          handleWatchEvents(err, events, {
            projectRoot,
            isMatch,
            dependencyPathSet,
            callbacks,
          }),
        { ignore: getWatchIgnoreGlobs(watchRoot) },
      ),
    ),
  )

  return {
    async unsubscribe() {
      await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            await sub.unsubscribe()
          } catch {
            // Ignore unsubscribe errors during teardown
          }
        }),
      )
    },
  }
}

