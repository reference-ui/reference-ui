// The one token-tree merge plus token leaf paths for building the evaluated spec.
// It takes collected fragment objects and emits merged trees and provenance keys.
// A token leaf replaces the earlier leaf whole, groups merge recursively, and
// upstream `_private` subtrees strip at merge time so the owning package keeps
// its internals while downstream extenders never see them.

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const proto = Object.getPrototypeOf(value) as unknown
  return proto === Object.prototype || proto === null
}

/**
 * Called when a token leaf replaces an earlier token leaf at `path`, a dotted
 * path. The merge only reports the replacement; the caller decides what it means.
 */
export type TokenReplaceHandler = (
  path: string,
  earlier: Record<string, unknown>,
  later: Record<string, unknown>
) => void

export const PRIVATE_TOKEN_KEY = '_private'

const TOKEN_LEAF_KEYS = ['value', 'light', 'dark']

// The engine's mode-leaf rule (base-system spec.rs): a value, light, or dark key makes a
// leaf, unless light or dark is itself an object. A group child named `light` or `dark`
// holds an object, so it stays a group.
function isTokenLeaf(node: Record<string, unknown>): boolean {
  return (
    TOKEN_LEAF_KEYS.some((key) => key in node) &&
    !isPlainObject(node.light) &&
    !isPlainObject(node.dark)
  )
}

// A fresh copy of a leaf or group, so a written node never shares objects with its source.
function cloneTree(node: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => [
      key,
      isPlainObject(value) ? cloneTree(value) : value,
    ])
  )
}

function childPath(prefix: string, key: string): string {
  return prefix === '' ? key : `${prefix}.${key}`
}

// A leaf or a group, by the engine's rule. Anything else is a scalar slot with no shape to merge into.
function isLeafNode(node: unknown): node is Record<string, unknown> {
  return isPlainObject(node) && isTokenLeaf(node)
}

function isGroupNode(node: unknown): node is Record<string, unknown> {
  return isPlainObject(node) && !isTokenLeaf(node)
}

// One later node over the earlier node at the same key: a leaf replaces whole, a group merges, a scalar wins.
function mergeNode(
  existing: unknown,
  value: unknown,
  onReplace: TokenReplaceHandler | undefined,
  path: string
): unknown {
  if (!isPlainObject(value)) return value
  if (isTokenLeaf(value)) {
    if (isLeafNode(existing)) onReplace?.(path, existing, value)
    return cloneTree(value)
  }
  const base = isGroupNode(existing) ? existing : {}
  return mergeTokenNodes(base, value, onReplace, path)
}

function mergeTokenNodes(
  earlier: Record<string, unknown>,
  later: Record<string, unknown>,
  onReplace: TokenReplaceHandler | undefined,
  prefix: string
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...earlier }
  for (const [key, value] of Object.entries(later)) {
    merged[key] = mergeNode(merged[key], value, onReplace, childPath(prefix, key))
  }
  return merged
}

/**
 * Merge a later token tree over an earlier one, returning a fresh tree (E14).
 * A node with a `value`, `light`, or `dark` key is a leaf and replaces the earlier
 * node whole, so a leaf drops any dark or light key it does not repeat, and a leaf
 * over a group drops the group's children. A group merges recursively, and over an
 * earlier leaf it starts from empty. Scalars and arrays replace wholesale. Neither
 * input is mutated. `onReplace` fires once for each leaf that replaces an earlier leaf.
 */
export function mergeTokenTree(
  earlier: Record<string, unknown>,
  later: Record<string, unknown>,
  onReplace?: TokenReplaceHandler
): Record<string, unknown> {
  return mergeTokenNodes(earlier, later, onReplace, '')
}

/**
 * Drop `_private` subtrees at any depth, returning a fresh tree. The key
 * falls off wherever it sits — nested under a category or as a top-level
 * category — while every sibling keeps its shape. Neither the input nor its
 * nested objects are mutated. Mirrors Rust `strip_private_tokens`.
 */
export function stripPrivateTokensDeep(node: Record<string, unknown>): Record<string, unknown> {
  const stripped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node)) {
    if (key === PRIVATE_TOKEN_KEY) continue
    stripped[key] = isPlainObject(value) ? stripPrivateTokensDeep(value) : value
  }
  return stripped
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
