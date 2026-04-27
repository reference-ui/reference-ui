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
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getVirtualNativePackageName, type VirtualNativeTarget } from '../../../../packages/reference-rs/js/shared/targets.js'
import {
  matrixNodeImage,
  matrixNodeModulesCacheKey,
  registryManifestCacheKey,
} from './node-modules/cache.js'
import { createMatrixConsumerPackageJson, type MatrixFixturePackageJson } from './managed/package-json/index.js'
import { createMatrixConsumerTsconfig } from './managed/tsconfig/index.js'
import {
  consumerDirInContainer,
  defaultRegistryUrl,
  managedRegistryHost,
  managedRegistryPort,
  managedRegistryServiceHost,
  registryUrlInContainer,
} from '../../../config.js'
import { buildWorkspacePackages } from '../../build/index.js'
import type { MatrixWorkspacePackage } from './discovery/index.js'
import { ensureContainerRuntime } from '../../lib/runtime/ensure-container-runtime.js'
import { readRegistryManifest } from '../../registry/manifest.js'
import { listMatrixWorkspacePackages } from './discovery/index.js'
import { validateMatrixFixtures } from './validate.js'
import { failStep, finishStep, formatDuration, startStep, writeFailureOutput } from '../../lib/log/index.js'

const matrixDir = dirname(fileURLToPath(import.meta.url))
const pipelineDir = resolve(matrixDir, '..', '..', '..')
const repoRoot = resolve(pipelineDir, '..')
const matrixLogDir = resolve(repoRoot, '.pipeline', 'testing', 'matrix')
const matrixNativeTarget: VirtualNativeTarget = 'linux-x64-gnu'
const minimumMatrixDockerMemoryBytes = 4 * 1024 * 1024 * 1024

interface FixtureSourceFiles {
  fixturePackageJson: MatrixFixturePackageJson
  hasPlaywrightTests: boolean
  hasVitestTests: boolean
}

interface MatrixPackageRunContext {
  displayName: string
  logPrefix: string
  source: FixtureSourceFiles
  workspacePackage: MatrixWorkspacePackage['workspacePackage']
}

export interface MatrixRunOptions {
  commandLabel?: string
  packageNames?: readonly string[]
}

const matrixConsumerSetupCommand = ['pnpm', 'exec', 'ref', 'sync'] as const
const matrixConsumerVitestCommand = ['pnpm', 'exec', 'vitest', 'run'] as const
const matrixConsumerPlaywrightCommand = ['pnpm', 'exec', 'playwright', 'test', 'e2e'] as const
const matrixConsumerTypecheckCommand = ['pnpm', 'exec', 'tsc', '--noEmit'] as const

function readErrorOutput(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('utf8')
  }

  return ''
}

function writeMatrixFailureDetails(error: unknown): void {
  if (!error || typeof error !== 'object') {
    return
  }

  const stdout = readErrorOutput((error as { stdout?: unknown }).stdout)
  const stderr = readErrorOutput((error as { stderr?: unknown }).stderr)

  writeFailureOutput(stdout, 'matrix stdout')
  writeFailureOutput(stderr, 'matrix stderr')
}

function isDirectExecution(): boolean {
  return process.argv[1] === fileURLToPath(import.meta.url)
}

function baseNodeContainer(pnpmStoreCacheKey: string, image: string = matrixNodeImage) {
  const pnpmStore = dag.cacheVolume(pnpmStoreCacheKey)
  const container = dag
    .container()
    .from(image)
    .withEnvVariable('CI', '1')
    .withEnvVariable('FORCE_COLOR', '1')
    .withEnvVariable('npm_config_update_notifier', 'false')
    .withEnvVariable('PNPM_HOME', '/pnpm')
    .withEnvVariable('npm_config_store_dir', '/pnpm/store')
    .withMountedCache('/pnpm/store', pnpmStore)
    .withExec(['corepack', 'enable'])

  if (image === matrixNodeImage) {
    return container
      .withExec(['corepack', 'prepare', 'pnpm@10.29.3', '--activate'])
      .withEnvVariable('npm_config_registry', registryUrlInContainer)
  }

  return container
    .withExec(['npm', 'install', '--global', '--force', `pnpm@10.29.3`])
    .withEnvVariable('npm_config_registry', registryUrlInContainer)
}

function parsePinnedPlaywrightVersion(versionRange: string | undefined): string {
  const match = versionRange?.match(/\d+\.\d+\.\d+/)

  if (match) {
    return match[0]
  }

  return '1.48.0'
}

