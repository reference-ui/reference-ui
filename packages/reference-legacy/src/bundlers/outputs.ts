/** Utilities for classifying generated `.reference-ui` output paths. */

import { resolve } from 'node:path'
import { GENERATED_OUTPUT_ROOTS } from '../constants'

export function resolveManagedOutputRoots(outDir: string): Set<string> {
  return new Set(GENERATED_OUTPUT_ROOTS.map(name => toNormalizedPath(resolve(outDir, name))))
}

export function isManagedOutputFile(file: string, managedOutputRoots: Set<string>): boolean {
  const normalizedFile = toNormalizedPath(file)
  for (const root of managedOutputRoots) {
    if (normalizedFile === root || normalizedFile.startsWith(`${root}/`)) {
      return true
    }
  }
  return false
}

export function toNormalizedPath(file: string): string {
  return file.replace(/\\/g, '/')
}