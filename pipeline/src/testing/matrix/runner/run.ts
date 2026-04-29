/**
 * Matrix runner orchestration.
 *
 * This file should read like the execution narrative: validate fixtures,
 * prepare staged artifacts, establish container runtime access, and fan out the
 * per-package runner across the selected matrix entries.
 */

import * as dagger from '@dagger.io/dagger'
import { getVirtualNativePackageName } from '../../../../../packages/reference-rs/js/shared/targets.js'
import {
  DEFAULT_REGISTRY_URL,
  MANAGED_REGISTRY_PORT,
  MANAGED_REGISTRY_SERVICE_HOST,
  MATRIX_CONFIG,
} from '../../../../config.js'
import { buildWorkspacePackages } from '../../../build/index.js'
import { ensureContainerRuntime, getDockerRuntimeInfo } from '../../../lib/runtime/ensure-container-runtime.js'
import { finishStep, formatDuration, setSkipLoggingMuted, startStep } from '../../../lib/log/index.js'
import { readRegistryManifest } from '../../../registry/manifest.js'
import { listMatrixWorkspacePackages } from '../discovery/index.js'
import { externalPnpmStoreCacheKey } from '../node-modules/cache.js'
import { resolveMatrixPackageConcurrency } from '../concurrency.js'
import { validateMatrixFixtures } from '../validate.js'
import { baseNodeContainer, hostRegistryService } from './container.js'
import { createMatrixPackageRunContext } from './consumer.js'
import { withDaggerExecCacheBuster } from './exec.js'
import { writeStageLog } from './logs.js'
import { matrixLogDir, matrixNativeTarget } from './paths.js'
import { runMatrixPackageInDagger } from './package-runner.js'
import { formatRuntimeMemory } from './reporting.js'
import type { MatrixRunOptions } from './types.js'

const minimumMatrixDockerCpuCount = MATRIX_CONFIG.containerRuntime.cpu
const minimumMatrixDockerMemoryBytes = MATRIX_CONFIG.containerRuntime.memoryGiB * 1024 * 1024 * 1024

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

function logMatrixConcurrency(
  selectedPackageCount: number,
  configuredConcurrency: number,
  packageConcurrency: number,
  dockerCpuCount: number | null,
  hostParallelism: number,
): void {
  if (dockerCpuCount !== null && packageConcurrency < Math.min(selectedPackageCount, configuredConcurrency, hostParallelism)) {
    console.log(
      `Capping matrix concurrency to ${packageConcurrency} because Docker only exposes ${dockerCpuCount} CPU(s). Increase the Docker VM CPUs if you want to run more setup-heavy matrix packages at once.`,
    )
  }

  if (selectedPackageCount < configuredConcurrency) {
    console.log(
      `Running ${packageConcurrency} matrix package(s) in parallel (${selectedPackageCount} selected, configured ${configuredConcurrency}).`,
    )
    return
  }

  console.log(`Running up to ${packageConcurrency} matrix package(s) in parallel.`)
}

export async function runMatrixBootstrapInDagger(options: MatrixRunOptions = {}): Promise<void> {
  console.log('Discovering matrix-enabled fixtures...')
  validateMatrixFixtures()
  const matrixPackages = listMatrixWorkspacePackages(options.packageNames)

  console.log(`Using shared matrix registry at ${DEFAULT_REGISTRY_URL}.`)
  const buildStageStartedAt = Date.now()
  console.log('Preparing workspace packages and registry...')

  try {
    setSkipLoggingMuted(MATRIX_CONFIG.quietPreparationSkips)
    await buildWorkspacePackages(undefined, undefined, {
      requiredRustTargets: [matrixNativeTarget],
      trace: options.trace,
    })
  } finally {
    setSkipLoggingMuted(false)
  }

  console.log(`Prepared workspace packages and registry in ${formatDuration(Date.now() - buildStageStartedAt)}`)

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

  console.log(`Using host registry via ${MANAGED_REGISTRY_SERVICE_HOST}:${MANAGED_REGISTRY_PORT}. Logs: ${matrixLogDir}`)

  const pingStageStartedAt = Date.now()
  const pingStep = startStep('Checking container registry connectivity')
  const pingRunner = withDaggerExecCacheBuster(
    consumerWorkspace,
    'matrix-registry-ping',
  ).withExec(['npm', 'ping', '--registry', DEFAULT_REGISTRY_URL.replace('127.0.0.1', MANAGED_REGISTRY_SERVICE_HOST)])
  const pingOutput = await pingRunner.stdout()
  await writeStageLog('publish-ping.log', pingOutput)
  finishStep(pingStep, `Checked container registry connectivity in ${formatDuration(Date.now() - pingStageStartedAt)}`)
  consumerWorkspace = pingRunner

  const publishedPackageNames = manifest.packages.map((pkg) => `${pkg.name}@${pkg.version}`).join('\n')
  await writeStageLog('publish.log', `${publishedPackageNames}\n`)

  const matrixPackageContexts = await Promise.all(
    matrixPackages.map(matrixPackage => createMatrixPackageRunContext(matrixPackage, { full: options.full })),
  )
  const dockerRuntime = getDockerRuntimeInfo()
  const packageConcurrencyResolution = resolveMatrixPackageConcurrency({
    configuredConcurrency: MATRIX_CONFIG.concurrency,
    runtimeCpuCount: dockerRuntime.cpuCount,
    totalPackages: matrixPackageContexts.length,
  })
  const runtimeDetails = [
    dockerRuntime.cpuCount === null ? null : `${dockerRuntime.cpuCount} CPU(s)`,
    formatRuntimeMemory(dockerRuntime.memoryBytes),
  ].filter((part): part is string => part !== null)

  if (runtimeDetails.length > 0) {
    const contextLabel = dockerRuntime.context ? ` (${dockerRuntime.context})` : ''
    console.log(`Docker runtime${contextLabel} exposes ${runtimeDetails.join(', ')}.`)
  }

  logMatrixConcurrency(
    matrixPackageContexts.length,
    packageConcurrencyResolution.configuredConcurrency,
    packageConcurrencyResolution.concurrency,
    dockerRuntime.cpuCount,
    packageConcurrencyResolution.hostParallelism,
  )

  let nextPackageIndex = 0
  let failed = false
  const executionContext = {
    consumerWorkspace,
    coreVersion: corePackage.version,
    libVersion: libPackage.version,
    manifest,
    registry,
    shouldStop: () => failed,
  }

  await Promise.all(
    Array.from({ length: packageConcurrencyResolution.concurrency }, async () => {
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
    minimumDockerCpuCount: minimumMatrixDockerCpuCount,
    minimumDockerMemoryBytes: minimumMatrixDockerMemoryBytes,
  })

  if (options.trace) {
    console.log('Dagger execution trace enabled (--trace).')
    await dagger.connection(() => runMatrixBootstrapInDagger(options), { LogOutput: process.stdout })
    return
  }

  await dagger.connection(() => runMatrixBootstrapInDagger(options))
}

export type { MatrixRunOptions } from './types.js'