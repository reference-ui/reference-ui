// Staging directory helper nested inside the Neo generated folder.
// It takes a project root and emits the stage path one sync assembles
// into before committing. The stage sits inside the live folder (never
// beside it), so every commit rename stays on one volume and stays atomic
// while no second top-level folder appears in the project. Readers
// following a known file path never see half-assembled work.

import { join } from 'node:path'
import { getOutDirPath } from './out-dir.ts'

export const SYNC_STAGE_DIR_NAME = 'sync.stage'

/** Stage dir one sync assembles into; the commit moves it live file by file. */
export function getStageDirPath(cwd: string): string {
  return join(getOutDirPath(cwd), SYNC_STAGE_DIR_NAME)
}
