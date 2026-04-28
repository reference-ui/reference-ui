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
  CONSUMER_DIR_IN_CONTAINER,
  REGISTRY_URL_IN_CONTAINER,
} from '../../../../config.js'
import { formatDuration } from '../../../lib/log/index.js'
import { createMatrixInstallCommand, hasWarmMatrixInstallCache, matrixInstallCacheKeyEnvVar } from '../node-modules/install.js'
import {
  externalPnpmStoreCacheKey,
  matrixNodeModulesCacheKey,
} from '../node-modules/cache.js'
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
  announceMatrixPackageStart,
  appendOutputBlock,
  collectMatrixFailureDetails,
  createAbortedMatrixPackageResult,
  formatMatrixPackageHeading,
} from './reporting.js'
import {
  createMatrixRefSyncWatchCommand,
  matrixRefSyncPhasesEnvVar,
  parseMatrixRefSyncWatchOutput,
  resolveMatrixRefSyncStrategy,
} from './ref-sync.js'
import type { MatrixRefSyncWatchPhaseCommand } from './ref-sync.js'
import type {
  MatrixPackageExecutionContext,
  MatrixPackageRunContext,
  MatrixPackageRunResult,
  MatrixRunOptions,
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
  const lines = [`\n${formatMatrixPackageHeading(packageRunContext)}`]
  let phase: 'install' | 'setup' | 'test' = 'install'

  announceMatrixPackageStart(packageRunContext)

  const internalTarballSpecs = resolveMatrixInternalTarballSpecs(
    packageRunContext.source.fixturePackageJson,
    executionContext.manifest.packages,
  )
  const refSyncStrategy = resolveMatrixRefSyncStrategy(packageRunContext.config)
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
      CONSUMER_DIR_IN_CONTAINER,
      matrixFixtureSourceDirectory(packageRunContext.workspacePackage.dir),
    )
    .withDirectory(
      CONSUMER_DIR_IN_CONTAINER,
      matrixGeneratedConsumerDirectory(generatedConsumerDir),
    )
    .withMountedCache(`${CONSUMER_DIR_IN_CONTAINER}/node_modules`, nodeModulesCache)
    .withWorkdir(CONSUMER_DIR_IN_CONTAINER)

  try {
    const installStageStartedAt = Date.now()
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
        `${packageRunContext.logPrefix}-install`,
      ).withExec(createMatrixInstallCommand(REGISTRY_URL_IN_CONTAINER))
      installOutput = await postInstallRunner.stdout()
    }

    await writeMatrixPackageStageLog(packageRunContext, 'install', installOutput)
    const installDuration = formatDuration(Date.now() - installStageStartedAt)

    if (warmInstallCache) {
      lines.push(`  Reused cached dependencies in ${installDuration}`)
    } else {
      lines.push(`  Installed dependencies in ${installDuration}`)
    }

    if (executionContext.shouldStop()) {
      return createAbortedMatrixPackageResult(lines, 'setup')
    }

    phase = 'setup'
    let testRunner = postInstallRunner

    if (refSyncStrategy.mode === 'full') {
      const setupRunner = withDaggerExecCacheBuster(
        postInstallRunner,
        `${packageRunContext.logPrefix}-setup`,
      ).withExec([...matrixConsumerSetupCommand])
      const setupOutput = await setupRunner.stdout()
      await writeMatrixPackageStageLog(packageRunContext, 'setup', setupOutput)
      lines.push('  Prepared full ref sync runtime output.')
      testRunner = setupRunner
    } else {
      const setupMessage = 'Deferred full ref sync completion; runtime tests will start ref sync --watch and wait only for runtime-ready output.'
      await writeMatrixPackageStageLog(packageRunContext, 'setup', `${setupMessage}\n`)
      lines.push(`  ${setupMessage}`)
    }

    if (executionContext.shouldStop()) {
      return createAbortedMatrixPackageResult(lines, 'tests')
    }

    phase = 'test'
    lines.push(refSyncStrategy.mode === 'watch-ready'
      ? '  Running tests against ref sync watch-ready output'
      : '  Running tests')
    const testLogOutputs: string[] = []

    if (refSyncStrategy.mode === 'watch-ready') {
      const watchPhases: MatrixRefSyncWatchPhaseCommand[] = []

      if (packageRunContext.source.hasVitestTests) {
        watchPhases.push({
          command: matrixConsumerVitestCommand,
          phase: 'test:vitest',
        })
      }

      if (packageRunContext.source.hasPlaywrightTests) {
        watchPhases.push({
          command: matrixConsumerPlaywrightCommand,
          phase: 'test:playwright',
        })
      }

      if (watchPhases.length > 0) {
        const watchRunner = withDaggerExecCacheBuster(
          testRunner,
          `${packageRunContext.logPrefix}-test-watch`,
        )
          .withEnvVariable(matrixRefSyncPhasesEnvVar, JSON.stringify(watchPhases))
          .withExec(createMatrixRefSyncWatchCommand())
        const sharedWatchOutput = await watchRunner.stdout()
        const parsedWatchOutput = parseMatrixRefSyncWatchOutput(sharedWatchOutput)

        if (parsedWatchOutput.readyDurationMs !== null) {
          lines.push('  Reached ref sync watch-ready output.')
        }

        appendOutputBlock(lines, parsedWatchOutput.cleanedOutput)

        if (parsedWatchOutput.cleanedOutput.length > 0) {
          testLogOutputs.push(parsedWatchOutput.cleanedOutput)
        }

        testRunner = watchRunner
      }
    } else {
      if (packageRunContext.source.hasVitestTests) {
        const vitestRunner = withDaggerExecCacheBuster(
          testRunner,
          `${packageRunContext.logPrefix}-test-vitest`,
        ).withExec([...matrixConsumerVitestCommand])
        const vitestOutput = await vitestRunner.stdout()
        testLogOutputs.push(vitestOutput)
        appendOutputBlock(lines, vitestOutput)
        testRunner = vitestRunner

        if (executionContext.shouldStop()) {
          return createAbortedMatrixPackageResult(
            lines,
            packageRunContext.source.hasPlaywrightTests
              ? 'test:playwright'
              : (refSyncStrategy.runTypecheck ? 'test:typecheck' : 'completion'),
          )
        }
      }

      if (packageRunContext.source.hasPlaywrightTests) {
        const playwrightRunner = withDaggerExecCacheBuster(
          testRunner,
          `${packageRunContext.logPrefix}-test-playwright`,
        ).withExec([...matrixConsumerPlaywrightCommand])
        const playwrightOutput = await playwrightRunner.stdout()
        testLogOutputs.push(playwrightOutput)
        appendOutputBlock(lines, playwrightOutput)
        testRunner = playwrightRunner

        if (executionContext.shouldStop()) {
          return createAbortedMatrixPackageResult(
            lines,
            refSyncStrategy.runTypecheck ? 'test:typecheck' : 'completion',
          )
        }
      }
    }

    if (refSyncStrategy.runTypecheck) {
      const typecheckRunner = withDaggerExecCacheBuster(
        testRunner,
        `${packageRunContext.logPrefix}-test-typecheck`,
      ).withExec([...matrixConsumerTypecheckCommand])
      const typecheckOutput = await typecheckRunner.stdout()
      testLogOutputs.push(typecheckOutput)
    }

    const testOutput = testLogOutputs.filter(output => output.length > 0).join('\n')
    await writeMatrixPackageStageLog(packageRunContext, 'test', testOutput)
    lines.push('', '  Completed.')

    return {
      failed: false,
      output: `${lines.join('\n')}\n`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await writeMatrixPackageStageLog(packageRunContext, phase, errorMessage)
    lines.push(`  Failed during ${phase}. See ${resolve(matrixLogDir, `${packageRunContext.logPrefix}-${phase}.log`)}`)
    lines.push(...collectMatrixFailureDetails(error))

    if (errorMessage.trim().length > 0) {
      lines.push(`  ${errorMessage}`)
    }

    return {
      failed: true,
      output: `${lines.join('\n')}\n`,
    }
  }
}