/**
 * Matrix consumer materialization helpers.
 *
 * These functions own the synthetic consumer workspace that each matrix entry
 * executes inside, including staged internal tarballs and generated files.
 */

import { dag } from '@dagger.io/dagger'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { RegistryManifestPackage } from '../../../registry/types.js'
import type { MatrixWorkspacePackage } from '../discovery/index.js'
import { createMatrixConsumerPackageJson, type MatrixFixturePackageJson } from '../managed/package-json/index.js'
import { createMatrixConsumerTsconfig } from '../managed/tsconfig/index.js'
import { matrixLogDir, repoRoot } from './paths.js'
import {
  matrixRefSyncSupportDirectory,
  matrixRefSyncSupportScripts,
} from './ref-sync.js'
import type {
  FixtureSourceFiles,
  MatrixInternalTarballSpec,
  MatrixPackageRunContext,
} from './types.js'

export async function readMatrixPackageSource(packageDir: string): Promise<FixtureSourceFiles> {
  const packageJsonSource = await readFile(resolve(packageDir, 'package.json'), 'utf8')

  return {
    fixturePackageJson: JSON.parse(packageJsonSource) as MatrixFixturePackageJson,
    hasPlaywrightTests: existsSync(resolve(packageDir, 'tests', 'e2e')),
    hasVitestTests: existsSync(resolve(packageDir, 'tests')),
  }
}

export function matrixFixtureSourceDirectory(packageDir: string) {
  return dag.host().directory(packageDir, {
    include: [
      'src',
      'src/**',
      'tests',
      'tests/**',
      'index.html',
      'ui.config.ts',
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
    ],
  })
}

export function collectWorkspaceProtocolDependencyNames(
  dependencies: Record<string, string> | undefined,
): string[] {
  if (!dependencies) {
    return []
  }

  return Object.entries(dependencies)
    .filter(([, version]) => version.startsWith('workspace:'))
    .map(([packageName]) => packageName)
}

export function createStagedTarballFileName(manifestPackage: RegistryManifestPackage): string {
  const safePackageName = manifestPackage.name.replace(/^@/, '').replace(/\//g, '-')
  return `${safePackageName}-${manifestPackage.version}-${manifestPackage.hash.slice(0, 8)}.tgz`
}

export function resolveMatrixInternalTarballSpecs(
  fixturePackageJson: MatrixFixturePackageJson,
  manifestPackages: readonly RegistryManifestPackage[],
): MatrixInternalTarballSpec[] {
  const workspaceDependencyNames = new Set([
    ...collectWorkspaceProtocolDependencyNames(fixturePackageJson.dependencies),
    ...collectWorkspaceProtocolDependencyNames(fixturePackageJson.devDependencies),
  ])
  const manifestByPackageName = new Map(manifestPackages.map(pkg => [pkg.name, pkg]))

  return Array.from(workspaceDependencyNames)
    .map((packageName) => {
      const manifestPackage = manifestByPackageName.get(packageName)

      if (!manifestPackage) {
        return undefined
      }

      const stagedFileName = createStagedTarballFileName(manifestPackage)

      return {
        absoluteTarballPath: resolve(repoRoot, manifestPackage.tarballPath),
        packageName,
        specifier: `file:.matrix-tarballs/${stagedFileName}`,
        stagedFileName,
      }
    })
    .filter((spec): spec is MatrixInternalTarballSpec => spec !== undefined)
}

export async function stageGeneratedConsumerFiles(
  packageRunContext: MatrixPackageRunContext,
  internalTarballSpecs: readonly MatrixInternalTarballSpec[],
): Promise<string> {
  const generatedDir = resolve(matrixLogDir, 'generated', packageRunContext.logPrefix)
  const tarballDir = resolve(generatedDir, '.matrix-tarballs')
  const refSyncSupportDir = resolve(generatedDir, matrixRefSyncSupportDirectory)
  const packageJsonSource = createMatrixConsumerPackageJson({
    fixturePackageJson: packageRunContext.source.fixturePackageJson,
    internalTarballSpecifiers: Object.fromEntries(
      internalTarballSpecs.map(spec => [spec.packageName, spec.specifier]),
    ),
  })

  await mkdir(generatedDir, { recursive: true })
  await mkdir(tarballDir, { recursive: true })
  await mkdir(refSyncSupportDir, { recursive: true })
  await writeFile(resolve(generatedDir, 'package.json'), packageJsonSource)
  await writeFile(resolve(generatedDir, 'tsconfig.json'), createMatrixConsumerTsconfig())
  await Promise.all(
    [
      ...internalTarballSpecs.map(spec =>
        copyFile(spec.absoluteTarballPath, resolve(tarballDir, spec.stagedFileName))),
      ...matrixRefSyncSupportScripts.map(script =>
        copyFile(script.sourceFilePath, resolve(generatedDir, script.outputRelativePath))),
    ],
  )

  return generatedDir
}

export function matrixGeneratedConsumerDirectory(generatedDir: string) {
  return dag.host().directory(generatedDir, {
    include: [
      'package.json',
      'tsconfig.json',
      '.matrix-support',
      '.matrix-support/**',
      '.matrix-tarballs',
      '.matrix-tarballs/**',
    ],
  })
}

export function matrixPackageLogPrefix(packageName: string): string {
  return packageName.replace(/^@/, '').replace(/\//g, '-')
}

export async function createMatrixPackageRunContext(
  matrixPackage: MatrixWorkspacePackage,
): Promise<MatrixPackageRunContext> {
  return {
    config: matrixPackage.config,
    displayName: matrixPackage.workspacePackage.name,
    logPrefix: matrixPackageLogPrefix(matrixPackage.workspacePackage.name),
    source: await readMatrixPackageSource(matrixPackage.workspacePackage.dir),
    workspacePackage: matrixPackage.workspacePackage,
  }
}