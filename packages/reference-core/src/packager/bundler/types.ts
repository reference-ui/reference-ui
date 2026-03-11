import type { PackageDefinition } from '../package'

export interface BundleOptions {
  coreDir: string
  outDir: string
  targetDir: string
  pkg: PackageDefinition
}
