/**
 * Containerized matrix bootstrap runner.
 *
 * This is the first real Dagger-owned matrix step. It reuses the single
 * pipeline-managed local Verdaccio registry on the host, binds that registry
 * into the Dagger graph, generates a minimal downstream consumer from the
 * install matrix package, and runs `ref sync` in a clean container.
 */

import { dag } from '@dagger.io/dagger'
import * as dagger from '@dagger.io/dagger'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getVirtualNativePackageName, type VirtualNativeTarget } from '../../../../packages/reference-rs/js/shared/targets.js'
import {
  consumerDirInContainer,
  defaultRegistryUrl,
  managedRegistryHost,
  managedRegistryPort,
  managedRegistryServiceHost,
  registryUrlInContainer,
} from '../../../config.js'
import { buildWorkspacePackages } from '../../build/index.js'
import type { MatrixWorkspacePackage } from './discovery.js'
import { ensureContainerRuntime } from '../../lib/runtime/ensure-container-runtime.js'
import { readRegistryManifest } from '../../registry/manifest.js'
import { listMatrixWorkspacePackages } from './discovery.js'
import { createMatrixConsumerPackageJson, type MatrixFixturePackageJson } from './transforms/package-json.js'
import { createMatrixConsumerTsconfig } from './transforms/tsconfig.js'
import { validateMatrixFixtures } from './validate.js'

const matrixDir = dirname(fileURLToPath(import.meta.url))
const pipelineDir = resolve(matrixDir, '..', '..', '..')
const repoRoot = resolve(pipelineDir, '..')
const matrixLogDir = resolve(repoRoot, '.pipeline', 'testing', 'matrix')
const matrixNativeTarget: VirtualNativeTarget = 'linux-x64-gnu'

interface FixtureSourceFiles {
  fixturePackageJson: MatrixFixturePackageJson
  fixtureFiles: Record<string, string>
  configSource: string
}

interface MatrixPackageRunContext {
  displayName: string
  logPrefix: string
  source: FixtureSourceFiles
  workspacePackage: MatrixWorkspacePackage['workspacePackage']
}

function isDirectExecution(): boolean {
  return process.argv[1] === fileURLToPath(import.meta.url)
}

function registryManifestCacheKey(manifest: Awaited<ReturnType<typeof readRegistryManifest>>): string {
  const fingerprint = manifest.packages
    .map((pkg) => `${pkg.name}@${pkg.version}:${pkg.hash}`)
    .join('|')

  const digest = createHash('sha256').update(fingerprint).digest('hex').slice(0, 16)
  return `reference-ui-pipeline-pnpm-store-${digest}`
}

function baseNodeContainer(pnpmStoreCacheKey: string) {
  const pnpmStore = dag.cacheVolume(pnpmStoreCacheKey)

  return dag
    .container()
    .from('node:24-bookworm')
    .withEnvVariable('CI', '1')
    .withEnvVariable('NO_COLOR', '1')
    .withEnvVariable('npm_config_update_notifier', 'false')
    .withEnvVariable('PNPM_HOME', '/pnpm')
    .withEnvVariable('npm_config_store_dir', '/pnpm/store')
    .withMountedCache('/pnpm/store', pnpmStore)
    .withExec(['corepack', 'enable'])
    .withExec(['corepack', 'prepare', 'pnpm@10.29.3', '--activate'])
}

