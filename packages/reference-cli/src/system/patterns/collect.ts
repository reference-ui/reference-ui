/**
 * Pattern collection — system and user sources.
 * System patterns: internal/container, internal/r (built-in extensions).
 * User patterns: extendPattern calls in user code (scanned at runtime).
 */

import { collectFragments, scanForFragments } from '../../lib/fragments'
import { createBoxPatternCollector } from '../collectors/extendPattern'
import type { BoxPatternExtension } from '../collectors/extendPattern'
import type { CollectPatternsOptions, CollectedPatterns } from './types'

/** Paths relative to CLI root for system pattern sources */
export const SYSTEM_PATTERN_INCLUDES = [
  'src/system/internal/container/**/*.ts',
  'src/system/internal/r/**/*.ts',
] as const

export type { CollectPatternsOptions, CollectedPatterns } from './types'

/**
 * Collect system pattern fragments from internal sources.
 * Used at build time (styled) and as base for runtime merge.
 */
export async function collectSystemPatterns(
  cwd: string,
  tempDir: string
): Promise<BoxPatternExtension[]> {
  const patternCollector = createBoxPatternCollector()

  const fragmentFiles = scanForFragments({
    include: [...SYSTEM_PATTERN_INCLUDES],
    functionNames: ['extendPattern'],
    exclude: ['**/*.d.ts', '**/index.ts'],
    cwd,
  })

  if (fragmentFiles.length === 0) {
    return []
  }

  const extensions = await collectFragments({
    files: fragmentFiles,
    collector: patternCollector,
    tempDir,
  })

  return extensions as BoxPatternExtension[]
}

/**
 * Collect user pattern fragments from user code (extendPattern calls).
 * Used at runtime during ref sync.
 */
export async function collectUserPatterns(
  cwd: string,
  userInclude: string[],
  tempDir: string,
  fragmentBundleAlias?: Record<string, string>
): Promise<BoxPatternExtension[]> {
  const patternCollector = createBoxPatternCollector()

  const fragmentFiles = scanForFragments({
    include: userInclude,
    functionNames: ['extendPattern'],
    exclude: ['**/node_modules/**', '**/*.d.ts', '**/dist/**', '**/.reference-ui/**'],
    cwd,
  })

  if (fragmentFiles.length === 0) {
    return []
  }

  const extensions = await collectFragments({
    files: fragmentFiles,
    collector: patternCollector,
    tempDir,
    ...(fragmentBundleAlias && { alias: fragmentBundleAlias }),
  })

  return extensions as BoxPatternExtension[]
}

/**
 * Collect and merge system + optional user patterns.
 * Single entry point for the pattern pipeline.
 */
export async function collectPatterns(
  options: CollectPatternsOptions
): Promise<CollectedPatterns> {
  const { cwd, cliRoot, includeUser = false, userInclude = [], tempDir, fragmentBundleAlias } = options
  const systemCwd = cliRoot ?? cwd

  const system = await collectSystemPatterns(systemCwd, tempDir)

  let user: BoxPatternExtension[] = []
  if (includeUser && userInclude.length > 0) {
    user = await collectUserPatterns(cwd, userInclude, tempDir, fragmentBundleAlias)
  }

  const merged = [...system, ...user]

  return { system, user, merged }
}
