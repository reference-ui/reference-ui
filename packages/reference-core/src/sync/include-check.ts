// Include check for a sync. It takes the project root and the config's include
// globs, and emits warning diagnostics for what the engine drops without a word:
// one naming the positive patterns that match no file, and one per dangling
// symlink the globs reach, naming the link. The engine scans only what the globs
// reach and skips a dangling link silently, so this check names both, with dot
// files reached. A negation drops every path it matches but prunes descent only
// where the listing does (`<dir>/**`), so a link beneath `!dir` is still named.

import { lstatSync, readlinkSync, statSync } from 'node:fs'
import { join } from 'node:path'
import fg from 'fast-glob'
import picomatch from 'picomatch'
import { RETENTION_EXCLUDE } from '../collect/constants.ts'
import { listPlannedFiles, planProjectWalk, prunesDescent } from '../collect/lib/scan/project-files.ts'
import { negatedClassesAsCaret } from '../collect/lib/scan/glob-classes.ts'
import { expandBraces } from '../collect/lib/scan/project-globs.ts'
import type { NativeDiagnostic } from '../native/contract.ts'

/** The positive include patterns that match no file under cwd. Negations never count. Each pattern is planned on its own walk. */
export function deadIncludePatterns(cwd: string, include: readonly string[]): string[] {
  return include.filter((pattern) => !pattern.startsWith('!') && !patternMatchesAFile(cwd, pattern))
}

// Each pattern gets its own walk: a link is admitted by the files its own pattern adds, so one shared walk could hide them.
function patternMatchesAFile(cwd: string, pattern: string): boolean {
  return listPlannedFiles(planProjectWalk(cwd, RETENTION_EXCLUDE, [pattern]), [pattern]).length > 0
}

/** The dangling symlinks the include globs reach, as cwd-relative link paths. Negations subtract. */
export function danglingIncludeLinks(cwd: string, include: readonly string[]): string[] {
  const positive = include.filter((pattern) => !pattern.startsWith('!'))
  const negated = include.filter((pattern) => pattern.startsWith('!')).map((pattern) => pattern.slice(1))
  // Links are listed unfollowed, so a dangling one is an entry; the followed walk drops it. fast-glob prunes on what it
  // ignores, so it gets only the negations the listing prunes on, and every negation then drops the entries it matches.
  const reached = fg.sync(positive, {
    cwd,
    ignore: [...RETENTION_EXCLUDE, ...negated.flatMap(expandBraces).filter(prunesDescent)],
    dot: true,
    onlyFiles: false,
    followSymbolicLinks: false,
  })
  const dropped = negatedMatcher(negated)
  return reached.filter((entry) => !dropped(entry) && isDanglingLink(join(cwd, entry)))
}

/** One warning per dangling link under the include globs, each naming its link and the target it points at. */
export function danglingLinkDiagnostics(cwd: string, include: readonly string[]): NativeDiagnostic[] {
  return danglingIncludeLinks(cwd, include).map((link) => {
    const target = linkTarget(join(cwd, link))
    return {
      severity: 'warning',
      message: `dangling symlink: '${link}' points at '${target}', which does not exist, so the scan skips it.`,
      help: ['Point the link at an existing file, or remove it.'],
    }
  })
}

/** The include warnings: the dead positive patterns, then the dangling links, or nothing when the include is clean. */
export function includeMatchDiagnostics(cwd: string, include: readonly string[]): NativeDiagnostic[] {
  return [...deadIncludeDiagnostics(cwd, include), ...danglingLinkDiagnostics(cwd, include)]
}

function negatedMatcher(negated: readonly string[]): (entry: string) => boolean {
  if (negated.length === 0) return () => false
  return picomatch(negated.map((body) => negatedClassesAsCaret(body.replace(/^\.\//, ''))), { dot: true })
}

// A link that exists while its target does not: lstat finds the link, and stat reports the target missing.
function isDanglingLink(absolute: string): boolean {
  if (!isSymlink(absolute)) return false
  try {
    statSync(absolute)
    return false
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'ENOENT'
  }
}

function isSymlink(absolute: string): boolean {
  try {
    return lstatSync(absolute).isSymbolicLink()
  } catch {
    return false
  }
}

function linkTarget(absolute: string): string {
  try {
    return readlinkSync(absolute)
  } catch {
    return '(unreadable)'
  }
}

function deadIncludeDiagnostics(cwd: string, include: readonly string[]): NativeDiagnostic[] {
  const dead = deadIncludePatterns(cwd, include)
  if (dead.length === 0) return []
  const names = dead.map((pattern) => `'${pattern}'`).join(', ')
  const target = dead.length === 1 ? 'it' : 'them'
  return [
    {
      severity: 'warning',
      message: `include matched no files: ${names}. Fragments and tokens under ${target} are not scanned.`,
      help: ['Fix the include globs in the config, or add the files they should reach.'],
    },
  ]
}
