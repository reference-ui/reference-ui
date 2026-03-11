import { mkdirSync } from 'node:fs'
import { copyPackageAssets } from './assets'
import { copyEntry } from './entry'
import { writePackageJson } from './package-json'
import type { BundleOptions } from './types'

/**
 * Bundle a package using esbuild or copy its contents
 */
export async function bundlePackage(options: BundleOptions): Promise<void> {
  const { targetDir, pkg } = options
  mkdirSync(targetDir, { recursive: true })

  await copyEntry(options)
  await copyPackageAssets(options)
  writePackageJson(targetDir, pkg)
}

export type { BundleOptions } from './types'
