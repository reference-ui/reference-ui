/**
 * Shared test state management.
 * Tracks active runners, coordinates cleanup on failure.
 */

import type { Runner } from '../runner/runner.js'

const activeRunners: Runner[] = []

export function registerRunner(runner: Runner): void {
  activeRunners.push(runner)
}

export function getActiveRunners(): Runner[] {
  return [...activeRunners]
}

export async function cleanupAll(): Promise<void> {
  for (const runner of activeRunners) {
    await runner.cleanup()
  }
  activeRunners.length = 0
}
