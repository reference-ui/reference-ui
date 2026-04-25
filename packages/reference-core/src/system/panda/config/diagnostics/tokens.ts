import {
  CONFIG_DIAGNOSTIC_WARN_GLOBAL_KEY,
  getConfigFragmentSource,
  type ConfigCollision,
} from './types'

const CONFIG_DIAGNOSTIC_CACHE_KEY = '__refConfigDiagnosticWarnings'
const MAX_COLLISIONS_TO_PRINT = 10

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function valuesDiffer(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) !== JSON.stringify(right)
}

function hasDivergentOverlap(
  left: Record<string, unknown>,
  right: Record<string, unknown>
): boolean {
  for (const key of Object.keys(left)) {
    if (!(key in right)) continue

    const leftValue = left[key]
    const rightValue = right[key]

    if (isPlainObject(leftValue) && isPlainObject(rightValue)) {
      if (hasDivergentOverlap(leftValue, rightValue)) return true
      continue
    }

    if (valuesDiffer(leftValue, rightValue)) return true
  }

  return false
}

function hasOverlappingNamespace(
  left: Record<string, unknown>,
  right: Record<string, unknown>
): boolean {
  return Object.keys(left).some(key => key in right)
}

function collectCollisionPaths(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  path: string[] = [],
  collisions: Set<string> = new Set()
): Set<string> {
  for (const key of Object.keys(left)) {
    const leftValue = left[key]
    const rightValue = right[key]

    if (!isPlainObject(leftValue) || !isPlainObject(rightValue)) continue

    const nextPath = [...path, key]
    if (nextPath.length >= 2 && hasDivergentOverlap(leftValue, rightValue)) {
      collisions.add(nextPath.join('.'))
      continue
    }

    collectCollisionPaths(leftValue, rightValue, nextPath, collisions)
  }

  return collisions
}

function collectRepeatedNamespacePaths(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  path: string[] = [],
  collisions: Set<string> = new Set()
): Set<string> {
  for (const key of Object.keys(left)) {
    const leftValue = left[key]
    const rightValue = right[key]

    if (!isPlainObject(leftValue) || !isPlainObject(rightValue)) continue

    const nextPath = [...path, key]
    if (nextPath.length >= 2 && hasOverlappingNamespace(leftValue, rightValue)) {
      collisions.add(nextPath.join('.'))
      continue
    }

    collectRepeatedNamespacePaths(leftValue, rightValue, nextPath, collisions)
  }

  return collisions
}

function sourceLabel(value: unknown): string {
  return getConfigFragmentSource(value) ?? 'unknown source'
}

function isUserspaceFragment(value: unknown): boolean {
  const source = getConfigFragmentSource(value)
  return typeof source === 'string' && source !== 'upstream system fragment'
}

function findTokenCollisions(fragments: Record<string, unknown>[]): ConfigCollision[] {
  const collisionMap = new Map<string, Set<string>>()

  for (let index = 0; index < fragments.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < fragments.length; compareIndex += 1) {
      const left = fragments[index]
      const right = fragments[compareIndex]
      if (!left || !right) continue
      if (!isUserspaceFragment(left) || !isUserspaceFragment(right)) continue

      const paths = collectCollisionPaths(left, right)
      if (paths.size === 0) {
        collectRepeatedNamespacePaths(left, right).forEach(path => paths.add(path))
      }

      for (const path of paths) {
        const sources = collisionMap.get(path) ?? new Set<string>()
        sources.add(sourceLabel(left))
        sources.add(sourceLabel(right))
        collisionMap.set(path, sources)
      }
    }
  }

  return [...collisionMap.entries()]
    .map(([path, sources]) => ({ path, sources: [...sources].sort() }))
    .sort((a, b) => a.path.localeCompare(b.path))
}

function createTokenCollisionWarning(collisions: ConfigCollision[]): string {
  const shown = collisions.slice(0, MAX_COLLISIONS_TO_PRINT)
  const hiddenCount = collisions.length - shown.length
  const details = shown
    .map((collision, index) =>
      [
        `  ${index + 1}. ${collision.path}`,
        ...collision.sources.map(source => `     - ${source}`),
      ].join('\n')
    )
    .join('\n')
  const suffix = hiddenCount > 0 ? `\n  ... and ${hiddenCount} more` : ''

  return [
    '[tokens] Token namespace collisions detected.',
    'Reference UI deep-merges tokens, so later tokens() fragments may override earlier values.',
    '',
    'Colliding namespaces:',
    `${details}${suffix}`,
    '',
    'Consider keeping each colliding namespace in one file, or make the override intentional.',
  ].join('\n')
}

function warnOnce(message: string): void {
  const runtime = globalThis as typeof globalThis & Record<string, unknown>
  const cache =
    runtime[CONFIG_DIAGNOSTIC_CACHE_KEY] instanceof Set
      ? (runtime[CONFIG_DIAGNOSTIC_CACHE_KEY] as Set<string>)
      : new Set<string>()
  runtime[CONFIG_DIAGNOSTIC_CACHE_KEY] = cache

  if (cache.has(message)) return
  cache.add(message)
  const warn = runtime[CONFIG_DIAGNOSTIC_WARN_GLOBAL_KEY]
  if (typeof warn === 'function') {
    warn(message)
    return
  }

  const fallbackConsole = runtime.console
  if (
    fallbackConsole &&
    typeof fallbackConsole === 'object' &&
    typeof (fallbackConsole as { warn?: unknown }).warn === 'function'
  ) {
    ;(fallbackConsole as { warn: (message: string) => void }).warn(message)
  }
}

export function warnOnTokenCollisions(fragments: Record<string, unknown>[]): void {
  const collisions = findTokenCollisions(fragments)
  if (collisions.length === 0) return

  warnOnce(createTokenCollisionWarning(collisions))
}
