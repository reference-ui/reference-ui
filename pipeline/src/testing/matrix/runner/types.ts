/**
 * Shared types for the matrix runner implementation.
 *
 * These types stay close to the runner so helper modules can coordinate
 * without pulling orchestration details back into the public entrypoint.
 */

import type * as dagger from '@dagger.io/dagger'
import type { RegistryManifest, RegistryManifestPackage } from '../../../registry/types.js'
import type { MatrixBundlerStrategy, MatrixWorkspacePackage } from '../discovery/index.js'
import type { MatrixFixturePackageJson } from '../managed/package-json/index.js'

export interface FixtureSourceFiles {
  fixturePackageJson: MatrixFixturePackageJson
  hasPlaywrightTests: boolean
  hasVitestGlobalSetup: boolean
  hasVitestTests: boolean
}

export interface MatrixPackageRunContext {
  config: MatrixWorkspacePackage['config']
  displayName: string
  effectiveBundlers: readonly MatrixBundlerStrategy[]
  logPrefix: string
  source: FixtureSourceFiles
  workspacePackage: MatrixWorkspacePackage['workspacePackage']
}

export interface MatrixPackageExecutionContext {
  consumerWorkspace: dagger.Container
  coreVersion: string
  libVersion: string
  manifest: RegistryManifest
  registry: dagger.Service
  shouldStop: () => boolean
}

export interface MatrixInternalTarballSpec {
  absoluteTarballPath: string
  packageName: string
  specifier: string
  stagedFileName: string
}

export interface MatrixPackageRunResult {
  failed: boolean
  output: string
}

export type MatrixPackageStageLogPhase = 'install' | 'setup' | 'test'

export interface MatrixRunOptions {
  commandLabel?: string
  full?: boolean
  packageNames?: readonly string[]
  trace?: boolean
}

export type { MatrixFixturePackageJson, MatrixWorkspacePackage, RegistryManifestPackage }