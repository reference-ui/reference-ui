// Project file listing under the native walk's symlink rule. It takes a project root, the include globs and the ignore globs,
// and emits the matching files as absolute paths: real paths first, in walk order, then the link aliases. One sorted walk per
// scope enters a directory only when an include pattern can still reach it by its path from the root, and it enters a symlinked
// directory under every such alias; a link back to a directory already on the walk path ends the loop there. A file reached
// through several paths is listed once, under the first path the walk reaches it by. Directories the Rust walk prunes by name
// (dist, build, ...) are walked for their real files only, and no link inside them is admitted. A scope outside the root
// (`../shared/**`, an absolute glob) walks its own base the same way.

import { realpathSync, type Dirent } from 'node:fs'
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path'
import picomatch from 'picomatch'
import { NATIVE_IGNORE_DIRS } from '../../constants.ts'
import { kindOf, linkOnceAdmission, liveAdmission, liveDirectories, sortedEntries, type Admission, type KeepFn } from './project-admission.ts'

/** One directory the walk enters: its canonical path, and whether a link carried the walk to it. */
interface PlannedDir {
  canon: string
  viaLink: boolean
}

/** One file the walk keeps: its alias path, its path relative to the root, the identity it claims, and whether a link reached it. */
export interface PlannedFile {
  alias: string
  rel: string
  identity: string
  viaLink: boolean
  /** Under an engine-ignored directory: matched as the fragment scan always matched it, and listed last. */
  engine: boolean
}

/** The walk of one root: the directories entered, the links entered and refused, and the files kept, in walk order. */
export interface ProjectPlan {
  root: string
  dirs: Map<string, PlannedDir>
  /** Entered directory links: alias path to the canonical target the walk enters through it. */
  links: Map<string, string>
  /** Refused directory links: alias paths the walk does not enter, because of a loop or because no include pattern reaches them. */
  refused: string[]
  files: PlannedFile[]
}

/** One walk: the base it starts from, its path relative to the root, the test that keeps a file, and the test that keeps a directory. */
interface Scope {
  base: string
  prefix: string
  keep: KeepFn
  live: (rel: string) => boolean
}

/** One directory the walk is entering: its alias path, its paths relative to the root and to its scope base, its canonical path, and its link and engine flags. */
interface DirFrame {
  alias: string
  rel: string
  local: string | undefined
  canon: string
  viaLink: boolean
  /** Inside an engine-ignored directory: the Rust walk never enters it, so no link there is admitted. */
  engine: boolean
}

/** One entry of a directory the walk is reading: its alias path and its paths relative to the root and to its scope base. */
interface EntryRef {
  alias: string
  rel: string
  /** The path within the scope base; undefined in the root scope, where it is `rel`. */
  local: string | undefined
}

interface WalkState {
  ignored: (relativePath: string) => boolean
  keep: KeepFn
  live: (rel: string) => boolean
  admit: Admission
  plan: ProjectPlan
  /** Canonical directories on the path the walk is on: a link back to one of them closes a loop. */
  walking: Set<string>
}

/**
 * Walks `cwd` with the ignore globs applied to every path, as fast-glob applies them, and the engine-ignored directory names the
 * Rust walk prunes. With include globs a directory is entered only when the globs can still reach it, and a link is entered under
 * each such alias; with `owns`, the first link whose relative path `owns` accepts takes its target; with neither, the first link takes it.
 */
export function planProjectWalk(
  cwd: string,
  ignore: readonly string[],
  include: readonly string[] = [],
  owns?: (rel: string) => boolean,
): ProjectPlan {
  const root = resolve(cwd)
  const plan: ProjectPlan = { root, dirs: new Map(), links: new Map(), refused: [], files: [] }
  const ignored = ignoreMatcher(ignore)
  for (const scope of scopesOf(root, include)) {
    const admit = admissionFor(scope, include, owns)
    const canon = canonicalOrSelf(scope.base)
    const local = scope.prefix === '' ? undefined : ''
    const frame: DirFrame = { alias: scope.base, rel: scope.prefix, local, canon, viaLink: false, engine: false }
    planDir(frame, { ignored, keep: scope.keep, live: scope.live, admit, plan, walking: new Set() })
  }
  return plan
}