async function readFixtureSourceTree(rootDir: string, relativeDir = ''): Promise<Record<string, string>> {
  const absoluteDir = resolve(rootDir, relativeDir)
  const entries = await readdir(absoluteDir, { withFileTypes: true })
  const files: Record<string, string> = {}

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryRelativePath = relativeDir.length > 0 ? `${relativeDir}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      Object.assign(files, await readFixtureSourceTree(rootDir, entryRelativePath))
      continue
    }

    files[entryRelativePath] = await readFile(resolve(rootDir, entryRelativePath), 'utf8')
  }

  return files
}

async function readMatrixPackageSource(packageDir: string): Promise<FixtureSourceFiles> {
  const fixtureDir = packageDir
  const fixtureFiles = {
    ...(existsSync(resolve(fixtureDir, 'src')) ? await readFixtureSourceTree(fixtureDir, 'src') : {}),
    ...(existsSync(resolve(fixtureDir, 'tests')) ? await readFixtureSourceTree(fixtureDir, 'tests') : {}),
  }

  const [packageJsonSource, configSource] = await Promise.all([
    readFile(resolve(fixtureDir, 'package.json'), 'utf8'),
    readFile(resolve(fixtureDir, 'ui.config.ts'), 'utf8'),
  ])

  return {
    fixturePackageJson: JSON.parse(packageJsonSource) as MatrixFixturePackageJson,
    fixtureFiles,
    configSource,
  }
}

function matrixPackageLogPrefix(packageName: string): string {
  return packageName.replace(/^@/, '').replace(/\//g, '-')
}

async function createMatrixPackageRunContext(
  matrixPackage: MatrixWorkspacePackage,
): Promise<MatrixPackageRunContext> {
  return {
    displayName: matrixPackage.workspacePackage.name,
    logPrefix: matrixPackageLogPrefix(matrixPackage.workspacePackage.name),
    source: await readMatrixPackageSource(matrixPackage.workspacePackage.dir),
    workspacePackage: matrixPackage.workspacePackage,
  }
}

function hostRegistryService() {
  return dag.host().service([{ backend: managedRegistryPort }], {
    host: managedRegistryHost,
  })
}

async function writeStageLog(fileName: string, output: string): Promise<void> {
  await mkdir(matrixLogDir, { recursive: true })
  await writeFile(resolve(matrixLogDir, fileName), output)
}

async function writeMatrixPackageStageLog(
  packageRunContext: MatrixPackageRunContext,
  phase: 'install' | 'ref-sync' | 'test',
  output: string,
): Promise<void> {
  await writeStageLog(`${packageRunContext.logPrefix}-${phase}.log`, output)
}

function assertMatrixRustTargetAvailable(
  manifest: Awaited<ReturnType<typeof readRegistryManifest>>,
): void {
  const rustRootPackage = manifest.packages.find((pkg) => pkg.name === '@reference-ui/rust')

  if (!rustRootPackage) {
    return
  }

  const requiredTargetPackageName = getVirtualNativePackageName(matrixNativeTarget)
  const requiredTargetPackage = manifest.packages.find((pkg) => pkg.name === requiredTargetPackageName)

  if (requiredTargetPackage?.version === rustRootPackage.version) {
    return
  }

  throw new Error(
    [
      `Matrix bootstrap requires ${requiredTargetPackageName}@${rustRootPackage.version} for the ${matrixNativeTarget} container runtime, but the staged registry manifest does not contain it.`,
      'The host-side Rust staging step did not produce a matching Linux target tarball for this @reference-ui/rust version.',
      'Build or publish the Linux target package for the current rust version before running matrix tests.',
    ].join(' '),
  )
}

export async function runMatrixBootstrapInDagger(): Promise<void> {
  console.log('1. Discovering matrix-enabled fixtures...')
  validateMatrixFixtures()
  const matrixPackages = listMatrixWorkspacePackages()

  console.log('2. Building changed workspace packages and staging the shared host Verdaccio registry...')
  console.log(`   Using the single pipeline registry at ${defaultRegistryUrl}.`)
  await buildWorkspacePackages(undefined, undefined, {
    requiredRustTargets: [matrixNativeTarget],
  })
  const manifest = await readRegistryManifest()
  assertMatrixRustTargetAvailable(manifest)
  const corePackage = manifest.packages.find((pkg) => pkg.name === '@reference-ui/core')
  const libPackage = manifest.packages.find((pkg) => pkg.name === '@reference-ui/lib')

  if (!corePackage) {
    throw new Error('Expected @reference-ui/core to be present in the packed registry manifest.')
  }

  if (!libPackage) {
    throw new Error('Expected @reference-ui/lib to be present in the packed registry manifest.')
  }

  const workspace = baseNodeContainer(registryManifestCacheKey(manifest))
  const registry = hostRegistryService()

  let consumerWorkspace = workspace.withServiceBinding('registry', registry)

  console.log('4. Binding the shared host Verdaccio registry into the Dagger graph...')
  console.log(
    `   Verdaccio still lives on the host; Dagger is only forwarding it into the container graph as ${managedRegistryServiceHost}:${managedRegistryPort}.`,
  )
  console.log(`   Step logs will be written to ${matrixLogDir}.`)

  console.log('4.1 Checking registry connectivity from inside the container graph...')
  const pingRunner = consumerWorkspace.withExec(['npm', 'ping', '--registry', registryUrlInContainer])
  const pingOutput = await pingRunner.stdout()
  await writeStageLog('publish-ping.log', pingOutput)
  if (pingOutput.trim().length > 0) {
    process.stdout.write(pingOutput)
  }
  consumerWorkspace = pingRunner

  const publishedPackageNames = manifest.packages.map((pkg) => `${pkg.name}@${pkg.version}`).join('\n')
  await writeStageLog('publish.log', `${publishedPackageNames}\n`)

  const matrixPackageContexts = await Promise.all(
    matrixPackages.map(matrixPackage => createMatrixPackageRunContext(matrixPackage)),
  )

  for (const packageRunContext of matrixPackageContexts) {
    console.log(`3. Reading ${packageRunContext.displayName} source...`)

    const consumerBase = consumerWorkspace
      .withNewFile(
        `${consumerDirInContainer}/package.json`,
        createMatrixConsumerPackageJson({
          coreVersion: corePackage.version,
          fixturePackageJson: packageRunContext.source.fixturePackageJson,
          libVersion: libPackage.version,
        }),
      )
      .withNewFile(`${consumerDirInContainer}/tsconfig.json`, createMatrixConsumerTsconfig())
      .withNewFile(`${consumerDirInContainer}/ui.config.ts`, packageRunContext.source.configSource)
      .withWorkdir(consumerDirInContainer)

    const consumerWithSource = Object.entries(packageRunContext.source.fixtureFiles)
      .sort(([left], [right]) => left.localeCompare(right))
      .reduce(
        (container, [relativePath, contents]) => container.withNewFile(`${consumerDirInContainer}/${relativePath}`, contents),
        consumerBase,
      )

    console.log(`5. Installing ${packageRunContext.displayName} dependencies from Verdaccio...`)
    console.log(
      `   Output is buffered by the Dagger Node SDK and will be written to ${resolve(matrixLogDir, `${packageRunContext.logPrefix}-install.log`)}.`,
    )
    const installRunner = consumerWithSource.withExec([
      'pnpm',
      'install',
      '--reporter',
      'append-only',
      '--registry',
      registryUrlInContainer,
    ])
    const installOutput = await installRunner.stdout()
    await writeMatrixPackageStageLog(packageRunContext, 'install', installOutput)
    if (installOutput.trim().length > 0) {
      process.stdout.write(installOutput)
    }

    console.log(`6. Running ref sync for ${packageRunContext.displayName} inside the clean consumer container...`)
    console.log(
      `   Output is buffered by the Dagger Node SDK and will be written to ${resolve(matrixLogDir, `${packageRunContext.logPrefix}-ref-sync.log`)}.`,
    )
    const syncRunner = installRunner.withExec(['pnpm', 'exec', 'ref', 'sync'])

    try {
      const syncOutput = await syncRunner.stdout()
      await writeMatrixPackageStageLog(packageRunContext, 'ref-sync', syncOutput)
      process.stdout.write(syncOutput)

      console.log(`7. Running ${packageRunContext.displayName} test command inside the clean consumer container...`)
      console.log(
        `   Output is buffered by the Dagger Node SDK and will be written to ${resolve(matrixLogDir, `${packageRunContext.logPrefix}-test.log`)}.`,
      )
      const testRunner = syncRunner.withExec(['pnpm', 'test'])
      const testOutput = await testRunner.stdout()
      await writeMatrixPackageStageLog(packageRunContext, 'test', testOutput)
      process.stdout.write(testOutput)
      console.log(`\nMatrix package ${packageRunContext.displayName} completed successfully inside Dagger.`)
    } catch (error) {
      await writeMatrixPackageStageLog(
        packageRunContext,
        'test',
        error instanceof Error ? error.message : String(error),
      )
      if (error instanceof Error) {
        console.error(error.message)
      }
      process.exitCode = 1
      return
    }
  }
}

if (isDirectExecution()) {
  ensureContainerRuntime()
  await dagger.connection(runMatrixBootstrapInDagger, { LogOutput: process.stdout })
}