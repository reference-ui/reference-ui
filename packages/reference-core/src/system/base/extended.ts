// The extends closure as system names: the composed systems whose tokens a system's vocabulary carries.
// It takes the fragment nodes an extends evaluation runs and the composed system names its streams list,
// and emits the names found in both, in system order, with the system itself left out. A layered system
// publishes streams but no fragment node, and an extendSystem override node (`extend:<base>`) names no
// system, so neither appears. Sync sends the list to the engine as `extendedSystems`, whose token layer
// then claims those systems' [data-layer] stamps, and extendSystem rebuilds it for an override block.

import type { BaseSystem, FragmentNode } from './types.ts'

/** The names in `systems` that a fragment node also names, in `systems` order, `self` and repeats left out. */
export function extendedSystemNames(
  nodes: readonly FragmentNode[],
  systems: readonly string[],
  self: string
): string[] {
  const evaluated = new Set(nodes.map((node) => node.name))
  return [...new Set(systems)].filter((name) => name !== self && evaluated.has(name))
}

/** The systems a published base system extends, read from what it published: its fragment nodes and streams. */
export function extendedSystemsOf(system: BaseSystem): string[] {
  const systems = (system.streams ?? []).map((stream) => stream.name)
  return extendedSystemNames(system.fragments ?? [], systems, system.name)
}
