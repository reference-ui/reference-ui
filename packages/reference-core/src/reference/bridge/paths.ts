// Reference bridge paths: they take a project root and emit the tasty output
// dir plus the manifest path inside it. Both live under the neo outDir beside
// the styled/react legs; the manifest path is what the types leg packages.

import { join } from 'node:path'
import { getOutDirPath } from '../../lib/paths/index.ts'

export function getReferenceTastyDirPath(cwd: string): string {
  return join(getOutDirPath(cwd), 'types', 'tasty')
}

export function getReferenceManifestPath(cwd: string): string {
  return join(getReferenceTastyDirPath(cwd), 'manifest.js')
}
