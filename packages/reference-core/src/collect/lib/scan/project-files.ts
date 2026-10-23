// Project file listing under the native walk's symlink rule. It takes a project root, the include globs and the ignore globs,
// and emits the matching files as absolute paths: real paths first, in walk order, then the link aliases. One sorted walk per
// scope enters a directory only when an include can still reach it, and enters a symlinked directory under every such alias,
// visiting each (canonical directory, glob state) once so that loops and lattices of links end; an owns walk or an include that
// project-globs.ts does not model cuts a link back onto the walk path instead. A file reached through several paths is listed
// once, under its first path in walk order. Directories the Rust walk prunes by name are walked for their real files only, and
// a scope outside the root (`../shared/**`, an absolute glob) walks its own base. A negated include drops the paths it matches
// and prunes descent only where it negates `<dir>/**`, as the Rust walk does.

import { realpathSync, type Dirent } from 'node:fs'
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path'
import picomatch from 'picomatch'
import { NATIVE_IGNORE_DIRS } from '../../constants.ts'
import { kindOf, linkOnceAdmission, liveAdmission, liveDirectories, sortedEntries, type Admission, type KeepFn } from './project-admission.ts'
import {
  compileGlobs,
  expandBraces,
  startPositions,
  stepPositions,
  unfinishedPositions,
  type CompiledGlobs,
  type GlobListInput,
} from './project-globs.ts'

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

/** One walk: the base it starts from, its path relative to the root, the positive patterns that keep a file, the test that keeps a file, and the test that keeps a directory. */
interface Scope {
  base: string
  prefix: string
  /** The positive include patterns this scope keeps files with, normalized. */
  patterns: readonly string[]
  keep: KeepFn
  live: (rel: string) => boolean
}

/** One directory the walk is entering: its alias path, its paths relative to the root and to its scope base, its canonical path, its link and engine flags, and its glob state. */
interface DirFrame {
  alias: string
  rel: string
  local: string | undefined
  canon: string
  viaLink: boolean
  /** Inside an engine-ignored directory: the Rust walk never enters it, so no link there is admitted. */
  engine: boolean
  /** The unfinished glob positions after this directory's path; empty when the walk keeps no visit set. */
  glob: string[]
}

/** One entry of a directory the walk is reading: its alias path and its paths relative to the root and to its scope base. */
interface EntryRef {
  alias: string
  rel: string
  /** The path within the scope base; undefined in the root scope, where it is `rel`. */
  local: string | undefined
}

interface WalkState {
  /** Drops a file: the ignore globs and every negated include. */
  ignored: (relativePath: string) => boolean
  /** Prunes a directory or link: the ignore globs and each negated alternative that is `**` or ends in `/**`. */
  pruned: (relativePath: string) => boolean
  keep: KeepFn
  live: (rel: string) => boolean
  admit: Admission
  plan: ProjectPlan
  /** Canonical directories on the path the walk is on: a link back to one of them closes a loop, where no glob model is kept. */
  walking: Set<string>
  /** The compiled glob lists of a modeled glob-include scope; set together with `visits`, and never otherwise. */
  globs?: CompiledGlobs
  /** The (canonical directory, glob state) pairs walked so far in this scope; set together with `globs`, and never otherwise. */
  visits?: Set<string>
}

/**
 * Walks `cwd` with the ignore globs applied to every path and the engine-ignored directory names the Rust walk prunes. A negated
 * include drops the files it matches and prunes a directory or link only through an alternative that is `**` or ends in `/**`.
 * With include globs a directory is entered only when the globs can still reach it, and a link is entered under each such alias,
 * each (directory, glob state) once; with `owns`, the first link whose relative path `owns` accepts takes its target; with
 * neither, the first link takes it.
 */
export function planProjectWalk(
  cwd: string,
  ignore: readonly string[],
  include: readonly string[] = [],
  owns?: (rel: string) => boolean,
): ProjectPlan {
  const root = resolve(cwd)
  const plan: ProjectPlan = { root, dirs: new Map(), links: new Map(), refused: [], files: [] }
  const negated = include.filter(isNegated).map((pattern) => pattern.slice(1))
  const dropped = [...ignore, ...negated]
  const ignored = ignoreMatcher(dropped)
  const pruned = ignoreMatcher([...ignore, ...negated.flatMap(expandBraces).filter(prunesDescent)])
  for (const scope of scopesOf(root, include)) {
    const admit = admissionFor(scope, include, owns)
    const canon = canonicalOrSelf(scope.base)
    const local = scope.prefix === '' ? undefined : ''
    const frame: DirFrame = { alias: scope.base, rel: scope.prefix, local, canon, viaLink: false, engine: false, glob: [] }
    const state: WalkState = { ignored, pruned, keep: scope.keep, live: scope.live, admit, plan, walking: new Set() }
    const globs = modeledGlobs(scope, dropped, include, owns)
    if (globs !== undefined) {
      // The root is the first (canonical directory, state) pair of the walk, so a link back to it is a repeat.
      state.globs = globs
      frame.glob = unfinishedPositions(globs, startPositions(globs, { rel: scope.prefix, alias: scope.base }))
      state.visits = new Set([visitKey(canon, frame.glob)])
    }
    planDir(frame, state)
  }
  return plan
}