/** The files `include` reaches under `cwd`, one per real file, with the symlink rule applied. Absolute paths: real paths first. */
export function listProjectFiles(cwd: string, include: readonly string[], ignore: readonly string[]): string[] {
  if (!include.some((pattern) => !isNegated(pattern))) return []
  const negated = include.filter(isNegated).map((pattern) => pattern.slice(1))
  return listedFiles(planProjectWalk(cwd, [...ignore, ...negated], include).files)
}

/** The files `include` reaches in a plan that already kept them: each identity once, real paths first, absolute paths. */
export function listPlannedFiles(plan: ProjectPlan, include: readonly string[]): string[] {
  const keep = keepMatcher(include)
  return listedFiles(plan.files.filter((file) => keep(file.rel, file.alias)))
}

// Real paths first, then link aliases, then files under engine-ignored directories: a walked path always decides a file's representative.
function listedFiles(files: readonly PlannedFile[]): string[] {
  const claimed = new Set<string>()
  const listed: string[] = []
  for (const tier of [0, 1, 2]) {
    for (const file of files) {
      if (tierOf(file) !== tier || claimed.has(file.identity)) continue
      claimed.add(file.identity)
      listed.push(file.alias)
    }
  }
  return listed
}

function tierOf(file: PlannedFile): number {
  if (file.engine) return 2
  return file.viaLink ? 1 : 0
}

// The root scope always walks, so every link is decided over the whole tree; each outside base walks on its own, as its own tree.
function scopesOf(root: string, include: readonly string[]): Scope[] {
  const positive = include.filter((pattern) => !isNegated(pattern)).map(normalizePattern)
  const inRoot = positive.filter((pattern) => !isOutside(pattern))
  const outside = positive.filter(isOutside)
  const scopes: Scope[] = [{ base: root, prefix: '', keep: keepMatcher(inRoot), live: liveDirectories(inRoot) }]
  const bases = [...new Set(outside.map((pattern) => resolve(root, staticPrefix(pattern))))]
  for (const base of bases) {
    scopes.push({ base, prefix: relative(root, base), keep: keepMatcher(outside), live: liveDirectories(outside) })
  }
  return scopes
}

function admissionFor(scope: Scope, include: readonly string[], owns: ((rel: string) => boolean) | undefined): Admission {
  if (owns !== undefined) return linkOnceAdmission(owns)
  if (include.length > 0) return liveAdmission(scope.live)
  return linkOnceAdmission(() => true)
}

function planDir(frame: DirFrame, state: WalkState): void {
  state.plan.dirs.set(frame.alias, { canon: frame.canon, viaLink: frame.viaLink })
  state.walking.add(frame.canon)
  for (const entry of sortedEntries(frame.alias)) planEntry(entry, frame, state)
  state.walking.delete(frame.canon)
}

// One entry of a directory being walked: a subdirectory is entered, a link is decided, and a file is kept.
function planEntry(entry: Dirent, frame: DirFrame, state: WalkState): void {
  const child = childOf(entry.name, frame)
  if (entry.isDirectory()) {
    planSubdir(child, joinPath(frame.canon, entry.name), frame, state)
  } else if (entry.isSymbolicLink()) {
    planLink(child, frame, state)
  } else {
    keepFile(child, frame, state)
  }
}

// An engine-ignored directory is still walked for its real files, which the fragment scan matches on this side; the Rust walk
// prunes it, so no link inside it is admitted. A directory no include pattern can reach is not entered.
function planSubdir(child: EntryRef, canon: string, frame: DirFrame, state: WalkState): void {
  if (isIgnored(child, state) || !state.live(child.rel)) return
  const engine = frame.engine || NATIVE_IGNORE_DIRS.has(basename(child.alias))
  planDir({ ...child, canon, viaLink: frame.viaLink, engine }, state)
}

