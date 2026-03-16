import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { pkgRoot, waitFor } from '../virtual/helpers'

export const referenceDir = join(pkgRoot, '.reference-ui', 'reference')
export const referenceTastyDir = join(referenceDir, 'tasty')
export const referenceManifestPath = join(referenceTastyDir, 'manifest.js')

export async function waitForReferenceArtifacts(timeoutMs = 8000): Promise<boolean> {
  return waitFor(() => existsSync(referenceManifestPath), { timeoutMs })
}
