// Include check for a sync. It takes the project root and the config's include
// globs, and emits one warning diagnostic naming each positive pattern that
// matches no file. The engine scans only what the globs reach, so a dead glob
// drops its fragments and tokens without a word; this check says so, using the
// same dot and ignore rules as the engine's scan.

import fg from 'fast-glob'
import { RETENTION_EXCLUDE } from '../collect/constants.ts'
import type { NativeDiagnostic } from '../native/contract.ts'

/** The positive include patterns that match no file under cwd. Negations never count. */
export function deadIncludePatterns(cwd: string, include: readonly string[]): string[] {
  return include.filter(
    (pattern) => !pattern.startsWith('!') && fg.sync(pattern, { cwd, ignore: RETENTION_EXCLUDE, dot: true }).length === 0
  )
}

/** One warning naming the dead include patterns, or nothing when every include reaches a file. */
export function includeMatchDiagnostics(cwd: string, include: readonly string[]): NativeDiagnostic[] {
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
