/**
 * Manifest contract for the pipeline-local registry.
 *
 * The manifest is the handoff between the pack step and the load step. It is
 * intentionally small, stable, and close to the publishable package boundary.
 */

export const registryManifestVersion = 2 as const

export interface RegistryManifestPackage {
  artifactHash?: string
  hash: string
  internalDependencies: string[]
  name: string
  sourceDir: string
  tarballFileName: string
  tarballPath: string
  version: string
}

export interface RegistryManifest {
  generatedAt: string
  packages: RegistryManifestPackage[]
  registry: {
    defaultUrl: string
    kind: 'npm-compatible'
  }
  version: typeof registryManifestVersion
}