// Temp directory helpers nested under the Core generated folder.
// They take a project root or out dir and emit the hidden tmp path.
// This module is a core-owned copy of the retired reference-core tmp-dir seam.

import { join, resolve } from 'node:path'
import { DEFAULT_OUT_DIR } from '../../constants.ts'

/**
 * Hidden project temp directory used before user config has been loaded.
 */
export function getProjectTmpDirPath(cwd: string): string {
  return join(resolve(cwd), DEFAULT_OUT_DIR, 'tmp')
}

/** Resolve the temp directory nested under an already-resolved outDir. */
export function getOutDirTmpPath(outDir: string): string {
  return join(resolve(outDir), 'tmp')
}
