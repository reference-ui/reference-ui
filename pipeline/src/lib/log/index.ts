import type { Ora } from 'ora'
import ora from 'ora'
import pc from 'picocolors'

function stepText(message: string): string {
  return pc.bold(pc.blue(message))
}

function successText(message: string): string {
  return pc.bold(pc.cyan(message))
}

function failureText(message: string): string {
  return pc.bold(pc.red(message))
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1_000) {
    return `${milliseconds}ms`
  }

  return `${(milliseconds / 1_000).toFixed(1)}s`
}

export function startStep(message: string): Ora {
  return ora({
    color: 'blue',
    discardStdin: false,
    spinner: 'dots12',
    text: stepText(message),
  }).start()
}

export function finishStep(step: Ora, message: string): void {
  step.succeed(successText(message))
}

export function failStep(step: Ora, message: string): void {
  step.fail(failureText(message))
}

export function logSkip(message: string): void {
  console.log(`${pc.blue('↷')} ${pc.dim(message)}`)
}

export function writeFailureOutput(output: string, label: string): void {
  const trimmedOutput = output.trim()
  if (trimmedOutput.length === 0) {
    return
  }

  process.stderr.write(`\n${pc.bold(pc.red(label))}:\n${trimmedOutput}\n`)
}