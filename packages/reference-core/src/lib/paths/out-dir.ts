// Generated-folder path resolution relative to a project root.
// It takes a working directory and emits the absolute out-dir path.
// This module is a core-owned copy of the retired reference-core out-dir seam.

import { resolve } from 'node:path'
import { getOutDir } from '../../config/store.ts'

/** Resolve the absolute out-dir path relative to cwd. */
export function getOutDirPath(cwd: string): string {
  return resolve(cwd, getOutDir())
}
