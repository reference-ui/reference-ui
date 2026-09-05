import { existsSync, statSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

const GLOB_MAGIC = /[*?[\]{}()!]/

function normalizePattern(value: string): string {
  return value.replaceAll('\\', '/').replace(/^\.\/+/, '').replace(/^\/+/, '')
}

function extractStaticPrefix(pattern: string): string | undefined {
  const normalized = normalizePattern(pattern.trim())
  if (!normalized) {
    return undefined
  }

  const segments = normalized.split('/').filter(Boolean)
  const prefix: string[] = []

  for (const segment of segments) {
    if (GLOB_MAGIC.test(segment)) {
      break
    }
    prefix.push(segment)
  }

  return prefix.length > 0 ? prefix.join('/') : undefined
}

function coerceWatchableRoot(projectRoot: string, candidate: string): string {
  const absoluteCandidate = resolve(projectRoot, candidate)
  if (existsSync(absoluteCandidate) && statSync(absoluteCandidate).isFile()) {
    return dirname(absoluteCandidate)
  }
  return absoluteCandidate
}

export function isNestedOrEqual(parent: string, candidate: string): boolean {
  const rel = relative(parent, candidate)
  return !rel || (!rel.startsWith('..') && !isAbsolute(rel))
}

export function collapseNestedRoots(roots: string[]): string[] {
  const uniqueRoots = [...new Set(roots.map((r) => resolve(r)))].sort((a, b) => a.length - b.length)
  const collapsed: string[] = []

  for (const root of uniqueRoots) {
    if (!collapsed.some((existing) => isNestedOrEqual(existing, root))) {
      collapsed.push(root)
    }
  }

  return collapsed
}

export function deriveWatchRoots(
  projectRoot: string,
  include: string[],
  extraPaths: string[] = [],
): string[] {
  const resolvedProjectRoot = resolve(projectRoot)
  const prefixes = include.map(extractStaticPrefix)
  const isUnrooted = prefixes.length === 0 || prefixes.some((prefix) => prefix == null)

  const includeRoots = isUnrooted
    ? [resolvedProjectRoot]
    : prefixes.map((prefix) => coerceWatchableRoot(resolvedProjectRoot, prefix!))

  const extraRoots = extraPaths.map((extraPath) => coerceWatchableRoot(resolvedProjectRoot, extraPath))

  return collapseNestedRoots([...includeRoots, ...extraRoots])
}

