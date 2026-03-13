import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { bundleWithEsbuild } from './esbuild'
import { getEntryBasename } from '../layout'
import type { BundleOptions } from './types'

/**
 * Write the package entry into the output directory, either by bundling the
 * source entry or by copying it directly.
 */
export async function copyEntry(options: BundleOptions): Promise<void> {
  const { coreDir, targetDir, pkg } = options
  if (!pkg.entry) return

  const entrySource = resolve(coreDir, pkg.entry)
  if (!existsSync(entrySource)) return

  const outfile = getEntryBasename(pkg)
  const destPath = resolve(targetDir, outfile)

  if (pkg.bundle) {
    await bundleWithEsbuild(coreDir, targetDir, pkg.entry, outfile)
    return
  }

  mkdirSync(dirname(destPath), { recursive: true })
  cpSync(entrySource, destPath)
}