function matrixContainerImage(source: FixtureSourceFiles): string {
  if (!source.hasPlaywrightTests) {
    return matrixNodeImage
  }

  const playwrightVersion = parsePinnedPlaywrightVersion(source.fixturePackageJson.devDependencies?.['@playwright/test'])
  return `mcr.microsoft.com/playwright:v${playwrightVersion}-jammy`
}

async function readMatrixPackageSource(packageDir: string): Promise<FixtureSourceFiles> {
  const packageJsonSource = await readFile(resolve(packageDir, 'package.json'), 'utf8')

  return {
    fixturePackageJson: JSON.parse(packageJsonSource) as MatrixFixturePackageJson,
    hasPlaywrightTests: existsSync(resolve(packageDir, 'e2e')),
    hasVitestTests: existsSync(resolve(packageDir, 'tests')) || existsSync(resolve(packageDir, 'unit')),
  }
}

function matrixFixtureSourceDirectory(packageDir: string) {
  return dag.host().directory(packageDir, {
    include: [
      'src',
      'src/**',
      'tests',
      'tests/**',
      'unit',
      'unit/**',
      'e2e',
      'e2e/**',
      'ui.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
    ],
  })
}

async function stageGeneratedConsumerFiles(
  packageRunContext: MatrixPackageRunContext,
  packageJsonSource: string,
): Promise<string> {
  const generatedDir = resolve(matrixLogDir, 'generated', packageRunContext.logPrefix)
  await mkdir(generatedDir, { recursive: true })
  await writeFile(resolve(generatedDir, 'package.json'), packageJsonSource)
  await writeFile(resolve(generatedDir, 'tsconfig.json'), createMatrixConsumerTsconfig())
  return generatedDir
}

