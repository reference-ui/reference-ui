import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { pkgRoot, waitFor } from '../virtual/helpers'

export const typesPackageDir = join(pkgRoot, '.reference-ui', 'types')
export const typesTastyDir = join(typesPackageDir, 'tasty')
export const typesPackageManifestPath = join(typesTastyDir, 'manifest.js')
export const typesPackageJsonPath = join(typesPackageDir, 'package.json')
export const installedTypesPackageDir = join(pkgRoot, 'node_modules', '@reference-ui', 'types')

export async function waitForReferenceArtifacts(timeoutMs = 8000): Promise<boolean> {
  return waitFor(() => existsSync(typesPackageManifestPath), { timeoutMs })
}

export async function waitForTypesPackage(timeoutMs = 8000): Promise<boolean> {
  return waitFor(() => existsSync(typesPackageManifestPath) && existsSync(typesPackageJsonPath), { timeoutMs })
}
