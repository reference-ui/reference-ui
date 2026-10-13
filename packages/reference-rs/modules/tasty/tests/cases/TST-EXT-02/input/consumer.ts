import type { tree } from './barrel'
import type { tree as relayedTree } from './relay'
import type { Leaf } from './barrel'

export interface UsesTree {
  leaf: tree.Leaf
}

export interface UsesRelayedTree {
  leaf: relayedTree.Leaf
}

export interface UsesFlatLeaf {
  flat: Leaf
}
