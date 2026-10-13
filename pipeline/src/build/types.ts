/**
 * Shared package model for the pipeline workspace.
 *
 * The pipeline only needs a small subset of package.json metadata, so this
 * module keeps that contract in one place instead of re-declaring it across
 * build, registry, and CLI modules.
 */

export interface WorkspacePackage {
  dependencies: Record<string, string>
  dir: string
  name: string
  packageJson?: Record<string, unknown>
  private: boolean
  scripts: Record<string, string>
  version: string
}

export interface BuildRegistryArtifactPackage {
  hash: string
  internalDependencies: string[]
  name: string
  sourceDir: string
  tarballFileName: string
  tarballPath: string
  version: string
}

export interface BuildPackageJsonOverride {
  optionalDependencies?: Record<string, string>
}

export interface BuildRegistryArtifacts {
  cacheKey?: string
  generatedPackages: BuildRegistryArtifactPackage[]
  /**
   * Warnings for native targets the prepared pack left out. Artifacts with any
   * are never reused, so every pack that leaves a target out says so again.
   */
  leftOutWarnings?: string[]
  packageHashAugmentations: Record<string, string>
  preparedPackageJsonOverrides: Record<string, BuildPackageJsonOverride>
}