function childOf(name: string, frame: DirFrame): EntryRef {
  const { local } = frame
  return {
    alias: joinPath(frame.alias, name),
    rel: frame.rel === '' ? name : `${frame.rel}/${name}`,
    local: local === undefined ? undefined : local === '' ? name : `${local}/${name}`,
  }
}

function joinPath(dir: string, name: string): string {
  return `${dir}${dir.endsWith(sep) ? '' : sep}${name}`
}

// The ignore set applies to the path from the root (fast-glob's cwd) and, for a scope outside the root, to the path from its base.
function isIgnored(entry: EntryRef, state: WalkState): boolean {
  if (state.ignored(entry.rel)) return true
  return entry.local !== undefined && entry.local !== entry.rel && state.ignored(entry.local)
}

// The identity is the canonical directory holding the entry joined with its name: computed only for a kept file.
function keepFile(entry: EntryRef, frame: DirFrame, state: WalkState): void {
  if (isIgnored(entry, state) || !state.keep(entry.rel, entry.alias)) return
  const identity = join(frame.canon, basename(entry.alias))
  state.plan.files.push({ alias: entry.alias, rel: entry.rel, identity, viaLink: frame.viaLink, engine: frame.engine })
}

// A link to a file is kept as a file of its own, as the Rust walk keeps it; a dangling link is dropped, as fast-glob drops it.
function planLink(entry: EntryRef, frame: DirFrame, state: WalkState): void {
  if (frame.engine || isIgnored(entry, state)) return
  const kind = kindOf(entry.alias)
  if (kind === undefined) return
  if (kind === 'file') {
    keepFile(entry, frame, state)
    return
  }
  if (NATIVE_IGNORE_DIRS.has(basename(entry.alias))) return
  planDirLink(entry, realpathSync(entry.alias), state)
}

// A link is refused when its target is on the walk path (a loop) or the admission rule rejects its alias; an entered link walks its target.
function planDirLink(entry: EntryRef, target: string, state: WalkState): void {
  if (state.walking.has(target) || !state.admit.admit(entry.alias, entry.rel, target)) {
    state.plan.refused.push(entry.alias)
    return
  }
  state.plan.links.set(entry.alias, target)
  planDir({ ...entry, canon: target, viaLink: true, engine: false }, state)
}

function canonicalOrSelf(path: string): string {
  try {
    return realpathSync(path)
  } catch {
    return path
  }
}

function isNegated(pattern: string): boolean {
  return pattern.startsWith('!')
}

// fast-glob reads a leading `./` as the root itself, so the matchers see the same relative spelling.
function normalizePattern(pattern: string): string {
  return pattern.replace(/^\.\//, '')
}

// A pattern that leaves the root (`../shared/**`) or names an absolute base walks that base instead of the root.
function isOutside(pattern: string): boolean {
  return isAbsolute(pattern) || pattern === '..' || pattern.startsWith('../')
}

// The leading segments with no glob magic: the directory a pattern starts from.
function staticPrefix(pattern: string): string {
  const segments: string[] = []
  for (const segment of pattern.split('/')) {
    if (/[*?[\]{}()!]/.test(segment)) break
    segments.push(segment)
  }
  return segments.join('/') || '.'
}

// Relative patterns match the root-relative path; absolute patterns match the absolute path, as fast-glob returns them.
function keepMatcher(include: readonly string[]): KeepFn {
  const relativePatterns = include.filter((pattern) => !isAbsolute(pattern))
  const absolutePatterns = include.filter((pattern) => isAbsolute(pattern))
  const relativeMatch = relativePatterns.length > 0 ? picomatch(relativePatterns, { dot: true }) : () => false
  const absoluteMatch = absolutePatterns.length > 0 ? picomatch(absolutePatterns, { dot: true }) : () => false
  return (rel, alias) => relativeMatch(rel) || absoluteMatch(alias)
}

function ignoreMatcher(ignore: readonly string[]): (relativePath: string) => boolean {
  if (ignore.length === 0) return () => false
  return picomatch(ignore.map(normalizePattern), { dot: true })
}
