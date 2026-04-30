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
import {
  getLatestMatrixBundlerStrategyForPrefix,
  type MatrixBundlerStrategy,
  type MatrixWorkspacePackage,
} from '../discovery/index.js'
import { createManagedBundlerFiles } from '../managed/bundlers/index.js'
import { createMatrixConsumerPackageJson, type MatrixFixturePackageJson } from '../managed/package-json/index.js'
import { createManagedPlaywrightConfigSource } from '../managed/playwright/index.js'
import { createMatrixConsumerTsconfig } from '../managed/tsconfig/index.js'
import { createManagedVitestConfigSource } from '../managed/vitest/index.js'
import { hasMatrixPlaywrightTests, hasMatrixVitestTests } from '../test-presence.js'
import { matrixConsumerArtifactsDir, repoRoot } from './paths.js'
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
    hasPlaywrightTests: hasMatrixPlaywrightTests(packageDir),
    hasVitestGlobalSetup: existsSync(resolve(packageDir, 'tests', 'unit', 'global-setup.ts')),
    hasVitestTests: hasMatrixVitestTests(packageDir),
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
      'webpack.config.cjs',
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
  const generatedDir = resolve(matrixConsumerArtifactsDir, packageRunContext.logPrefix)
  const tarballDir = resolve(generatedDir, '.matrix-tarballs')
  const refSyncSupportDir = resolve(generatedDir, matrixRefSyncSupportDirectory)
  const packageJsonSource = createMatrixConsumerPackageJson({
    bundlers: packageRunContext.effectiveBundlers,
    fixturePackageJson: packageRunContext.source.fixturePackageJson,
    internalTarballSpecifiers: Object.fromEntries(
      internalTarballSpecs.map(spec => [spec.packageName, spec.specifier]),
    ),
  })
  const managedBundlerFiles = createManagedBundlerFiles({
    bundlers: packageRunContext.effectiveBundlers,
    react: packageRunContext.config.react,
    title: `Reference UI ${packageRunContext.config.name} matrix`,
  })

  await mkdir(generatedDir, { recursive: true })
  await mkdir(tarballDir, { recursive: true })
  await mkdir(refSyncSupportDir, { recursive: true })
  await writeFile(resolve(generatedDir, 'package.json'), packageJsonSource)
  await writeFile(resolve(generatedDir, 'tsconfig.json'), createMatrixConsumerTsconfig())
  await Promise.all(
    Object.entries({
      ...managedBundlerFiles,
      'playwright.config.ts': createManagedPlaywrightConfigSource(packageRunContext.effectiveBundlers),
      'vitest.config.ts': createManagedVitestConfigSource({
        globalSetupPath: packageRunContext.source.hasVitestGlobalSetup
          ? './tests/unit/global-setup.ts'
          : null,
      }),
    }).map(([relativePath, source]) => writeFile(resolve(generatedDir, relativePath), source)),
  )
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
      'index.html',
      'package.json',
      'playwright.config.ts',
      'tsconfig.json',
      'vite.config.ts',
      'vitest.config.ts',
      'webpack.config.cjs',
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

export function resolveEffectiveBundlers(
  matrixPackage: MatrixWorkspacePackage,
  options: { full?: boolean } = {},
): readonly MatrixBundlerStrategy[] {
  if (options.full) {
    return matrixPackage.config.bundlers
  }

  const latestViteBundler = getLatestMatrixBundlerStrategyForPrefix('vite', matrixPackage.config.bundlers)

  if (latestViteBundler) {
    return [latestViteBundler]
  }

  return [matrixPackage.config.bundlers[0]]
}

export async function createMatrixPackageRunContext(
  matrixPackage: MatrixWorkspacePackage,
  options: { full?: boolean } = {},
): Promise<MatrixPackageRunContext> {
  return {
    config: matrixPackage.config,
    displayName: matrixPackage.workspacePackage.name,
    effectiveBundlers: resolveEffectiveBundlers(matrixPackage, options),
    logPrefix: matrixPackageLogPrefix(matrixPackage.workspacePackage.name),
    source: await readMatrixPackageSource(matrixPackage.workspacePackage.dir),
    workspacePackage: matrixPackage.workspacePackage,
  }
}