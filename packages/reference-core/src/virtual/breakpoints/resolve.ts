import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { collectFragments } from '../../lib/fragments'
import { scanForFragments } from '../../lib/fragments/scanner'
import { createTokensCollector } from '../../system/api/tokens'
import {
  extractBreakpointTable,
  type BreakpointTokenFragment,
} from '../../system/panda/config/extensions/api/extractBreakpointTable'

const cache = new Map<string, Promise<Record<string, string>>>()

const TOKEN_IMPORT_SOURCES = [
  '@reference-ui/system',
  '@reference-ui/core/config',
  '@reference-ui/cli/config',
] as const

const FRAGMENT_EXCLUDE = [
  '**/node_modules/**',
  '**/*.d.ts',
  '**/dist/**',
  '**/build/**',
  '**/scripts/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
] as const

async function compute(root: string, include: string[]): Promise<Record<string, string>> {
  const files = scanForFragments({
    include,
    importFrom: [...TOKEN_IMPORT_SOURCES],
    exclude: [...FRAGMENT_EXCLUDE],
    cwd: root,
  })

  if (files.length === 0) {
    return {}
  }

  const tempDir = mkdtempSync(join(tmpdir(), 'ref-ui-bp-'))
  try {
    const fragments = (await collectFragments({
      files,
      collector: createTokensCollector(),
      tempDir,
    })) as BreakpointTokenFragment[]
    return extractBreakpointTable(fragments)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

/**
 * Resolve the breakpoint name → pixel-width lookup for a project. Result is
 * memoized per root for the lifetime of the process so watch-mode reloads
 * stay cheap. Call `invalidate(root)` after a token fragment changes.
 */
export function resolveBreakpointsForProject(
  root: string,
  include: string[]
): Promise<Record<string, string>> {
  const cached = cache.get(root)
  if (cached) return cached
  const promise = compute(root, include).catch((err) => {
    cache.delete(root)
    throw err
  })
  cache.set(root, promise)
  return promise
}

export function invalidateBreakpointsCache(root?: string): void {
  if (root === undefined) {
    cache.clear()
    return
  }
  cache.delete(root)
}
