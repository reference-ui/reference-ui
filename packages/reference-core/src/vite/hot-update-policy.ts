/**
 * Classify Vite hot updates that should be buffered until the sync session is
 * ready.
 *
 * Two categories must be deferred:
 *
 * 1. managed generated outputs under `.reference-ui`
 * 2. project source modules that can trigger browser HMR before generated CSS
 *    and runtime artifacts are safe to consume
 */

import { relative } from 'node:path'
import type { HmrContext } from 'vite'
import { isManagedOutputFile, toNormalizedPath } from './outputs'
import type { ReferenceViteProjectPaths } from './types'

export function shouldDeferHotUpdate(
  ctx: HmrContext,
  projectPaths: ReferenceViteProjectPaths
): boolean {
  if (isManagedOutputFile(ctx.file, projectPaths.managedOutputRoots)) return true
  return isProjectSourceHotUpdate(ctx, projectPaths)
}

function isProjectSourceHotUpdate(
  ctx: HmrContext,
  projectPaths: ReferenceViteProjectPaths
): boolean {
  const normalizedFile = toNormalizedPath(ctx.file)
  const normalizedProjectRoot = toNormalizedPath(projectPaths.projectRoot)
  const normalizedOutDir = toNormalizedPath(projectPaths.outDir)

  if (!normalizedFile.startsWith(`${normalizedProjectRoot}/`)) return false
  if (normalizedFile.startsWith(`${normalizedOutDir}/`)) return false

  const projectRelativePath = relative(projectPaths.projectRoot, ctx.file)
  if (projectRelativePath.startsWith('node_modules/')) return false

  return ctx.modules.length > 0
}