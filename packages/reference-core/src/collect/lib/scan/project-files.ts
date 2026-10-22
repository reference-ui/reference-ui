// Project file listing under the native walk's symlink rule. It takes a project root, the include globs and the ignore globs,
// and emits the matching files as absolute paths: real paths first, in walk order, then the link aliases. One sorted walk per
// scope enters every real directory under its own path and each symlinked directory once per real target, never back into an
// ancestor, and keeps each file its include globs match. The walk is the Rust walk's own order, so both sides enter the same
// links and list the same files; a scope outside the root (`../shared/**`, an absolute glob) walks its own base the same way.

import { readdirSync, realpathSync, statSync, type Dirent } from 'node:fs'
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path'
import picomatch from 'picomatch'

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
}

/** The walk of one root: the directories entered, the links entered and refused, and the files kept, in walk order. */
export interface ProjectPlan {
  root: string
  dirs: Map<string, PlannedDir>
  /** Entered directory links: alias path to the canonical target the walk enters through it. */
  links: Map<string, string>
  /** Refused directory links: alias paths that close a loop or repeat an entered target. */
  refused: string[]
  files: PlannedFile[]
}

/** One walk: the base it starts from, its path relative to the root, and the test that keeps a file. */
interface Scope {
  base: string
  prefix: string
  keep: (rel: string, alias: string) => boolean
}

/** One directory the walk is entering: its alias path, its paths relative to the root and to its scope base, its canonical path, and the link flag. */
interface DirFrame {
  alias: string
  rel: string
  local: string | undefined
  canon: string
  viaLink: boolean
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
  keep: Scope['keep']
  plan: ProjectPlan
  linked: Set<string>
}

/**
 * Walks `cwd` with the ignore globs applied to every path, as fast-glob applies them: a matched directory is not entered.
 * Only the include globs `include` keep files; with none, the plan carries the links alone.
 */
export function planProjectWalk(cwd: string, ignore: readonly string[], include: readonly string[] = []): ProjectPlan {
  const root = resolve(cwd)
  const plan: ProjectPlan = { root, dirs: new Map(), links: new Map(), refused: [], files: [] }
  const ignored = ignoreMatcher(ignore)
  for (const scope of scopesOf(root, include)) {
    const state: WalkState = { ignored, keep: scope.keep, plan, linked: new Set() }
    const canon = canonicalOrSelf(scope.base)
    const local = scope.prefix === '' ? undefined : ''
    planDir({ alias: scope.base, rel: scope.prefix, local, canon, viaLink: false }, state)
  }
  return plan
}

/** The files `include` reaches under `cwd`, each identity once, real paths first. Absolute paths, in walk order. */
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

function listedFiles(files: readonly PlannedFile[]): string[] {
  const claimed = new Set<string>()
  const listed: string[] = []
  for (const viaLink of [false, true]) {
    for (const file of files) {
      if (file.viaLink !== viaLink || claimed.has(file.identity)) continue
      claimed.add(file.identity)
      listed.push(file.alias)
    }
  }
  return listed
}

// The root scope always walks, so every link is decided over the whole tree; each outside base walks on its own, as its own tree.
function scopesOf(root: string, include: readonly string[]): Scope[] {
  const positive = include.filter((pattern) => !isNegated(pattern)).map(normalizePattern)
  const inRoot = positive.filter((pattern) => !isOutside(pattern))
  const outside = positive.filter(isOutside)
  const scopes: Scope[] = [{ base: root, prefix: '', keep: keepMatcher(inRoot) }]
  const bases = [...new Set(outside.map((pattern) => resolve(root, staticPrefix(pattern))))]
  for (const base of bases) {
    scopes.push({ base, prefix: relative(root, base), keep: keepMatcher(outside) })
  }
  return scopes
}

function planDir(frame: DirFrame, state: WalkState): void {
  state.plan.dirs.set(frame.alias, { canon: frame.canon, viaLink: frame.viaLink })
  for (const entry of sortedEntries(frame.alias)) planEntry(entry, frame, state)
}

// One entry of a directory being walked: a subdirectory is entered, a link is decided, and a file is kept.
function planEntry(entry: Dirent, frame: DirFrame, state: WalkState): void {
  const child = childOf(entry.name, frame)
  if (entry.isDirectory()) {
    planSubdir(child, joinPath(frame.canon, entry.name), frame.viaLink, state)
  } else if (entry.isSymbolicLink()) {
    planLink(child, frame.canon, frame.viaLink, state)
  } else {
    keepFile(child, frame.canon, frame.viaLink, state)
  }
}

function planSubdir(child: EntryRef, canon: string, viaLink: boolean, state: WalkState): void {
  if (isIgnored(child, state)) return
  planDir({ ...child, canon, viaLink }, state)
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
function keepFile(entry: EntryRef, canon: string, viaLink: boolean, state: WalkState): void {
  if (isIgnored(entry, state) || !state.keep(entry.rel, entry.alias)) return
  const identity = join(canon, basename(entry.alias))
  state.plan.files.push({ alias: entry.alias, rel: entry.rel, identity, viaLink })
}

// A link to a file is kept as a file of its own, as the Rust walk keeps it; a dangling link is dropped, as fast-glob drops it.
function planLink(entry: EntryRef, canon: string, viaLink: boolean, state: WalkState): void {
  if (isIgnored(entry, state)) return
  const kind = kindOf(entry.alias)
  if (kind === undefined) return
  if (kind === 'file') {
    keepFile(entry, canon, viaLink, state)
    return
  }
  planDirLink(entry, canon, realpathSync(entry.alias), state)
}

function planDirLink(entry: EntryRef, canon: string, target: string, state: WalkState): void {
  if (isSameOrAncestor(target, canon) || state.linked.has(target)) {
    state.plan.refused.push(entry.alias)
    return
  }
  state.linked.add(target)
  state.plan.links.set(entry.alias, target)
  planDir({ ...entry, canon: target, viaLink: true }, state)
}

// Entries are sorted by name bytes, the order the Rust walk sorts its entries in, so both sides enter the same first path.
function sortedEntries(dir: string): Dirent[] {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
  return entries.sort(compareEntries)
}

function compareEntries(a: Dirent, b: Dirent): number {
  if (PRINTABLE_ASCII.test(a.name) && PRINTABLE_ASCII.test(b.name)) return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  return Buffer.compare(Buffer.from(a.name, 'utf8'), Buffer.from(b.name, 'utf8'))
}

// Printable ASCII names compare as strings, where UTF-16 order is byte order; any other name compares by bytes.
const PRINTABLE_ASCII = /^[ -~]*$/

function kindOf(alias: string): 'file' | 'directory' | undefined {
  try {
    return statSync(alias).isDirectory() ? 'directory' : 'file'
  } catch {
    return undefined
  }
}

function canonicalOrSelf(path: string): string {
  try {
    return realpathSync(path)
  } catch {
    return path
  }
}

function isSameOrAncestor(target: string, dir: string): boolean {
  return dir === target || dir.startsWith(target.endsWith(sep) ? target : `${target}${sep}`)
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
function keepMatcher(include: readonly string[]): Scope['keep'] {
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

