/**
 * Per-package matrix execution.
 *
 * This module runs a single matrix package through install, setup, and test
 * phases while the top-level runner decides package order and concurrency.
 */

import { dag } from '@dagger.io/dagger'
import * as dagger from '@dagger.io/dagger'
import { resolve } from 'node:path'
import {
  consumerDirInContainer,
  registryUrlInContainer,
} from '../../../../config.js'
import { formatDuration } from '../../../lib/log/index.js'
import { createMatrixInstallCommand, hasWarmMatrixInstallCache, matrixInstallCacheKeyEnvVar } from '../node-modules/install.js'
import {
  externalPnpmStoreCacheKey,
  matrixNodeModulesCacheKey,
} from '../node-modules/cache.js'
import {
  formatRefSyncSetupMilestoneSummary,
  parseRefSyncSetupMilestones,
} from '../setup-metrics.js'
import { baseNodeContainer, matrixContainerImage } from './container.js'
import {
  matrixFixtureSourceDirectory,
  matrixGeneratedConsumerDirectory,
  resolveMatrixInternalTarballSpecs,
  stageGeneratedConsumerFiles,
} from './consumer.js'
import { withDaggerExecCacheBuster } from './exec.js'
import { writeMatrixPackageStageLog } from './logs.js'
import { matrixLogDir } from './paths.js'
import {
  appendOutputBlock,
  collectMatrixFailureDetails,
  createAbortedMatrixPackageResult,
  formatPhaseTimingSummary,
  logMatrixPackagePhase,
} from './reporting.js'
import type {
  MatrixPackageExecutionContext,
  MatrixPackageRunContext,
  MatrixPackageRunResult,
  MatrixRunOptions,
  TimedMatrixPackagePhase,
} from './types.js'

const matrixConsumerSetupCommand = ['pnpm', 'exec', 'ref', 'sync'] as const
const matrixConsumerVitestCommand = ['pnpm', 'exec', 'vitest', 'run'] as const
const matrixConsumerPlaywrightCommand = ['pnpm', 'exec', 'playwright', 'test', 'e2e'] as const
const matrixConsumerTypecheckCommand = ['pnpm', 'exec', 'tsc', '--noEmit'] as const

export async function runMatrixPackageInDagger(
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
  const generatedConsumerDir = await stageGeneratedConsumerFiles(
    packageRunContext,
    internalTarballSpecs,
  )
  const containerImage = matrixContainerImage(packageRunContext.source)
  const nodeModulesCacheKey = matrixNodeModulesCacheKey({
    containerImage,
    coreVersion: executionContext.coreVersion,
    fixturePackageJson: packageRunContext.source.fixturePackageJson,
    libVersion: executionContext.libVersion,
    manifest: executionContext.manifest,
  })
  const nodeModulesCache = dag.cacheVolume(nodeModulesCacheKey)

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
    const warmInstallCache = await hasWarmMatrixInstallCache(
      consumerBase,
      nodeModulesCacheKey,
      packageRunContext.logPrefix,
    )
    let installOutput: string
    let postInstallRunner: dagger.Container

    if (warmInstallCache) {
      installOutput = `Reused cached node_modules volume for ${nodeModulesCacheKey}; skipped pnpm install.\n`
      postInstallRunner = consumerBase
    } else {
      postInstallRunner = withDaggerExecCacheBuster(
        consumerBase.withEnvVariable(matrixInstallCacheKeyEnvVar, nodeModulesCacheKey),
        options,
        `${packageRunContext.logPrefix}-install`,
      ).withExec(createMatrixInstallCommand(registryUrlInContainer))
      installOutput = await postInstallRunner.stdout()
    }

    await writeMatrixPackageStageLog(packageRunContext, 'install', installOutput)
    const installDurationMs = Date.now() - installStageStartedAt
    phaseDurations.install = installDurationMs
    const installDuration = formatDuration(installDurationMs)
    activeTimedPhase = undefined
    activePhaseStartedAt = undefined

    if (warmInstallCache) {
      logMatrixPackagePhase(packageRunContext, 'install', `cache hit (${installDuration})`)
      lines.push(`  Reused cached dependencies in ${installDuration}`)
    } else {
      logMatrixPackagePhase(packageRunContext, 'install', `complete (${installDuration})`)
      lines.push(`  Installed dependencies in ${installDuration}`)
    }

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
    const setupRunner = withDaggerExecCacheBuster(
      postInstallRunner,
      options,
      `${packageRunContext.logPrefix}-setup`,
    ).withExec([...matrixConsumerSetupCommand])
    const setupOutput = await setupRunner.stdout()
    await writeMatrixPackageStageLog(packageRunContext, 'setup', setupOutput)
    const setupDurationMs = Date.now() - setupStageStartedAt
    phaseDurations.setup = setupDurationMs
    const setupDuration = formatDuration(setupDurationMs)
    const setupMilestones = parseRefSyncSetupMilestones(setupOutput)
    activeTimedPhase = undefined
    activePhaseStartedAt = undefined
    logMatrixPackagePhase(packageRunContext, 'setup', `complete (${setupDuration})`)

    if (setupMilestones.length > 0) {
      const setupMilestoneSummary = formatRefSyncSetupMilestoneSummary(setupMilestones)
      const setupBottleneck = setupMilestones
        .filter(milestone => milestone.summaryLabel !== 'sync-total')
        .sort((left, right) => right.durationMs - left.durationMs)[0]

      if (setupBottleneck) {
        logMatrixPackagePhase(
          packageRunContext,
          'setup',
          `bottleneck ${setupBottleneck.summaryLabel} (${formatDuration(setupBottleneck.durationMs)})`,
        )
      }

      logMatrixPackagePhase(packageRunContext, 'setup', `milestones ${setupMilestoneSummary}`)
      lines.push('  ref sync milestones:')

      for (const milestone of setupMilestones) {
        if (milestone.summaryLabel === 'sync-total') {
          continue
        }

        lines.push(`    ${milestone.label}: ${formatDuration(milestone.durationMs)}`)
      }
    }

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
      const vitestRunner = withDaggerExecCacheBuster(
        testRunner,
        options,
        `${packageRunContext.logPrefix}-test-vitest`,
      ).withExec([...matrixConsumerVitestCommand])
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
      const playwrightRunner = withDaggerExecCacheBuster(
        testRunner,
        options,
        `${packageRunContext.logPrefix}-test-playwright`,
      ).withExec([...matrixConsumerPlaywrightCommand])
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
    const typecheckRunner = withDaggerExecCacheBuster(
      testRunner,
      options,
      `${packageRunContext.logPrefix}-test-typecheck`,
    ).withExec([...matrixConsumerTypecheckCommand])
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