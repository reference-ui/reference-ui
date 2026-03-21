/**
 * Mirror `src/reference/browser` into the app virtual dir under `_reference-component`
 * so Panda can scan styled primitives and the same paths resolve in-repo and after publish.
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'
import { resolveCorePackageDir } from '../../lib/paths'
import { copyToVirtual } from '../../virtual/copy'

const REFERENCE_BROWSER_VIRTUAL_DIR = '_reference-component'
const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const REFERENCE_BROWSER_SOURCE_DIR = 'browser'

function resolveReferenceSourcePath(coreDir: string, refRelativePath: string): string {
  const p = join(coreDir, 'src/reference', refRelativePath)
  if (!existsSync(p)) {
    throw new Error(`Reference package file could not be found: ${p}`)
  }
  return p
}

export async function copyReferenceBrowserToVirtual(virtualDir: string): Promise<string[]> {
  const coreDir = resolveCorePackageDir(MODULE_DIR)
  const targetDir = join(virtualDir, REFERENCE_BROWSER_VIRTUAL_DIR)
  const sourceDir = resolveReferenceSourcePath(coreDir, REFERENCE_BROWSER_SOURCE_DIR)
  const sourceFiles = await fg(['**/*'], {
    cwd: sourceDir,
    onlyFiles: true,
    absolute: true,
  })

  return Promise.all(sourceFiles.map(source => copyToVirtual(source, sourceDir, targetDir)))
}
