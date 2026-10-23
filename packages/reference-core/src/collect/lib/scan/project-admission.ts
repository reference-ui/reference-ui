// Link admission and directory liveness for the project walk. Under an include, a directory is live when its path from the root
// can still agree with a positive pattern's literal directory prefix; the walk enters only live directories and only live links,
// as the Rust walk does. project-files.ts walks a live link once per (target, glob state) under a modeled include, and refuses a
// link back onto the walk path when an owns walk or an unmodeled include keeps no glob state. With owns, the first link whose
// relative path `owns` accepts takes its target; with neither, the first link takes it. Entries are sorted by name bytes, the
// order the Rust walk sorts its entries in.

import { readdirSync, statSync, type Dirent } from 'node:fs'
import { isAbsolute } from 'node:path'

/** Decides whether a link alias is entered: `rel` is the alias path from the root, `alias` its absolute path, `target` its canonical target. */
export interface Admission {
  admit: (alias: string, rel: string, target: string) => boolean
}

/** Whether a path is kept by the include globs: `rel` is relative to the root, `alias` is absolute. */
export type KeepFn = (rel: string, alias: string) => boolean

// The first link whose relative path `owns` accepts takes its target; later links to it are refused.
export function linkOnceAdmission(owns: (rel: string) => boolean): Admission {
  const entered = new Set<string>()
  return {
    admit(_alias, rel, target) {
      if (entered.has(target) || !owns(rel)) return false
      entered.add(target)
      return true
    },
  }
}

// A link is entered when its alias path is live: some include pattern can still reach a path under it. Every live alias is
// walked, so a target an earlier alias reached still lists the files this alias reaches under it.
export function liveAdmission(live: (rel: string) => boolean): Admission {
  return { admit: (_alias, rel) => live(rel) }
}

/**
 * The directory liveness test for a list of include patterns: a directory is live when its path from the root agrees with the
 * literal directory prefix of some positive pattern on every segment both share. A pattern with no usable literal prefix keeps
 * every directory live: it is absolute, has an empty, `.` or `..` segment, or has no literal directory before its first glob.
 * Negated patterns never prune, and a list with no positive pattern keeps every directory live.
 */
export function liveDirectories(include: readonly string[]): (rel: string) => boolean {
  const prefixes: string[][] = []
  for (const pattern of include) {
    if (pattern.startsWith('!')) continue
    const prefix = literalPrefix(pattern.replace(/^\.\//, ''))
    if (prefix === undefined) return () => true
    prefixes.push(prefix)
  }
  if (prefixes.length === 0) return () => true
  return (rel) => {
    const segments = rel === '' ? [] : rel.split('/')
    return prefixes.some((prefix) => agrees(prefix, segments))
  }
}

// The leading directory segments with no glob syntax; the last segment names files and is never part of the prefix.
function literalPrefix(pattern: string): string[] | undefined {
  const segments = pattern.split('/')
  if (isAbsolute(pattern) || segments.some((segment) => segment === '' || segment === '.' || segment === '..')) return undefined
  const literal: string[] = []
  for (const segment of segments.slice(0, -1)) {
    if (GLOB_SYNTAX.test(segment)) break
    literal.push(segment)
  }
  return literal.length > 0 ? literal : undefined
}

const GLOB_SYNTAX = /[*?[\]{}()!]/

// True when the path agrees with the prefix on every segment both have, so a directory above a prefix stays live.
function agrees(prefix: readonly string[], segments: readonly string[]): boolean {
  return prefix.every((literal, index) => index >= segments.length || segments[index] === literal)
}

// Entries are sorted by name bytes, the order the Rust walk sorts its entries in, so both sides enter the same first path.
export function sortedEntries(dir: string): Dirent[] {
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

// What a link resolves to: a directory, a regular file, or undefined for a dangling link or a target that is neither (a FIFO,
// socket or device), which the walk skips.
export function kindOf(alias: string): 'file' | 'directory' | undefined {
  try {
    const stat = statSync(alias)
    if (stat.isDirectory()) return 'directory'
    return stat.isFile() ? 'file' : undefined
  } catch {
    return undefined
  }
}
