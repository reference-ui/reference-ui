import { join } from 'node:path'
import { getOutDirPath } from './out-dir'

/** Resolve the virtual directory path: outDir/virtual. */
export function getVirtualDirPath(cwd: string): string {
  return join(getOutDirPath(cwd), 'virtual')
}
