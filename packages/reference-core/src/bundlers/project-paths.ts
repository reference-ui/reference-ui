/** Resolve the current project root, outDir, and managed output roots for bundlers. */

import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DEFAULT_OUT_DIR } from '../constants'
import { resolveManagedOutputRoots } from './outputs'
import type { ReferenceProjectPaths } from './types'

export function resolveProjectPaths(root: string): ReferenceProjectPaths {
  const projectRoot = resolveSyncProjectRoot(resolve(root))
  const outDir = resolve(projectRoot, DEFAULT_OUT_DIR)

  return {
    projectRoot,
    outDir,
    managedOutputRoots: resolveManagedOutputRoots(outDir),
  }
}

/**
 * A bundler root can sit below the sync project root (the lib Book serves
 * from `book/` while sync writes to the package root). When the direct
 * outDir is missing, use the nearest ancestor holding sync output so
 * generated-file watchers subscribe to a real directory.
 */
function resolveSyncProjectRoot(root: string): string {
  const start = root
  if (existsSync(resolve(root, DEFAULT_OUT_DIR))) return root
  let parent = dirname(root)
  while (parent !== root) {
    if (existsSync(resolve(parent, DEFAULT_OUT_DIR))) return parent
    root = parent
    parent = dirname(parent)
  }
  return start
}