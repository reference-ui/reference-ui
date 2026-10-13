// Watch event classification: one parcel event becomes a watch change when it
// can change the generated folder. It takes the live watch state (the real
// root, the include matcher, the config dependency files, and the match
// snapshot) and emits the change or null. Matched files and config dependencies
// match directly, a symlink target maps back to the link it serves, and a
// directory event counts when it can carry matches in or out of scope, the one
// case parcel never reports per file.

import { statSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import type { Event as ParcelEvent } from '@parcel/watcher'
import { dirHoldsMatch, isEngineIgnoredDir, type IncludeMatcher, type MatchSnapshot } from './match.ts'

export type WatchEvent = 'add' | 'change' | 'unlink'

export interface WatchChange {
  event: WatchEvent
  path: string
  relativePath: string
}

export interface ClassifyState {
  watchRoot: string
  isMatch: IncludeMatcher
  dependencyFiles: Set<string>
  snapshot: MatchSnapshot
}

const EVENT_MAP = {
  create: 'add',
  update: 'change',
  delete: 'unlink',
} as const

function toPosix(value: string): string {
  return value.replaceAll('\\', '/')
}

// True for a relative path that names something under the watch root.
function isInside(relativePath: string): boolean {
  return relativePath !== '' && relativePath !== '..' && !relativePath.startsWith('../') && !isAbsolute(relativePath)
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

// A directory event moves matches with no per-file event: a delete drops a
// directory that the last snapshot held matches under, and a create or update
// carries a directory whose subtree holds matches now.
function isScopeDirectory(event: ParcelEvent, absolute: string, relativePath: string, state: ClassifyState): boolean {
  if (!isInside(relativePath) || isEngineIgnoredDir(relativePath)) return false
  if (event.type === 'delete') return state.snapshot.dirs.has(relativePath)
  return isDirectory(absolute) && dirHoldsMatch(state.watchRoot, relativePath, state.isMatch)
}

// The watch change one parcel event becomes, or null when it cannot touch the
// generated folder. A link target reports under the link's own relative path,
// so the change names the file the author edits.
export function classifyEvent(event: ParcelEvent, state: ClassifyState): WatchChange | null {
  const eventName = EVENT_MAP[event.type]
  const absolute = resolve(event.path)
  const relativePath = toPosix(relative(state.watchRoot, absolute))
  if (state.isMatch(relativePath) || state.dependencyFiles.has(absolute)) {
    return { event: eventName, path: event.path, relativePath }
  }
  const linkPath = state.snapshot.links.get(absolute)
  if (linkPath !== undefined && state.isMatch(linkPath)) {
    return { event: eventName, path: join(state.watchRoot, linkPath), relativePath: linkPath }
  }
  if (isScopeDirectory(event, absolute, relativePath, state)) {
    return { event: eventName, path: event.path, relativePath }
  }
  return null
}