/** The files `include` reaches under `cwd`, one per real file, with the symlink rule applied. Absolute paths: real paths first. */
export function listProjectFiles(cwd: string, include: readonly string[], ignore: readonly string[]): string[] {
  if (!include.some((pattern) => !isNegated(pattern))) return []
  return listedFiles(planProjectWalk(cwd, ignore, include).files)
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
  const scopes: Scope[] = [{ base: root, prefix: '', patterns: inRoot, keep: keepMatcher(inRoot), live: liveDirectories(inRoot) }]
  const bases = [...new Set(outside.map((pattern) => resolve(root, staticPrefix(pattern))))]
  for (const base of bases) {
    scopes.push({
      base,
      prefix: relative(root, base),
      patterns: outside,
      keep: keepMatcher(outside),
      live: liveDirectories(outside),
    })
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
// prunes it, so no link inside it is admitted, and its glob state is neither recorded nor checked. A directory no include pattern
// can reach is not entered.
function planSubdir(child: EntryRef, canon: string, frame: DirFrame, state: WalkState): void {
  if (isIgnored(child, state.pruned) || !state.live(child.rel)) return
  const engine = frame.engine || NATIVE_IGNORE_DIRS.has(basename(child.alias))
  const glob = engine ? [] : enteredGlob(child, canon, frame, state)
  if (glob === undefined) return
  planDir({ ...child, canon, viaLink: frame.viaLink, engine, glob }, state)
}

// The glob state a subdirectory is entered in, or undefined when the walk skips it. A real directory is always walked; one reached
// through a link is skipped when its target is already walked in that state. With no visit set the state stays empty.
function enteredGlob(child: EntryRef, canon: string, frame: DirFrame, state: WalkState): string[] | undefined {
  if (state.globs === undefined || state.visits === undefined) return []
  const glob = stepGlob(state.globs, frame.glob, basename(child.alias))
  const fresh = markVisit(state.visits, canon, glob)
  return frame.viaLink && !fresh ? undefined : glob
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

// A matcher tests the path from the root and, for a scope outside the root, the path from its base. Files test the dropped set,
// and directories and links test the pruned set, so a negation descends only where it negates `<dir>/**`.
function isIgnored(entry: EntryRef, matches: (relativePath: string) => boolean): boolean {
  if (matches(entry.rel)) return true
  return entry.local !== undefined && entry.local !== entry.rel && matches(entry.local)
}

// A negated alternative prunes the walk only when it negates everything beneath a directory.
function prunesDescent(alternative: string): boolean {
  return alternative === '**' || alternative.endsWith('/**')
}

// The identity is the canonical directory holding the entry joined with its name: computed only for a kept file.
function keepFile(entry: EntryRef, frame: DirFrame, state: WalkState): void {
  if (isIgnored(entry, state.ignored) || !state.keep(entry.rel, entry.alias)) return
  const identity = join(frame.canon, basename(entry.alias))
  state.plan.files.push({ alias: entry.alias, rel: entry.rel, identity, viaLink: frame.viaLink, engine: frame.engine })
}

// A link to a file is kept as a file of its own, as the Rust walk keeps it; a dangling link is dropped, as fast-glob drops it.
function planLink(entry: EntryRef, frame: DirFrame, state: WalkState): void {
  if (frame.engine || isIgnored(entry, state.pruned)) return
  const kind = kindOf(entry.alias)
  if (kind === undefined) return
  if (kind === 'file') {
    keepFile(entry, frame, state)
    return
  }
  if (NATIVE_IGNORE_DIRS.has(basename(entry.alias))) return
  planDirLink(entry, frame, realpathSync(entry.alias), state)
}

// A link is refused when the admission rule rejects its alias, when its target is on the walk path (a loop, where no glob model is
// kept), or when its target is already walked in the state the link reaches it in. An entered link walks its target.
function planDirLink(entry: EntryRef, frame: DirFrame, target: string, state: WalkState): void {
  if ((state.visits === undefined && state.walking.has(target)) || !state.admit.admit(entry.alias, entry.rel, target)) {
    state.plan.refused.push(entry.alias)
    return
  }
  let glob: string[] = []
  if (state.globs !== undefined && state.visits !== undefined) {
    glob = stepGlob(state.globs, frame.glob, basename(entry.alias))
    if (!markVisit(state.visits, target, glob)) {
      state.plan.refused.push(entry.alias)
      return
    }
  }
  state.plan.links.set(entry.alias, target)
  planDir({ ...entry, canon: target, viaLink: true, engine: false, glob }, state)
}

// The glob lists the visit rule decides with: a glob-include scope the glob model covers. An owns walk, an include with no
// positive pattern, and an include the model does not cover keep the wave-2 cut instead, so they get no lists.
function modeledGlobs(
  scope: Scope,
  ignore: readonly string[],
  include: readonly string[],
  owns: ((rel: string) => boolean) | undefined
): CompiledGlobs | undefined {
  if (owns !== undefined || include.length === 0) return undefined
  const ignored = ignore.map(normalizePattern)
  const lists: GlobListInput[] = [
    { tag: 'kr', patterns: scope.patterns.filter((pattern) => !isAbsolute(pattern)) },
    { tag: 'ka', patterns: scope.patterns.filter((pattern) => isAbsolute(pattern)) },
    { tag: 'ir', patterns: ignored },
  ]
  if (scope.prefix !== '') lists.push({ tag: 'il', patterns: ignored })
  return compileGlobs(lists)
}

// The visit key: the canonical directory and the glob state it is read with. Real and link entries share one visit set.
function visitKey(canon: string, glob: readonly string[]): string {
  return `${canon}\0${glob.join(',')}`
}

// Records a (directory, state) pair and says whether it was new.
function markVisit(visits: Set<string>, canon: string, glob: readonly string[]): boolean {
  const key = visitKey(canon, glob)
  const fresh = !visits.has(key)
  visits.add(key)
  return fresh
}

// The state of an entry's directory: the unfinished positions once its name is read.
function stepGlob(globs: CompiledGlobs, glob: readonly string[], name: string): string[] {
  return unfinishedPositions(globs, stepPositions(globs, glob, name))
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
