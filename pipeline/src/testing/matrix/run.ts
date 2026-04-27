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
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { availableParallelism } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getVirtualNativePackageName, type VirtualNativeTarget } from '../../../../packages/reference-rs/js/shared/targets.js'
import {
  externalPnpmStoreCacheKey,
  matrixNodeImage,
  matrixNodeModulesCacheKey,
} from './node-modules/cache.js'
import { createMatrixConsumerPackageJson, type MatrixFixturePackageJson } from './managed/package-json/index.js'
import { createMatrixConsumerTsconfig } from './managed/tsconfig/index.js'
import {
  consumerDirInContainer,
  defaultRegistryUrl,
  matrixConfig,
  managedRegistryHost,
  managedRegistryPort,
  managedRegistryServiceHost,
  registryUrlInContainer,
} from '../../../config.js'
import { buildWorkspacePackages } from '../../build/index.js'
import type { MatrixWorkspacePackage } from './discovery/index.js'
import { ensureContainerRuntime } from '../../lib/runtime/ensure-container-runtime.js'
import { finishStep, formatDuration, setSkipLoggingMuted, startStep } from '../../lib/log/index.js'
import { readRegistryManifest } from '../../registry/manifest.js'
import type { RegistryManifestPackage } from '../../registry/types.js'
import { listMatrixWorkspacePackages } from './discovery/index.js'
import { validateMatrixFixtures } from './validate.js'

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

interface MatrixPackageExecutionContext {
  consumerWorkspace: ReturnType<typeof baseNodeContainer>
  coreVersion: string
  libVersion: string
  manifest: Awaited<ReturnType<typeof readRegistryManifest>>
  registry: ReturnType<typeof hostRegistryService>
  shouldStop: () => boolean
}

interface MatrixInternalTarballSpec {
  absoluteTarballPath: string
  packageName: string
  specifier: string
  stagedFileName: string
}

interface MatrixPackageRunResult {
  failed: boolean
  output: string
}

type MatrixPackagePhase =
  | 'queued'
  | 'install'
  | 'setup'
  | 'test:vitest'
  | 'test:playwright'
  | 'test:typecheck'
  | 'aborted'
  | 'completed'
  | 'failed'

type TimedMatrixPackagePhase = Exclude<MatrixPackagePhase, 'queued' | 'aborted' | 'completed' | 'failed'>

export interface MatrixRunOptions {
  commandLabel?: string
  disableDaggerExecCache?: boolean
  packageNames?: readonly string[]
}

const matrixConsumerSetupCommand = ['pnpm', 'exec', 'ref', 'sync'] as const
const matrixConsumerVitestCommand = ['pnpm', 'exec', 'vitest', 'run'] as const
const matrixConsumerPlaywrightCommand = ['pnpm', 'exec', 'playwright', 'test', 'e2e'] as const
const matrixConsumerTypecheckCommand = ['pnpm', 'exec', 'tsc', '--noEmit'] as const

function daggerExecOptions(options: MatrixRunOptions): { noCache?: boolean } | undefined {
  return options.disableDaggerExecCache ? { noCache: true } : undefined
}

function readErrorOutput(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('utf8')
  }

  return ''
}

function collectMatrixFailureDetails(error: unknown): string[] {
  if (!error || typeof error !== 'object') {
    return []
  }

  const stdout = readErrorOutput((error as { stdout?: unknown }).stdout).trim()
  const stderr = readErrorOutput((error as { stderr?: unknown }).stderr).trim()
  const sections: string[] = []

  if (stdout.length > 0) {
    sections.push(`  matrix stdout:\n${stdout}`)
  }

  if (stderr.length > 0) {
    sections.push(`  matrix stderr:\n${stderr}`)
  }

  return sections
}

function resolveMatrixPackageConcurrency(totalPackages: number): number {
  const configured = Math.max(1, matrixConfig.concurrency)
  return Math.min(totalPackages, Math.max(1, Math.min(configured, availableParallelism())))
}

function appendOutputBlock(lines: string[], output: string): void {
  const trimmed = output.trim()

  if (trimmed.length === 0) {
    return
  }

  lines.push('', trimmed)
}

