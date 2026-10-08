// Asset copier for Neo generated packages.
// It takes the output dir, a package target dir, and the definition's copy list, and emits the declared files into the package.
// Narrowed on purpose: file-from-outDir only, synchronous — the react styles.css is the sole asset, and sync already runs serial.

import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { PackageDefinition } from './package/index.ts'

/**
 * Copy the extra files declared by the package definition into the package output.
 */
export function copyPackageAssets(outDir: string, targetDir: string, pkg: PackageDefinition): void {
  if (!pkg.copyFrom) return
  for (const entry of pkg.copyFrom) {
    const destPath = resolve(targetDir, entry.dest)
    mkdirSync(dirname(destPath), { recursive: true })
    copyFileSync(resolve(outDir, entry.src), destPath)
  }
}
