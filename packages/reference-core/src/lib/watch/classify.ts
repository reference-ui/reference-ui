// Watch event classification: one parcel event becomes a watch change when it
// can change the generated folder. It takes the live watch state (the real
// root, the include matcher, the config dependency files, and the match
// snapshot) and emits the change or null. Matched files and config dependencies
// match directly, a symlink target maps back to the link it serves, and a
// directory event counts when it can carry matches in or out of scope, the one
// case parcel never reports per file. A poll drift classifies the same way: a
// drifted path is a change or an unlink, and a drifted directory adds the
// matched files the snapshot did not hold and unlinks the ones it lost.

import { existsSync, readdirSync, statSync, type Dirent } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import type { Event as ParcelEvent } from '@parcel/watcher'
import { dirHoldsMatch, isEngineIgnoredDir, type IncludeMatcher, type MatchSnapshot } from './match.ts'
import { MISSING } from './poll.ts'

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

// The link path a file under a symlinked directory's real target is reached by: the longest target that holds the
// path, rebased onto its link directory. Undefined when no symlinked target holds it.
function linkedPathOf(absolute: string, targetDirs: Map<string, string>): string | undefined {
  let best: { real: string; link: string } | undefined
  for (const [real, link] of targetDirs) {
    if (isInside(relative(real, absolute)) && (best === undefined || real.length > best.real.length)) {
      best = { real, link }
    }
  }
  if (best === undefined) return undefined
  return toPosix(join(best.link, relative(best.real, absolute)))
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
  const targetPath = linkedPathOf(absolute, state.snapshot.targetDirs)
  if (targetPath !== undefined && state.isMatch(targetPath)) {
    return { event: eventName, path: join(state.watchRoot, targetPath), relativePath: targetPath }
  }
  if (isScopeDirectory(event, absolute, relativePath, state)) {
    return { event: eventName, path: event.path, relativePath }
  }
  return null
}

// The matched files a drifted directory holds that the snapshot never saw: the poll's add events.
// A new subdirectory is walked too, since nothing polled sits under it yet.
function addedUnder(dir: string, state: ClassifyState): WatchChange[] {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const added: WatchChange[] = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    const relativePath = toPosix(relative(state.watchRoot, path))
    if (entry.isDirectory()) {
      if (!state.snapshot.dirs.has(relativePath) && !isEngineIgnoredDir(relativePath)) added.push(...addedUnder(path, state))
    } else if (!state.snapshot.files.has(relativePath) && state.isMatch(relativePath)) {
      added.push({ event: 'add', path, relativePath })
    }
  }
  return added
}

// The snapshot's matched files under a drifted directory that are gone. A file deleted before
// any tick recorded it has no drift of its own, so only its directory's drift can report it;
// a gone file that drifted itself is skipped, because its own drift reports it.
function removedUnder(dir: string, state: ClassifyState, drifted: Map<string, string>): WatchChange[] {
  const relativeDir = toPosix(relative(state.watchRoot, dir))
  const prefix = relativeDir === '' ? '' : `${relativeDir}/`
  const removed: WatchChange[] = []
  for (const relativePath of state.snapshot.files) {
    if (!relativePath.startsWith(prefix)) continue
    const path = join(state.watchRoot, relativePath)
    if (!drifted.has(path) && !existsSync(path)) removed.push({ event: 'unlink', path, relativePath })
  }
  return removed
}

// The watch changes one poll drift stands for, keyed by absolute path with each path's new
// signature. A drifted directory reports what it gained and lost; its own mtime is not an edit.
export function classifyDrift(drifted: Map<string, string>, state: ClassifyState): WatchChange[] {
  return [...drifted].flatMap(([path, signature]) => driftChanges(path, signature, state, drifted))
}

function driftChanges(path: string, signature: string, state: ClassifyState, drifted: Map<string, string>): WatchChange[] {
  const relativePath = toPosix(relative(state.watchRoot, path))
  if (signature !== MISSING && isDirectory(path)) return [...addedUnder(path, state), ...removedUnder(path, state, drifted)]
  return [{ event: signature === MISSING ? 'unlink' : 'change', path, relativePath }]
}

// Reports each poll drift as the watch changes it stands for, and returns the drifted paths
// that stood for any: those are the ones worth a resync.
export function reportDrift(
  drifted: Map<string, string>,
  state: ClassifyState,
  onChange: (change: WatchChange) => void,
): Map<string, string> {
  const real = new Map<string, string>()
  for (const [path, signature] of drifted) {
    const changes = driftChanges(path, signature, state, drifted)
    for (const change of changes) onChange(change)
    if (changes.length > 0) real.set(path, signature)
  }
  return real
}
