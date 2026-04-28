/**
 * Formatting and presentation helpers for matrix package execution.
 *
 * The runner should tell one clear story in the console: which environment is
 * being prepared, what happened inside it, and where failures live.
 */

import pc from 'picocolors'
import type { MatrixPackageRunContext, MatrixPackageRunResult } from './types.js'

export function normalizeCapturedOutput(output: string): string {
  const lines = output
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')

  const normalizedLines: string[] = []
  let previousWasBlank = false

  for (const line of lines) {
    const normalizedLine = line.replace(/\u001B\[[0-9;]*G/g, '').replace(/\s+$/g, '')
    const isBlank = normalizedLine.trim().length === 0

    if (isBlank) {
      if (!previousWasBlank) {
        normalizedLines.push('')
      }

      previousWasBlank = true
      continue
    }

    normalizedLines.push(normalizedLine)
    previousWasBlank = false
  }

  return normalizedLines.join('\n').trim()
}

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
    sections.push(`  matrix stdout:\n${normalizeCapturedOutput(stdout)}`)
  }

  if (stderr.length > 0) {
    sections.push(`  matrix stderr:\n${normalizeCapturedOutput(stderr)}`)
  }

  return sections
}

export function appendOutputBlock(lines: string[], output: string): void {
  const trimmed = normalizeCapturedOutput(output)

  if (trimmed.length === 0) {
    return
  }

  lines.push('', trimmed)
}

export function describeMatrixEnvironment(packageRunContext: MatrixPackageRunContext): string {
  const syncLabel = packageRunContext.config.refSync.mode === 'watch-ready' ? 'watch-ready' : 'full-sync'

  return [packageRunContext.config.react, ...packageRunContext.config.bundlers, syncLabel].join(' + ')
}

export function announceMatrixPackageStart(packageRunContext: MatrixPackageRunContext): void {
  console.log(
    `${pc.cyan('◐')} ${pc.bold(packageRunContext.displayName)} ${pc.dim('setting up env')} ${pc.cyan(`(${describeMatrixEnvironment(packageRunContext)})`)}`,
  )
}

export function formatMatrixPackageHeading(packageRunContext: MatrixPackageRunContext): string {
  return `${pc.bold(packageRunContext.displayName)} ${pc.dim(`(${describeMatrixEnvironment(packageRunContext)})`)}`
}

export function formatRuntimeMemory(memoryBytes: number | null): string | null {
  if (memoryBytes === null) {
    return null
  }

  return `${(memoryBytes / (1024 ** 3)).toFixed(1)} GiB`
}

export function createAbortedMatrixPackageResult(
  lines: string[],
  stageLabel: string,
): MatrixPackageRunResult {
  lines.push(`  Aborted before ${stageLabel} after another matrix package failed.`)

  return {
    failed: false,
    output: `${lines.join('\n')}\n`,
  }
}