import { existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

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

  if (prefix.length === 0) {
    return undefined
  }

  return prefix.join('/')
}

function coerceWatchableRoot(projectRoot: string, candidate: string): string {
  const absoluteCandidate = resolve(projectRoot, candidate)
  if (existsSync(absoluteCandidate) && statSync(absoluteCandidate).isFile()) {
    return dirname(absoluteCandidate)
  }
  return absoluteCandidate
}

function collapseNestedRoots(roots: string[]): string[] {
  const sortedRoots = [...new Set(roots)].sort((a, b) => a.length - b.length)
  const collapsed: string[] = []

  for (const root of sortedRoots) {
    const normalizedRoot = root.endsWith('/') ? root : `${root}/`
    if (collapsed.some((existing) => normalizedRoot.startsWith(existing.endsWith('/') ? existing : `${existing}/`))) {
      continue
    }
    collapsed.push(root)
  }

  return collapsed
}

export function deriveWatchRoots(projectRoot: string, include: string[]): string[] {
  const resolvedProjectRoot = resolve(projectRoot)
  const prefixes = include.map(extractStaticPrefix)
  if (prefixes.length === 0 || prefixes.some((prefix) => prefix == null)) {
    return [resolvedProjectRoot]
  }

  return collapseNestedRoots(prefixes.map((prefix) => coerceWatchableRoot(resolvedProjectRoot, prefix!)))
}
