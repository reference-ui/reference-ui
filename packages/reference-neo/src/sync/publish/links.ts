// Project links for the Neo generated packages.
// It takes the project root plus the output dir and emits the
// node_modules scope entries pointing at the generated packages.

import { lstatSync, mkdirSync, rmSync, symlinkSync, unlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'

const LINKED_PACKAGES = ['system', 'styled', 'react'] as const

function replaceLink(targetDir: string, linkPath: string): void {
  try {
    const stat = lstatSync(linkPath)
    if (stat.isSymbolicLink()) unlinkSync(linkPath)
    else rmSync(linkPath, { recursive: true, force: true })
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error
  }
  symlinkSync(targetDir, linkPath, 'junction')
}

/**
 * Link the generated packages into the project node_modules scope, as core
 * does today. Junctions keep the links valid on Windows and POSIX alike.
 */
export function linkGeneratedPackages(cwd: string, outDir: string): void {
  const scope = resolve(cwd, 'node_modules', '@reference-ui')
  mkdirSync(scope, { recursive: true })
  for (const name of LINKED_PACKAGES) {
    replaceLink(join(outDir, name), join(scope, name))
  }
}
