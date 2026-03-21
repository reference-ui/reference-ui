/**
 * Mirror `src/reference/browser` into the app virtual dir (flat under `_reference-component`)
 * so Panda can scan styled primitives and the same paths resolve in-repo and after publish.
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveCorePackageDir } from '../../lib/paths'
import { copyToVirtual } from '../../virtual/copy'

const REFERENCE_BROWSER_VIRTUAL_DIR = '_reference-component'
const MODULE_DIR = dirname(fileURLToPath(import.meta.url))

/** Paths under `src/reference` mirrored into the app virtual dir (flat under `_reference-component`). */
const REFERENCE_BROWSER_VIRTUAL_FILES = ['browser/component.tsx'] as const

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

  const paths: string[] = []
  for (const rel of REFERENCE_BROWSER_VIRTUAL_FILES) {
    const source = resolveReferenceSourcePath(coreDir, rel)
    const destPath = await copyToVirtual(source, dirname(source), targetDir)
    paths.push(destPath)
  }
  return paths
}
