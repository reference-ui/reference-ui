import { join, relative } from 'node:path'

const VIRTUAL_STAGING_SUFFIX = '.next'

/**
 * Full virtual refreshes are prepared in a sibling staging directory and only
 * published into the live virtual path once the snapshot is complete.
 */
export function getVirtualStagingDir(virtualDir: string): string {
  return `${virtualDir}${VIRTUAL_STAGING_SUFFIX}`
}

export function toLiveVirtualPath(
  stagedDir: string,
  liveDir: string,
  stagedPath: string,
): string {
  return join(liveDir, relative(stagedDir, stagedPath))
}
