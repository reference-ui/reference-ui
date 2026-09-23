import { resolve } from 'node:path'
import { getOutDir } from '../../config/store'

/** Resolve the absolute out-dir path relative to cwd. */
export function getOutDirPath(cwd: string): string {
  return resolve(cwd, getOutDir())
}
