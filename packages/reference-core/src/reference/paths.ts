import { join } from 'node:path'
import { getOutDirPath } from '../lib/paths'

export function getReferenceDirPath(cwd: string): string {
  return join(getOutDirPath(cwd), 'reference')
}

export function getReferenceTastyDirPath(cwd: string): string {
  return join(getReferenceDirPath(cwd), 'tasty')
}

export function getReferenceManifestPath(cwd: string): string {
  return join(getReferenceTastyDirPath(cwd), 'manifest.js')
}
