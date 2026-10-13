// Portable fragment bundle assembly for the published base system.
// It takes named fragment nodes, upstream first and own last, and emits the linearized
// node list (each name at its first occurrence) plus the one concatenated bundle string
// the legacy `fragment` field carries. A legacy entry with only `fragment` reads as one
// opaque node named after its system. Callers project the inputs at the call.

import type { BaseSystem, FragmentNode } from './types.ts'

export function createPortableFragmentBundle(
  upstream: string[],
  local: string[]
): string {
  return [...upstream, ...local]
    .map(bundle => `;${bundle}`)
    .join('\n')
}

/** The fragment nodes one system publishes; a legacy entry is one opaque node named after it (E15). */
export function fragmentNodesOf(system: BaseSystem): FragmentNode[] {
  if (Array.isArray(system.fragments) && system.fragments.length > 0) return system.fragments
  if (typeof system.fragment === 'string' && system.fragment.trim().length > 0) {
    return [{ name: system.name, bundle: system.fragment }]
  }
  return []
}

/** Concatenates node lists in declared order and keeps each name at its first occurrence (E1, E2). */
export function linearizeFragmentNodes(lists: readonly (readonly FragmentNode[])[]): FragmentNode[] {
  const seen = new Set<string>()
  const nodes: FragmentNode[] = []
  for (const list of lists) {
    for (const node of list) {
      if (seen.has(node.name)) continue
      seen.add(node.name)
      nodes.push(node)
    }
  }
  return nodes
}

/**
 * The node list a system publishes: its linearized upstream, then its own node
 * built from its local bundles. The own node stays last even when it is empty.
 */
export function publishedFragmentNodes(
  upstream: readonly FragmentNode[],
  ownName: string,
  localBundles: string[]
): FragmentNode[] {
  return linearizeFragmentNodes([upstream, [{ name: ownName, bundle: createPortableFragmentBundle([], localBundles) }]])
}

/** The single concatenated bundle the legacy `fragment` field carries for a node list. */
export function portableFragmentOf(nodes: readonly FragmentNode[]): string {
  return createPortableFragmentBundle(nodes.map(node => node.bundle), [])
}
