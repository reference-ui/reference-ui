import { join } from 'node:path'
import { toNormalizedPath } from '../bundlers/outputs'
import type { ReferenceProjectPaths } from '../bundlers/types'

const INTERNAL_OUTPUT_ROOTS = ['mcp', 'virtual'] as const

export function withManagedOutputIgnores(
  existingIgnored: unknown,
  projectPaths: ReferenceProjectPaths,
): (path: string) => boolean {
  const internalManagedRoots = new Set(
    INTERNAL_OUTPUT_ROOTS.map(root => toNormalizedPath(join(projectPaths.outDir, root)))
  )

  return (path: string): boolean => {
    if (isIgnoredByReference(path, internalManagedRoots)) {
      return true
    }

    return matchesExistingIgnore(existingIgnored, path)
  }
}

function isIgnoredByReference(
  path: string,
  managedRoots: Set<string>
): boolean {
  const normalizedPath = toNormalizedPath(path)

  for (const root of managedRoots) {
    if (normalizedPath === root || normalizedPath.startsWith(`${root}/`)) {
      return true
    }
  }

  return false
}

function matchesExistingIgnore(existingIgnored: unknown, path: string): boolean {
  if (typeof existingIgnored === 'function') {
    return existingIgnored(path)
  }

  if (existingIgnored instanceof RegExp) {
    return existingIgnored.test(path)
  }

  if (typeof existingIgnored === 'string') {
    return path.includes(existingIgnored)
  }

  if (Array.isArray(existingIgnored)) {
    return existingIgnored.some(entry => matchesExistingIgnore(entry, path))
  }

  return false
}