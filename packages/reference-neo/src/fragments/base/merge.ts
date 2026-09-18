// Deep merge plus token leaf paths for building the evaluated spec.
// It takes collected fragment objects and emits merged trees and provenance keys.
// Later fragments win on scalar conflicts while plain objects merge recursively.

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const proto = Object.getPrototypeOf(value) as unknown
  return proto === Object.prototype || proto === null
}

/**
 * Deep-merge override into base, returning a fresh tree. Plain objects merge
 * key by key; arrays and scalars on the override side replace wholesale.
 * Neither input is mutated, and neither output shares references with them.
 */
export function mergeFragmentObjects(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const existing = merged[key]
    if (isPlainObject(existing) && isPlainObject(value)) {
      merged[key] = mergeFragmentObjects(existing, value)
    } else if (isPlainObject(value)) {
      merged[key] = mergeFragmentObjects({}, value)
    } else {
      merged[key] = value
    }
  }
  return merged
}

const TOKEN_LEAF_KEYS = ['value', 'light', 'dark']

function isTokenLeaf(node: Record<string, unknown>): boolean {
  return TOKEN_LEAF_KEYS.some((key) => key in node)
}

function collectLeafPaths(node: Record<string, unknown>, prefix: string, out: string[]): void {
  if (isTokenLeaf(node)) {
    out.push(prefix)
    return
  }
  for (const [key, value] of Object.entries(node)) {
    if (!isPlainObject(value)) continue
    const path = prefix === '' ? key : `${prefix}.${key}`
    collectLeafPaths(value, path, out)
  }
}

/**
 * Dotted paths to token leaves for spec provenance. A node carrying a value,
 * light, or dark key is a leaf; anything else recurses into plain children.
 */
export function tokenLeafPaths(tokens: Record<string, unknown>): string[] {
  const paths: string[] = []
  for (const [key, value] of Object.entries(tokens)) {
    if (isPlainObject(value)) collectLeafPaths(value, key, paths)
  }
  return paths
}
