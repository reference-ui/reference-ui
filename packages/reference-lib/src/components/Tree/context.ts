/**
 * Tree's private subtree scopes: the root scope items read for selection,
 * expansion, focus, and keyboard commands; the item scope groups and
 * expanders read for identity, branch state, and level; and the level
 * counter groups increment for nesting depth. Value shapes live in
 * types.ts; parts and hooks provide and consume these three contexts.
 */
import * as React from 'react'
import type { TreeContextValue, TreeItemContextValue } from './types'

export const TreeContext = React.createContext<TreeContextValue | null>(null)
export const TreeItemContext = React.createContext<TreeItemContextValue | null>(null)
export const TreeLevelContext = React.createContext<number>(1)
