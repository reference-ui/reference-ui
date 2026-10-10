/**
 * Menu's private subtree scoping: the level value chaining root Menu
 * through every open submenu, and the radio-group value scoping choice
 * state to one group. Levels chain through context while the root owns
 * the submenu registry every level's open, close, and dismiss requests
 * consult. Nothing here renders — it only names the scopes the tree
 * coordinates through.
 */
import * as React from 'react'
import type { SubmenuIntentState } from './levels/intent-state'

// --- Menu level tree -------------------------------------------------------
// Root Menu adopts its Popover layer; each open nested Menu owns one child
// Overlay layer. Levels chain through context; the root owns the submenu
// registry that Escape, outside press, and item selection consult.

export interface SubmenuRegistration {
  id: string
  depth: number
  parentId: string
  isOpen: boolean
  getTrigger: () => HTMLElement | null
  getContent: () => HTMLDivElement | null
  requestClose: () => void
}

export interface MenuLevelValue {
  id: string
  depth: number
  isSubmenu: boolean
  isOpen: boolean
  contentId: string
  // Live node reads. Presence mounts Content a commit after open without
  // re-rendering Menu, so mirrored refs go stale; read at use time.
  getContentNode: () => HTMLDivElement | null
  getTrigger: () => HTMLElement | null
  parent: MenuLevelValue | null
  intent: SubmenuIntentState | null
  requestClose: () => void
  requestOpen: () => void
  requestDeepestClose: () => boolean
  requestTreeDismiss: () => void
  registerSubmenu: (reg: SubmenuRegistration) => () => void
  unwindForPress: (event: Event) => void
  registry: Map<string, SubmenuRegistration>
  /** Submenu levels reconcile authored Content ids through this. */
  setContentId: ((id: string) => void) | null
}

export const MenuLevelContext = React.createContext<MenuLevelValue | null>(null)

export function useMenuLevel() {
  return React.useContext(MenuLevelContext)
}

export interface MenuRadioGroupValue {
  value: string | null | undefined
  onChange: ((value: string) => void) | undefined
}

export const MenuRadioGroupContext = React.createContext<MenuRadioGroupValue | null>(null)
