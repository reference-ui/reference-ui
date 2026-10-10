/**
 * Menubar's private subtree scoping: the bar value one trigger registry
 * shares, and the per-menu identity each Trigger/Content pair resolves.
 * The root provides both; parts consume them. Nothing here renders — it
 * only names the scope the compound parts coordinate through.
 */
import * as React from 'react'
import type { MenubarValue } from './types'

export interface MenubarTriggerRegistration {
  menuValue: string
  disabled: boolean
  getNode: () => HTMLElement | null
}

export interface MenubarContextValue {
  value: MenubarValue
  requestValue: (next: MenubarValue) => void
  requestAdjacent: (fromValue: string, direction: 1 | -1) => void
  registerTrigger: (reg: MenubarTriggerRegistration) => () => void
  /** Live menubar root node. Direction reads run against it: contents portal
   * to body and would miss an ancestral `dir`. */
  getRootNode: () => HTMLDivElement | null
}

export const MenubarContext = React.createContext<MenubarContextValue | null>(null)

export interface MenubarMenuContextValue {
  menuValue: string
}

export const MenubarMenuContext = React.createContext<MenubarMenuContextValue | null>(null)
