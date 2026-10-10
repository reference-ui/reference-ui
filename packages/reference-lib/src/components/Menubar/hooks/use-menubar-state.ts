/**
 * Menubar's bar state: controlled value requests, DOM-ordered trigger
 * registry, and adjacent-menu moves. Takes the controlled value pair plus
 * loop, returns the context value the root provides and the live root
 * node ref direction reads run against. Ordering reads live node
 * positions so authored order never disagrees with the row on screen.
 */
import * as React from 'react'
import type { MenubarContextValue, MenubarTriggerRegistration } from '../context'
import type { MenubarValue } from '../types'
import { adjacentMenubarValue } from '../nav/menubar-nav'
import { devWarn } from '../shared/warn'

export function useMenubarState({ value, onChange, loop }: {
  value: MenubarValue
  onChange: (value: MenubarValue) => void
  loop: boolean
}): { contextValue: MenubarContextValue; rootNodeRef: React.RefObject<HTMLDivElement | null> } {

  const valueRef = React.useRef(value)
  valueRef.current = value
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange
  const loopRef = React.useRef(loop)
  loopRef.current = loop

  const requestValue = React.useCallback((next: MenubarValue) => {
    if (next === valueRef.current) return
    onChangeRef.current(next)
  }, [])

  const requestValueRef = React.useRef(requestValue)
  requestValueRef.current = requestValue

  const registryRef = React.useRef(new Map<string, MenubarTriggerRegistration>())

  const registerTrigger = React.useCallback((reg: MenubarTriggerRegistration) => {
    const registry = registryRef.current
    if (registry.has(reg.menuValue)) {
      devWarn(
        `Menubar: duplicate menu value "${reg.menuValue}". Menu values must be unique; only one menu can be open.`
      )
    }
    registry.set(reg.menuValue, reg)
    return () => {
      if (registry.get(reg.menuValue) === reg) registry.delete(reg.menuValue)
    }
  }, [])

  // DOM-ordered enabled values. Triggers register by menu value; order reads
  // live node positions (RovingFocus getOrderedItems precedent) so authored
  // order never disagrees with the row on screen.
  const orderedEnabledValues = React.useCallback((): string[] => {
    const entries = [...registryRef.current.values()].filter(reg => {
      if (reg.disabled) return false
      const node = reg.getNode()
      return node !== null && node.isConnected
    })
    entries.sort((a, b) => {
      const elA = a.getNode()
      const elB = b.getNode()
      if (!elA || !elB) return 0
      const pos = elA.compareDocumentPosition(elB)
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
      return 0
    })
    return entries.map(reg => reg.menuValue)
  }, [])

  const requestAdjacent = React.useCallback(
    (fromValue: string, direction: 1 | -1) => {
      const next = adjacentMenubarValue(
        orderedEnabledValues(),
        fromValue,
        direction,
        loopRef.current
      )
      if (next !== null && next !== fromValue) requestValueRef.current(next)
    },
    [orderedEnabledValues]
  )

  const rootNodeRef = React.useRef<HTMLDivElement | null>(null)
  const getRootNode = React.useCallback(() => rootNodeRef.current, [])

  const contextValue = React.useMemo<MenubarContextValue>(
    () => ({ value, requestValue, requestAdjacent, registerTrigger, getRootNode }),
    [value, requestValue, requestAdjacent, registerTrigger, getRootNode]
  )
  return { contextValue, rootNodeRef }
}
