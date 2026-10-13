// Watch matching: the include matcher the engine's walk implies, the engine's
// ignore set, watch-root derivation, the real-path helper, and the matched-file
// snapshot a resync refreshes. It takes a real project root plus the config
// include globs and emits predicates over relative paths, root sets, and
// snapshots. The engine never reads .gitignore: its walk is fast-glob with
// dot:true and node_modules pruned, then the native directory ignores, so every
// predicate here mirrors that walk and nothing more.

import { realpathSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import fg from 'fast-glob'
import picomatch from 'picomatch'
import { NATIVE_IGNORE_DIRS, RETENTION_EXCLUDE } from '../../collect/constants.ts'

export type IncludeMatcher = (relativePath: string) => boolean

const GLOB_MAGIC = /[*?[\]{}()!]/

// The engine's ignored directory names as watcher globs, at any depth.
export const ENGINE_IGNORE_GLOBS: string[] = [...NATIVE_IGNORE_DIRS].map((name) => `**/${name}/**`)

function toPosix(value: string): string {
  return value.replaceAll('\\', '/')
}

function isNegated(pattern: string): boolean {
  return pattern.startsWith('!')
}

// A file is engine-ignored when a directory above it carries an ignored name;
// a file that is itself named `dist` stays, exactly as the native walk keeps it.
export function isEngineIgnoredFile(relativePath: string): boolean {
  return toPosix(relativePath).split('/').slice(0, -1).some((segment) => NATIVE_IGNORE_DIRS.has(segment))
}

// A directory event also checks its own name, so a moved `dist` folder counts.
export function isEngineIgnoredDir(relativePath: string): boolean {
  return toPosix(relativePath).split('/').some((segment) => NATIVE_IGNORE_DIRS.has(segment))
}

// The include globs as the engine's walk reads them: dot entries match, a `!`
// pattern subtracts, and no path under an engine-ignored directory matches.
export function createIncludeMatcher(include: string[]): IncludeMatcher {
  const matchesAny = picomatch(include.filter((pattern) => !isNegated(pattern)), { dot: true })
  const matchesNegated = picomatch(include.filter(isNegated).map((pattern) => pattern.slice(1)), { dot: true })
  return (relativePath) => {
    const normalized = toPosix(relativePath)
    return !isEngineIgnoredFile(normalized) && matchesAny(normalized) && !matchesNegated(normalized)
  }
}

function normalizePattern(value: string): string {
  return toPosix(value).replace(/^\.\/+/, '').replace(/^\/+/, '')
}

// The leading static directories of one include glob: `theme/**` watches
// `theme`. A pattern with no static head watches the project root.
function staticPrefix(pattern: string): string | undefined {
  const prefix: string[] = []
  for (const segment of normalizePattern(pattern.trim()).split('/').filter(Boolean)) {
    if (GLOB_MAGIC.test(segment)) break
    prefix.push(segment)
  }
  return prefix.length > 0 ? prefix.join('/') : undefined
}

function isUnder(parent: string, candidate: string): boolean {
  const rel = relative(parent, candidate)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

// Shortest-first dedupe: a root nested under an earlier one adds no
// coverage, so collapse keeps the watch subscription list small.
function collapseRoots(roots: string[]): string[] {
  const unique = [...new Set(roots.map((root) => resolve(root)))].sort((a, b) => a.length - b.length)
  const collapsed: string[] = []
  for (const root of unique) {
    if (!collapsed.some((kept) => isUnder(kept, root))) collapsed.push(root)
  }
  return collapsed
}

// Negated patterns only subtract, so they never add a root of their own.
export function deriveWatchRoots(projectRoot: string, include: string[], extraDirs: string[] = []): string[] {
  const root = resolve(projectRoot)
  const prefixes = include.filter((pattern) => !isNegated(pattern)).map(staticPrefix)
  const unrooted = prefixes.length === 0 || prefixes.some((prefix) => prefix === undefined)
  const includeRoots = unrooted
    ? [root]
    : prefixes.filter((prefix): prefix is string => prefix !== undefined).map((prefix) => resolve(root, prefix))
  return collapseRoots([...includeRoots, ...extraDirs.map((dir) => resolve(root, dir))])
}

// Root-set diff for the resync rebuild: subscribe only what appeared,
// unsubscribe only what vanished. An unchanged set churns nothing.
export function diffWatchRoots(current: string[], next: string[]): { added: string[]; removed: string[] } {
  const before = new Set(current)
  const after = new Set(next)
  return {
    added: next.filter((root) => !before.has(root)),
    removed: current.filter((root) => !after.has(root)),
  }
}

// The real path of an existing location, or its lexical resolve when nothing
// is there yet. Parcel reports real paths, so every comparison uses them too.
export function canonicalPath(path: string): string {
  const absolute = resolve(path)
  try {
    return realpathSync(absolute)
  } catch {
    return absolute
  }
}

export interface MatchSnapshot {
  /** Directories above some match, relative and posix, so a directory event that drops one resyncs. */
  dirs: Set<string>
  /** Real path of a match reached through a symlink, mapped to its relative link path. */
  links: Map<string, string>
  /** Directories holding each link's real target, watched so an edit there arrives. */
  linkDirs: string[]
}

function ancestorsOf(relativePath: string): string[] {
  const parts = relativePath.split('/')
  return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join('/'))
}

// The real file behind one matched path when a symlink sits on the way, or
// undefined for a plain file or a link that cannot be resolved.
function realTargetOf(absolute: string): string | undefined {
  try {
    const real = realpathSync(absolute)
    return real === absolute ? undefined : real
  } catch {
    return undefined
  }
}

// One walk of the include globs, the engine's own enumeration: the directories
// above every match, plus the real targets of matches reached through a link.
export function scanMatches(watchRoot: string, include: string[]): MatchSnapshot {
  const snapshot: MatchSnapshot = { dirs: new Set(), links: new Map(), linkDirs: [] }
  const found = fg.sync(include, { cwd: watchRoot, dot: true, ignore: [...RETENTION_EXCLUDE, ...ENGINE_IGNORE_GLOBS] })
  for (const entry of found) {
    const relativePath = toPosix(entry)
    for (const dir of ancestorsOf(relativePath)) snapshot.dirs.add(dir)
    const real = realTargetOf(join(watchRoot, relativePath))
    if (real === undefined) continue
    snapshot.links.set(real, relativePath)
    snapshot.linkDirs.push(dirname(real))
  }
  return snapshot
}

// True when one directory's subtree holds a path the include globs match now:
// the test a directory that moved into scope passes without per-file events.
// A directory that vanishes mid-walk holds nothing, so the probe fails closed:
// it runs inside the parcel callback, where a throw would take the process down.
export function dirHoldsMatch(watchRoot: string, relativeDir: string, isMatch: IncludeMatcher): boolean {
  try {
    const found = fg.sync('**/*', { cwd: join(watchRoot, relativeDir), dot: true, ignore: ENGINE_IGNORE_GLOBS })
    return found.some((entry) => isMatch(`${relativeDir}/${toPosix(entry)}`))
  } catch {
    return false
  }
}
