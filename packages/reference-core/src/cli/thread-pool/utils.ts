import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveCorePackageDir } from '../utils/resolve-core'

export function resolveWorkerUrl(relativeDistPath: string): string {
  const selfPath = fileURLToPath(import.meta.url)
  const coreDir = resolveCorePackageDir(dirname(selfPath))
  return resolve(coreDir, 'dist/cli', relativeDistPath)
}
