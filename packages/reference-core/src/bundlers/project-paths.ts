/** Resolve the current project root, outDir, and managed output roots for bundlers. */

import { resolve } from 'node:path'
import { DEFAULT_OUT_DIR } from './constants'
import { resolveManagedOutputRoots } from './outputs'
import type { ReferenceProjectPaths } from './types'

export function resolveProjectPaths(root: string): ReferenceProjectPaths {
  const projectRoot = resolve(root)
  const outDir = resolve(projectRoot, DEFAULT_OUT_DIR)

  return {
    projectRoot,
    outDir,
    managedOutputRoots: resolveManagedOutputRoots(outDir),
  }
}