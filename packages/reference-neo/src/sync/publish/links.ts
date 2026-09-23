// Project links for the Neo generated packages.
// It takes the project root plus the output dir and emits the
// node_modules scope entries pointing at the generated packages.

import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createSymlink } from '../../lib/symlink/index.ts'
import { getShortName } from '../../packager/layout.ts'
import { PACKAGES } from '../../packager/packages.ts'

const LINKED_PACKAGES = PACKAGES.map(pkg => getShortName(pkg.name))

/**
 * Link the generated packages into the project node_modules scope, as core
 * does today. Junctions keep the links valid on Windows and POSIX alike.
 */
export function linkGeneratedPackages(cwd: string, outDir: string): void {
  const scope = resolve(cwd, 'node_modules', '@reference-ui')
  mkdirSync(scope, { recursive: true })
  for (const name of LINKED_PACKAGES) {
    createSymlink(join(outDir, name), join(scope, name))
  }
}