function logMatrixPackagePhase(
  packageRunContext: MatrixPackageRunContext,
  phase: MatrixPackagePhase,
  detail?: string,
): void {
  const suffix = detail ? ` ${detail}` : ''
  console.log(`- ${packageRunContext.displayName}: ${phase}${suffix}`)
}

function formatPhaseTimingSummary(
  phaseDurations: Partial<Record<TimedMatrixPackagePhase, number>>,
  totalDurationMs: number,
): string {
  const orderedPhases: readonly TimedMatrixPackagePhase[] = [
    'install',
    'setup',
    'test:vitest',
    'test:playwright',
    'test:typecheck',
  ]

  const phaseParts = orderedPhases
    .filter(phase => phaseDurations[phase] !== undefined)
    .map(phase => `${phase}=${formatDuration(phaseDurations[phase] ?? 0)}`)

  phaseParts.push(`total=${formatDuration(totalDurationMs)}`)
  return phaseParts.join(', ')
}

function createAbortedMatrixPackageResult(
  packageRunContext: MatrixPackageRunContext,
  lines: string[],
  phaseDurations: Partial<Record<TimedMatrixPackagePhase, number>>,
  packageStartedAt: number,
  stageLabel: string,
): MatrixPackageRunResult {
  const totalDurationMs = Date.now() - packageStartedAt
  const timingSummary = formatPhaseTimingSummary(phaseDurations, totalDurationMs)

  logMatrixPackagePhase(packageRunContext, 'aborted', `before ${stageLabel}; timings ${timingSummary}`)
  lines.push(`  Aborted before ${stageLabel} after another matrix package failed.`)
  lines.push(`  Timings so far: ${timingSummary}`)

  return {
    failed: false,
    output: `${lines.join('\n')}\n`,
  }
}

