/**
 * Formatting and presentation helpers for matrix package execution.
 *
 * The package runner emits rich timing and failure output; keeping that shaping
 * logic here lets the orchestration flow stay close to the execution steps.
 */

import { formatDuration } from '../../../lib/log/index.js'
import type {
  MatrixPackagePhase,
  MatrixPackageRunContext,
  MatrixPackageRunResult,
  TimedMatrixPackagePhase,
} from './types.js'

export function readErrorOutput(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('utf8')
  }

  return ''
}

export function collectMatrixFailureDetails(error: unknown): string[] {
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

export function appendOutputBlock(lines: string[], output: string): void {
  const trimmed = output.trim()

  if (trimmed.length === 0) {
    return
  }

  lines.push('', trimmed)
}

export function logMatrixPackagePhase(
  packageRunContext: MatrixPackageRunContext,
  phase: MatrixPackagePhase,
  detail?: string,
): void {
  const suffix = detail ? ` ${detail}` : ''
  console.log(`- ${packageRunContext.displayName}: ${phase}${suffix}`)
}

export function formatRuntimeMemory(memoryBytes: number | null): string | null {
  if (memoryBytes === null) {
    return null
  }

  return `${(memoryBytes / (1024 ** 3)).toFixed(1)} GiB`
}

export function formatPhaseTimingSummary(
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

export function createAbortedMatrixPackageResult(
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