function matrixGeneratedConsumerDirectory(generatedDir: string) {
  return dag.host().directory(generatedDir, {
    include: ['package.json', 'tsconfig.json'],
  })
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
  phase: 'install' | 'setup' | 'test',
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

export async function runMatrixBootstrapInDagger(options: MatrixRunOptions = {}): Promise<void> {
  console.log('Discovering matrix-enabled fixtures...')
  validateMatrixFixtures()
  const matrixPackages = listMatrixWorkspacePackages(options.packageNames)

  console.log(`Using shared matrix registry at ${defaultRegistryUrl}.`)
  const buildStageStartedAt = Date.now()
  const buildStep = startStep('Preparing workspace packages and registry')
  const previousQuietSkips = process.env.REF_PIPELINE_QUIET_SKIPS

  try {
    process.env.REF_PIPELINE_QUIET_SKIPS = '1'
    await buildWorkspacePackages(undefined, undefined, {
      requiredRustTargets: [matrixNativeTarget],
    })
  } finally {
    if (previousQuietSkips === undefined) {
      delete process.env.REF_PIPELINE_QUIET_SKIPS
    } else {
      process.env.REF_PIPELINE_QUIET_SKIPS = previousQuietSkips
    }
  }

  finishStep(buildStep, `Prepared workspace packages and registry in ${formatDuration(Date.now() - buildStageStartedAt)}`)
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

  console.log(`Using host registry via ${managedRegistryServiceHost}:${managedRegistryPort}. Logs: ${matrixLogDir}`)
  const pingStageStartedAt = Date.now()
  const pingStep = startStep('Checking container registry connectivity')
  const pingRunner = consumerWorkspace.withExec(['npm', 'ping', '--registry', registryUrlInContainer])
  const pingOutput = await pingRunner.stdout()
  await writeStageLog('publish-ping.log', pingOutput)
  finishStep(pingStep, `Checked container registry connectivity in ${formatDuration(Date.now() - pingStageStartedAt)}`)
  consumerWorkspace = pingRunner

  const publishedPackageNames = manifest.packages.map((pkg) => `${pkg.name}@${pkg.version}`).join('\n')
  await writeStageLog('publish.log', `${publishedPackageNames}\n`)

  const matrixPackageContexts = await Promise.all(
    matrixPackages.map(matrixPackage => createMatrixPackageRunContext(matrixPackage)),
  )

  for (const packageRunContext of matrixPackageContexts) {
    console.log(`\n${packageRunContext.displayName}`)

    const consumerPackageJsonSource = createMatrixConsumerPackageJson({
      coreVersion: corePackage.version,
      fixturePackageJson: packageRunContext.source.fixturePackageJson,
      libVersion: libPackage.version,
    })
    const generatedConsumerDir = await stageGeneratedConsumerFiles(
      packageRunContext,
      consumerPackageJsonSource,
    )
    const containerImage = matrixContainerImage(packageRunContext.source)

    const nodeModulesCache = dag.cacheVolume(
      matrixNodeModulesCacheKey({
        containerImage,
        coreVersion: corePackage.version,
        fixturePackageJson: packageRunContext.source.fixturePackageJson,
        libVersion: libPackage.version,
        manifest,
      }),
    )

    const packageConsumerWorkspace = packageRunContext.source.hasPlaywrightTests
      ? baseNodeContainer(registryManifestCacheKey(manifest), containerImage).withServiceBinding('registry', registry)
      : consumerWorkspace

    const consumerBase = packageConsumerWorkspace
      .withDirectory(
        consumerDirInContainer,
        matrixFixtureSourceDirectory(packageRunContext.workspacePackage.dir),
      )
      .withDirectory(
        consumerDirInContainer,
        matrixGeneratedConsumerDirectory(generatedConsumerDir),
      )
      .withMountedCache(`${consumerDirInContainer}/node_modules`, nodeModulesCache)
      .withWorkdir(consumerDirInContainer)

    const packageStartedAt = Date.now()
    const installStageStartedAt = Date.now()
    const installStep = startStep(`${packageRunContext.displayName}: installing dependencies`)
    const installRunner = consumerBase.withExec([
      'pnpm',
      'install',
      '--reporter',
      'append-only',
      '--registry',
      registryUrlInContainer,
    ])
    const installOutput = await installRunner.stdout()
    await writeMatrixPackageStageLog(packageRunContext, 'install', installOutput)
    finishStep(installStep, `${packageRunContext.displayName}: installed dependencies in ${formatDuration(Date.now() - installStageStartedAt)}`)

    const setupStageStartedAt = Date.now()
    const setupStep = startStep(`${packageRunContext.displayName}: setting up container`)
    const setupRunner = installRunner.withExec([...matrixConsumerSetupCommand])

    try {
      const setupOutput = await setupRunner.stdout()
      await writeMatrixPackageStageLog(packageRunContext, 'setup', setupOutput)
      finishStep(setupStep, `${packageRunContext.displayName}: set up container in ${formatDuration(Date.now() - setupStageStartedAt)}`)

      console.log('  Running tests')
      let testRunner = setupRunner
      const testLogOutputs: string[] = []
      const testConsoleOutputs: string[] = []

      if (packageRunContext.source.hasVitestTests) {
        const vitestRunner = testRunner.withExec([...matrixConsumerVitestCommand])
        const vitestOutput = await vitestRunner.stdout()
        testLogOutputs.push(vitestOutput)
        testConsoleOutputs.push(vitestOutput)
        testRunner = vitestRunner
      }

      if (packageRunContext.source.hasPlaywrightTests) {
        const playwrightRunner = testRunner.withExec([...matrixConsumerPlaywrightCommand])
        const playwrightOutput = await playwrightRunner.stdout()
        testLogOutputs.push(playwrightOutput)
        testConsoleOutputs.push(playwrightOutput)
        testRunner = playwrightRunner
      }

      const typecheckRunner = testRunner.withExec([...matrixConsumerTypecheckCommand])
      const typecheckOutput = await typecheckRunner.stdout()
      testLogOutputs.push(typecheckOutput)
      const testOutput = testLogOutputs.filter(output => output.length > 0).join('\n')
      await writeMatrixPackageStageLog(packageRunContext, 'test', testOutput)
      process.stdout.write(testConsoleOutputs.filter(output => output.length > 0).join('\n'))
      console.log(`\n  Completed in ${formatDuration(Date.now() - packageStartedAt)}`)
    } catch (error) {
      failStep(setupStep, `${packageRunContext.displayName}: failed during setup/test execution`)
      writeMatrixFailureDetails(error)
      await writeMatrixPackageStageLog(
        packageRunContext,
        'test',
        error instanceof Error ? error.message : String(error),
      )
      console.error(`  Failed. See ${resolve(matrixLogDir, `${packageRunContext.logPrefix}-test.log`)}`)
      if (error instanceof Error) {
        console.error(error.message)
      }
      process.exitCode = 1
      return
    }
  }
}

export async function runMatrixTests(options: MatrixRunOptions = {}): Promise<void> {
  ensureContainerRuntime({
    commandLabel: options.commandLabel ?? 'pnpm pipeline test',
    minimumDockerMemoryBytes: minimumMatrixDockerMemoryBytes,
  })

  if (process.env.REF_PIPELINE_MATRIX_DAGGER_TRACE === '1') {
    await dagger.connection(() => runMatrixBootstrapInDagger(options), { LogOutput: process.stdout })
    return
  }

  await dagger.connection(() => runMatrixBootstrapInDagger(options))
}

if (isDirectExecution()) {
  await runMatrixTests({ commandLabel: 'pnpm pipeline:test:matrix' })
}