async function runMatrixPackageInDagger(
  packageRunContext: MatrixPackageRunContext,
  executionContext: MatrixPackageExecutionContext,
  options: MatrixRunOptions,
): Promise<MatrixPackageRunResult> {
  const lines = [`\n${packageRunContext.displayName}`]
  const packageStartedAt = Date.now()
  let phase: 'install' | 'setup' | 'test' = 'install'
  const phaseDurations: Partial<Record<TimedMatrixPackagePhase, number>> = {}
  let activeTimedPhase: TimedMatrixPackagePhase | undefined
  let activePhaseStartedAt: number | undefined

  logMatrixPackagePhase(packageRunContext, 'queued')

  const internalTarballSpecs = resolveMatrixInternalTarballSpecs(
    packageRunContext.source.fixturePackageJson,
    executionContext.manifest.packages,
  )

  const consumerPackageJsonSource = createMatrixConsumerPackageJson({
    fixturePackageJson: packageRunContext.source.fixturePackageJson,
    internalTarballSpecifiers: Object.fromEntries(
      internalTarballSpecs.map(spec => [spec.packageName, spec.specifier]),
    ),
  })
  const generatedConsumerDir = await stageGeneratedConsumerFiles(
    packageRunContext,
    consumerPackageJsonSource,
    internalTarballSpecs,
  )
  const containerImage = matrixContainerImage(packageRunContext.source)

  const nodeModulesCache = dag.cacheVolume(
    matrixNodeModulesCacheKey({
      containerImage,
      coreVersion: executionContext.coreVersion,
      fixturePackageJson: packageRunContext.source.fixturePackageJson,
      libVersion: executionContext.libVersion,
      manifest: executionContext.manifest,
    }),
  )

  const packageConsumerWorkspace = packageRunContext.source.hasPlaywrightTests
    ? baseNodeContainer(externalPnpmStoreCacheKey(containerImage), containerImage)
      .withServiceBinding('registry', executionContext.registry)
    : executionContext.consumerWorkspace

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

  try {
    const installStageStartedAt = Date.now()
    activeTimedPhase = 'install'
    activePhaseStartedAt = installStageStartedAt
    logMatrixPackagePhase(packageRunContext, 'install')
    const installRunner = consumerBase.withExec([
      'pnpm',
      'install',
      '--reporter',
      'append-only',
      '--registry',
      registryUrlInContainer,
    ], daggerExecOptions(options))
    const installOutput = await installRunner.stdout()
    await writeMatrixPackageStageLog(packageRunContext, 'install', installOutput)
    const installDurationMs = Date.now() - installStageStartedAt
    phaseDurations.install = installDurationMs
    const installDuration = formatDuration(installDurationMs)
    activeTimedPhase = undefined
    activePhaseStartedAt = undefined
    logMatrixPackagePhase(packageRunContext, 'install', `complete (${installDuration})`)
    lines.push(`  Installed dependencies in ${installDuration}`)

    if (executionContext.shouldStop()) {
      return createAbortedMatrixPackageResult(
        packageRunContext,
        lines,
        phaseDurations,
        packageStartedAt,
        'setup',
      )
    }

    phase = 'setup'
    const setupStageStartedAt = Date.now()
    activeTimedPhase = 'setup'
    activePhaseStartedAt = setupStageStartedAt
    logMatrixPackagePhase(packageRunContext, 'setup')
    const setupRunner = installRunner.withExec([...matrixConsumerSetupCommand], daggerExecOptions(options))
    const setupOutput = await setupRunner.stdout()
    await writeMatrixPackageStageLog(packageRunContext, 'setup', setupOutput)
    const setupDurationMs = Date.now() - setupStageStartedAt
    phaseDurations.setup = setupDurationMs
    const setupDuration = formatDuration(setupDurationMs)
    activeTimedPhase = undefined
    activePhaseStartedAt = undefined
    logMatrixPackagePhase(packageRunContext, 'setup', `complete (${setupDuration})`)
    lines.push(`  Ran ref sync in ${setupDuration}`)

    if (executionContext.shouldStop()) {
      return createAbortedMatrixPackageResult(
        packageRunContext,
        lines,
        phaseDurations,
        packageStartedAt,
        'tests',
      )
    }

    phase = 'test'
    lines.push('  Running tests')
    let testRunner = setupRunner
    const testLogOutputs: string[] = []

    if (packageRunContext.source.hasVitestTests) {
      logMatrixPackagePhase(packageRunContext, 'test:vitest')
      const vitestStageStartedAt = Date.now()
      activeTimedPhase = 'test:vitest'
      activePhaseStartedAt = vitestStageStartedAt
      const vitestRunner = testRunner.withExec([...matrixConsumerVitestCommand], daggerExecOptions(options))
      const vitestOutput = await vitestRunner.stdout()
      const vitestDurationMs = Date.now() - vitestStageStartedAt
      phaseDurations['test:vitest'] = vitestDurationMs
      activeTimedPhase = undefined
      activePhaseStartedAt = undefined
      testLogOutputs.push(vitestOutput)
      appendOutputBlock(lines, vitestOutput)
      testRunner = vitestRunner
      logMatrixPackagePhase(packageRunContext, 'test:vitest', `complete (${formatDuration(vitestDurationMs)})`)

      if (executionContext.shouldStop()) {
        return createAbortedMatrixPackageResult(
          packageRunContext,
          lines,
          phaseDurations,
          packageStartedAt,
          packageRunContext.source.hasPlaywrightTests ? 'test:playwright' : 'test:typecheck',
        )
      }
    }

    if (packageRunContext.source.hasPlaywrightTests) {
      logMatrixPackagePhase(packageRunContext, 'test:playwright')
      const playwrightStageStartedAt = Date.now()
      activeTimedPhase = 'test:playwright'
      activePhaseStartedAt = playwrightStageStartedAt
      const playwrightRunner = testRunner.withExec([...matrixConsumerPlaywrightCommand], daggerExecOptions(options))
      const playwrightOutput = await playwrightRunner.stdout()
      const playwrightDurationMs = Date.now() - playwrightStageStartedAt
      phaseDurations['test:playwright'] = playwrightDurationMs
      activeTimedPhase = undefined
      activePhaseStartedAt = undefined
      testLogOutputs.push(playwrightOutput)
      appendOutputBlock(lines, playwrightOutput)
      testRunner = playwrightRunner
      logMatrixPackagePhase(packageRunContext, 'test:playwright', `complete (${formatDuration(playwrightDurationMs)})`)

      if (executionContext.shouldStop()) {
        return createAbortedMatrixPackageResult(
          packageRunContext,
          lines,
          phaseDurations,
          packageStartedAt,
          'test:typecheck',
        )
      }
    }

    logMatrixPackagePhase(packageRunContext, 'test:typecheck')
    const typecheckStageStartedAt = Date.now()
    activeTimedPhase = 'test:typecheck'
    activePhaseStartedAt = typecheckStageStartedAt
    const typecheckRunner = testRunner.withExec([...matrixConsumerTypecheckCommand], daggerExecOptions(options))
    const typecheckOutput = await typecheckRunner.stdout()
    const typecheckDurationMs = Date.now() - typecheckStageStartedAt
    phaseDurations['test:typecheck'] = typecheckDurationMs
    activeTimedPhase = undefined
    activePhaseStartedAt = undefined
    testLogOutputs.push(typecheckOutput)
    const testOutput = testLogOutputs.filter(output => output.length > 0).join('\n')
    await writeMatrixPackageStageLog(packageRunContext, 'test', testOutput)
    logMatrixPackagePhase(packageRunContext, 'test:typecheck', `complete (${formatDuration(typecheckDurationMs)})`)
    const totalDurationMs = Date.now() - packageStartedAt
    const totalDuration = formatDuration(totalDurationMs)
    const timingSummary = formatPhaseTimingSummary(phaseDurations, totalDurationMs)
    logMatrixPackagePhase(packageRunContext, 'completed', `(${totalDuration})`)
    logMatrixPackagePhase(packageRunContext, 'completed', `timings ${timingSummary}`)
    lines.push(`  Timings: ${timingSummary}`)
    lines.push('', `  Completed in ${totalDuration}`)

    return {
      failed: false,
      output: `${lines.join('\n')}\n`,
    }
  } catch (error) {
    if (activeTimedPhase && activePhaseStartedAt) {
      phaseDurations[activeTimedPhase] = Date.now() - activePhaseStartedAt
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    await writeMatrixPackageStageLog(packageRunContext, phase, errorMessage)
    lines.push(`  Failed during ${phase}. See ${resolve(matrixLogDir, `${packageRunContext.logPrefix}-${phase}.log`)}`)
    lines.push(...collectMatrixFailureDetails(error))

    if (errorMessage.trim().length > 0) {
      lines.push(`  ${errorMessage}`)
    }

    const totalDurationMs = Date.now() - packageStartedAt
    const timingSummary = formatPhaseTimingSummary(phaseDurations, totalDurationMs)
    logMatrixPackagePhase(packageRunContext, 'failed', `during ${phase}; timings ${timingSummary}`)
    lines.push(`  Timings so far: ${timingSummary}`)

    return {
      failed: true,
      output: `${lines.join('\n')}\n`,
    }
  }
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

function collectWorkspaceProtocolDependencyNames(
  dependencies: Record<string, string> | undefined,
): string[] {
  if (!dependencies) {
    return []
  }

  return Object.entries(dependencies)
    .filter(([, version]) => version.startsWith('workspace:'))
    .map(([packageName]) => packageName)
}

function createStagedTarballFileName(manifestPackage: RegistryManifestPackage): string {
  const safePackageName = manifestPackage.name.replace(/^@/, '').replace(/\//g, '-')
  return `${safePackageName}-${manifestPackage.version}-${manifestPackage.hash.slice(0, 8)}.tgz`
}

function resolveMatrixInternalTarballSpecs(
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

async function stageGeneratedConsumerFiles(
  packageRunContext: MatrixPackageRunContext,
  packageJsonSource: string,
  internalTarballSpecs: readonly MatrixInternalTarballSpec[],
): Promise<string> {
  const generatedDir = resolve(matrixLogDir, 'generated', packageRunContext.logPrefix)
  const tarballDir = resolve(generatedDir, '.matrix-tarballs')
  await mkdir(generatedDir, { recursive: true })
  await mkdir(tarballDir, { recursive: true })
  await writeFile(resolve(generatedDir, 'package.json'), packageJsonSource)
  await writeFile(resolve(generatedDir, 'tsconfig.json'), createMatrixConsumerTsconfig())
  await Promise.all(
    internalTarballSpecs.map(spec =>
      copyFile(spec.absoluteTarballPath, resolve(tarballDir, spec.stagedFileName))),
  )

  return generatedDir
}

function matrixGeneratedConsumerDirectory(generatedDir: string) {
  return dag.host().directory(generatedDir, {
    include: ['package.json', 'tsconfig.json', '.matrix-tarballs', '.matrix-tarballs/**'],
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
  console.log('Preparing workspace packages and registry...')

  try {
    setSkipLoggingMuted(matrixConfig.quietPreparationSkips)
    await buildWorkspacePackages(undefined, undefined, {
      requiredRustTargets: [matrixNativeTarget],
    })
  } finally {
    setSkipLoggingMuted(false)
  }

  console.log(
    `Prepared workspace packages and registry in ${formatDuration(Date.now() - buildStageStartedAt)}`,
  )
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

  const workspace = baseNodeContainer(externalPnpmStoreCacheKey())
  const registry = hostRegistryService()

  let consumerWorkspace = workspace.withServiceBinding('registry', registry)

  console.log(`Using host registry via ${managedRegistryServiceHost}:${managedRegistryPort}. Logs: ${matrixLogDir}`)
  if (options.disableDaggerExecCache) {
    console.log('Dagger exec-result caching disabled for this run.')
  }
  const pingStageStartedAt = Date.now()
  const pingStep = startStep('Checking container registry connectivity')
  const pingRunner = consumerWorkspace.withExec(['npm', 'ping', '--registry', registryUrlInContainer], daggerExecOptions(options))
  const pingOutput = await pingRunner.stdout()
  await writeStageLog('publish-ping.log', pingOutput)
  finishStep(pingStep, `Checked container registry connectivity in ${formatDuration(Date.now() - pingStageStartedAt)}`)
  consumerWorkspace = pingRunner

  const publishedPackageNames = manifest.packages.map((pkg) => `${pkg.name}@${pkg.version}`).join('\n')
  await writeStageLog('publish.log', `${publishedPackageNames}\n`)

  const matrixPackageContexts = await Promise.all(
    matrixPackages.map(matrixPackage => createMatrixPackageRunContext(matrixPackage)),
  )

  const packageConcurrency = resolveMatrixPackageConcurrency(matrixPackageContexts.length)
  console.log(`Running up to ${packageConcurrency} matrix package(s) in parallel.`)

  const executionContext: MatrixPackageExecutionContext = {
    consumerWorkspace,
    coreVersion: corePackage.version,
    libVersion: libPackage.version,
    manifest,
    registry,
    shouldStop: () => failed,
  }

  let nextPackageIndex = 0
  let failed = false

  await Promise.all(
    Array.from({ length: packageConcurrency }, async () => {
      while (!failed) {
        const packageIndex = nextPackageIndex
        nextPackageIndex += 1

        if (packageIndex >= matrixPackageContexts.length) {
          return
        }

        const result = await runMatrixPackageInDagger(matrixPackageContexts[packageIndex], executionContext, options)
        process.stdout.write(result.output)

        if (result.failed) {
          failed = true
          return
        }
      }
    }),
  )

  if (failed) {
    process.exitCode = 1
  }
}

export async function runMatrixTests(options: MatrixRunOptions = {}): Promise<void> {
  ensureContainerRuntime({
    commandLabel: options.commandLabel ?? 'pnpm pipeline test',
    minimumDockerMemoryBytes: minimumMatrixDockerMemoryBytes,
  })

  if (matrixConfig.daggerTrace) {
    await dagger.connection(() => runMatrixBootstrapInDagger(options), { LogOutput: process.stdout })
    return
  }

  await dagger.connection(() => runMatrixBootstrapInDagger(options))
}

if (isDirectExecution()) {
  await runMatrixTests({ commandLabel: 'pnpm pipeline:test:matrix' })
}