/**
 * Filesystem probes for matrix fixture test coverage.
 *
 * Takes a package directory and reports whether it holds Playwright (tests/e2e)
 * or Vitest test files, so the runner can pick the right container image and skip
 * empty phases. Empty directories count as no coverage.
 */
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

function directoryHasFiles(dir: string): boolean {
  if (!existsSync(dir)) {
    return false
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = resolve(dir, entry.name)

    if (entry.isFile()) {
      return true
    }

    if (entry.isDirectory() && directoryHasFiles(entryPath)) {
      return true
    }
  }

  return false
}

export function hasMatrixPlaywrightTests(packageDir: string): boolean {
  return directoryHasFiles(resolve(packageDir, 'tests', 'e2e'))
}

export function hasMatrixVitestTests(packageDir: string): boolean {
  return directoryHasFiles(resolve(packageDir, 'tests', 'unit'))
}