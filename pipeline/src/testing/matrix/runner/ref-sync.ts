/**
 * Matrix ref sync strategy helpers.
 *
 * This module owns the stable contract between the matrix runner and the
 * staged ref sync support scripts that execute inside generated consumers.
 */

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { MatrixPackageConfig, MatrixRefSyncMode } from '../discovery/index.js'

export interface MatrixRefSyncStrategy {
  mode: MatrixRefSyncMode
  runTypecheck: boolean
}

export type MatrixRefSyncWatchPhase = 'test:vitest' | 'test:playwright'

export interface MatrixRefSyncWatchPhaseCommand {
  command: readonly string[]
  phase: MatrixRefSyncWatchPhase
}

export interface ParsedMatrixRefSyncWatchOutput {
  cleanedOutput: string
  phaseDurations: Partial<Record<MatrixRefSyncWatchPhase, number>>
  readyDurationMs: number | null
}

export interface MatrixRefSyncSupportScript {
  outputRelativePath: string
  sourceFilePath: string
}

export const matrixRefSyncSupportDirectory = '.matrix-support/ref-sync'
export const matrixRefSyncPhasesEnvVar = 'REFERENCE_UI_MATRIX_REF_SYNC_PHASES_JSON'
export const matrixRefSyncWaitReadyScriptRelativePath = `${matrixRefSyncSupportDirectory}/wait-ready.mjs`
export const matrixRefSyncWatchSessionScriptRelativePath = `${matrixRefSyncSupportDirectory}/run-watch-session.mjs`

const matrixRefSyncReadyDurationPattern = /^\[matrix ref sync\] ready-duration-ms=(\d+)$/
const matrixRefSyncPhaseDurationPattern = /^\[matrix ref sync\] phase=(test:vitest|test:playwright) duration-ms=(\d+)$/
const matrixRefSyncSourceDirectory = resolve(dirname(fileURLToPath(import.meta.url)), 'ref-sync-support')

export const matrixRefSyncSupportScripts: readonly MatrixRefSyncSupportScript[] = [
  {
    outputRelativePath: matrixRefSyncWaitReadyScriptRelativePath,
    sourceFilePath: resolve(matrixRefSyncSourceDirectory, 'wait-ready.mjs'),
  },
  {
    outputRelativePath: matrixRefSyncWatchSessionScriptRelativePath,
    sourceFilePath: resolve(matrixRefSyncSourceDirectory, 'run-watch-session.mjs'),
  },
] as const

export function resolveMatrixRefSyncStrategy(
  config: Pick<MatrixPackageConfig, 'refSync' | 'runTypecheck'>,
): MatrixRefSyncStrategy {
  return {
    mode: config.refSync.mode,
    runTypecheck: config.runTypecheck,
  }
}

export function createMatrixRefSyncWatchCommand(): string[] {
  return ['node', matrixRefSyncWatchSessionScriptRelativePath]
}

export function parseMatrixRefSyncWatchOutput(output: string): ParsedMatrixRefSyncWatchOutput {
  const cleanedLines: string[] = []
  const phaseDurations: Partial<Record<MatrixRefSyncWatchPhase, number>> = {}
  let readyDurationMs: number | null = null

  for (const rawLine of output.split(/\r?\n/)) {
    const trimmedLine = rawLine.trim()
    const readyMatch = trimmedLine.match(matrixRefSyncReadyDurationPattern)

    if (readyMatch) {
      readyDurationMs = Number.parseInt(readyMatch[1], 10)
      continue
    }

    const phaseMatch = trimmedLine.match(matrixRefSyncPhaseDurationPattern)

    if (phaseMatch) {
      phaseDurations[phaseMatch[1] as MatrixRefSyncWatchPhase] = Number.parseInt(phaseMatch[2], 10)
      continue
    }

    cleanedLines.push(rawLine)
  }

  return {
    cleanedOutput: cleanedLines.join('\n').trim(),
    phaseDurations,
    readyDurationMs,
  }
}