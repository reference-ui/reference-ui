import { join } from 'node:path'
import { getOutDirPath } from '../../lib/paths'

export function getReferenceTastyDirPath(cwd: string): string {
  return join(getOutDirPath(cwd), 'types', 'tasty')
}

export function getReferenceManifestPath(cwd: string): string {
  return join(getReferenceTastyDirPath(cwd), 'manifest.js')
}
