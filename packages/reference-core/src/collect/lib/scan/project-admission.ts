// Link admission for the project walk: which symlinked directory the walk enters, decided from the files its own target holds.
// It takes a link's alias path and target and emits whether the walk enters it. A link is admitted when it admits a listable file
// of its target that no earlier admitted link admitted, or when it is the first to reach a target that links to a kept directory;
// a link under an engine-ignored directory is never admitted, since the Rust walk never enters one. The target is scanned without
// following its links, so every admission covers a new file or is a first visit, and the walk ends. Entries are sorted by name bytes,
// the order the Rust walk sorts its entries in.

import { readdirSync, statSync, type Dirent } from 'node:fs'
import { basename, join } from 'node:path'
import { NATIVE_IGNORE_DIRS } from '../../constants.ts'

/** Decides whether a link alias is entered: `rel` is the alias path from the root, `alias` its absolute path, `target` its canonical target. */
export interface Admission {
  admit: (alias: string, rel: string, target: string) => boolean
}

/** Whether a path is kept by the include globs: `rel` is relative to the root, `alias` is absolute. */
export type KeepFn = (rel: string, alias: string) => boolean

/** What a target holds, scanned without following links: its listable files relative to the target, and whether it links to a kept directory. */
interface Physical {
  files: string[]
  dirLinks: boolean
}

interface PhysicalScan {
  ignored: (relativePath: string) => boolean
  out: Physical
}

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

// A link is admitted when it admits a listable file of its target that no earlier admitted link admitted, or when it is the first
// to reach a target that links to a kept directory. An out-of-scope link therefore never takes a target an in-scope link also reaches.
export function coverageAdmission(keep: KeepFn, ignored: (relativePath: string) => boolean): Admission {
  const entered = new Set<string>()
  const covered = new Map<string, Set<string>>()
  const scanned = new Map<string, Physical>()
  return {
    admit(alias, rel, target) {
      const physical = physicalOf(target, ignored, scanned)
      const seen = covered.get(target) ?? new Set<string>()
      const fresh = physical.files.filter((file) => !seen.has(file) && keep(`${rel}/${file}`, `${alias}/${file}`))
      const firstVisit = !entered.has(target)
      entered.add(target)
      if (fresh.length === 0 && !(physical.dirLinks && firstVisit)) return false
      covered.set(target, new Set([...seen, ...fresh]))
      return true
    },
  }
}

function physicalOf(target: string, ignored: (relativePath: string) => boolean, cache: Map<string, Physical>): Physical {
  const found = cache.get(target)
  if (found !== undefined) return found
  const physical: Physical = { files: [], dirLinks: false }
  scanPhysical(target, '', { ignored, out: physical })
  cache.set(target, physical)
  return physical
}

// The listable extensions: the ones the Rust walk admits, plus MDX, which the fragment scan reads on this side only.
const LISTABLE = /\.(?:tsx|ts|jsx|js|mdx)$/

function scanPhysical(dir: string, rel: string, scan: PhysicalScan): void {
  for (const entry of sortedEntries(dir)) scanPhysicalEntry(entry, dir, rel, scan)
}

// One entry of a target's tree: a real directory is scanned, a link is noted, and a listable file is kept.
function scanPhysicalEntry(entry: Dirent, dir: string, rel: string, scan: PhysicalScan): void {
  const childRel = rel === '' ? entry.name : `${rel}/${entry.name}`
  const pruned = NATIVE_IGNORE_DIRS.has(entry.name) || scan.ignored(childRel)
  if (entry.isDirectory()) {
    if (!pruned) scanPhysical(join(dir, entry.name), childRel, scan)
  } else if (entry.isSymbolicLink()) {
    scanPhysicalLink(join(dir, entry.name), childRel, pruned, scan.out)
  } else if (entry.isFile() && LISTABLE.test(entry.name)) {
    scan.out.files.push(childRel)
  }
}

// A link is noted when it leads to a directory the walk would enter, and kept when it is a listable file.
function scanPhysicalLink(path: string, childRel: string, pruned: boolean, out: Physical): void {
  const kind = kindOf(path)
  if (kind === 'directory' && !pruned) out.dirLinks = true
  if (kind === 'file' && LISTABLE.test(basename(path))) out.files.push(childRel)
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

export function kindOf(alias: string): 'file' | 'directory' | undefined {
  try {
    return statSync(alias).isDirectory() ? 'directory' : 'file'
  } catch {
    return undefined
  }
}
