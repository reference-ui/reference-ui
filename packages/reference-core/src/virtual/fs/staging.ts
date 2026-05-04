import { join, relative } from 'node:path'
import { emit } from '../../lib/event-bus'
import { resetDir } from '../../lib/fs/reset-dir'
import { publishStagedDir } from '../../lib/fs/publish-staged-dir'
import { copyToVirtual } from './copy'

const VIRTUAL_STAGING_SUFFIX = '.next'

export interface VirtualStagingArea {
  liveDir: string
  stagingDir: string
  reset(): Promise<void>
  stageFile(payload: {
    file: string
    root: string
    debug?: boolean
    breakpoints?: Record<string, string>
  }): Promise<void>
  publish(): Promise<void>
}

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

/**
 * Snapshot staging keeps a full refresh isolated until every staged file and
 * collected style module is ready to publish in one swap.
 */
export function createVirtualStagingArea(virtualDir: string): VirtualStagingArea {
  const stagingDir = getVirtualStagingDir(virtualDir)

  return {
    liveDir: virtualDir,
    stagingDir,

    async reset(): Promise<void> {
      await resetDir(stagingDir)
    },

    async stageFile(payload: {
      file: string
      root: string
      debug?: boolean
      breakpoints?: Record<string, string>
    }): Promise<void> {
      const { file, root, debug, breakpoints } = payload
      const stagedPath = await copyToVirtual(file, root, stagingDir, { debug, breakpoints })
      emit('virtual:fs:change', {
        event: 'add',
        path: toLiveVirtualPath(stagingDir, virtualDir, stagedPath),
      })
    },

    async publish(): Promise<void> {
      await publishStagedDir(stagingDir, virtualDir)
    },
  }
}
