/**
 * Listbox's keyboard navigation: the standalone path walks the live DOM
 * (so dynamic reorders resolve at key time, LB-DYNAMIC-01) and the
 * virtual path walks logical items with disabled skipping and pending
 * coalescing (LB-VIRT-06). Target math lives in navigation/targets; this
 * hook owns container queries, preventDefault on handled keys, DOM focus
 * moves, and scrollToIndex for unmounted virtual targets.
 */
import * as React from 'react'
// Kernel seam (F2 #2): direction converges on RovingFocus.
import { getDirection } from '../../RovingFocus/RovingFocus'
import { resolveStandaloneTarget, resolveVirtualTarget } from '../navigation/targets'
import type { ListboxSession } from './use-listbox-session'
import type { ListboxOrientation, ListboxVirtualAdapter } from '../types'

export interface ListboxNavigation {
  navigateVirtual: (e: React.KeyboardEvent<HTMLElement>, currentIndex: number) => void
  navigateStandalone: (e: React.KeyboardEvent<HTMLElement>, currentEl: HTMLElement) => void
}

function isHandledNavigationKey(key: string, orientation: ListboxOrientation) {
  if (key === 'Home' || key === 'End') return true
  if (orientation === 'vertical') return key === 'ArrowDown' || key === 'ArrowUp'
  return key === 'ArrowLeft' || key === 'ArrowRight'
}

export function useListboxNavigation(
  session: ListboxSession,
  orientation: ListboxOrientation,
  virtual: ListboxVirtualAdapter | undefined
): ListboxNavigation {
  const { containerRef, optionsMapRef, setFocusedValue, setPendingVirtualIndex, pendingVirtualIndex } = session

  // Standalone live-DOM navigation (handles dynamic reorders LB-DYNAMIC-01)
  const navigateStandalone = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>, currentEl: HTMLElement) => {
      if (!containerRef.current) return
      const allOptionEls = Array.from(
        containerRef.current.querySelectorAll<HTMLDivElement>('[role="option"]:not([aria-disabled="true"])')
      )
      if (allOptionEls.length === 0) return

      const currentIndex = allOptionEls.indexOf(currentEl as HTMLDivElement)
      if (currentIndex === -1) return

      const isRtl = getDirection(containerRef.current) === 'rtl'
      if (isHandledNavigationKey(e.key, orientation)) {
        e.preventDefault()
        e.stopPropagation()
      }
      const targetIndex = resolveStandaloneTarget(
        allOptionEls.length,
        currentIndex,
        e.key,
        orientation,
        isRtl
      )

      if (targetIndex !== currentIndex && allOptionEls[targetIndex]) {
        const targetEl = allOptionEls[targetIndex]
        const val = targetEl.getAttribute('data-value')
        setFocusedValue(val)
        targetEl.focus()
      }
    },
    [orientation]
  )

  // Virtual Navigation (handles coalescing LB-VIRT-06)
  const navigateVirtual = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>, currentIndex: number) => {
      if (!virtual) return
      const items = virtual.items
      if (items.length === 0) return

      const isRtl = getDirection(containerRef.current) === 'rtl'
      // Coalesce rapid navigation from pending target
      const effectiveIndex = pendingVirtualIndex ?? currentIndex
      if (isHandledNavigationKey(e.key, orientation)) {
        e.preventDefault()
        e.stopPropagation()
      }
      const targetIndex = resolveVirtualTarget(items, effectiveIndex, e.key, orientation, isRtl)

      if (targetIndex !== effectiveIndex) {
        setFocusedValue(items[targetIndex].value)
        const mounted = optionsMapRef.current.get(items[targetIndex].value)
        if (mounted?.ref.current && mounted.ref.current.isConnected) {
          setPendingVirtualIndex(null)
          mounted.ref.current.focus()
        } else {
          setPendingVirtualIndex(targetIndex)
          virtual.scrollToIndex(targetIndex)
        }
      }
    },
    [virtual, orientation, pendingVirtualIndex]
  )

  return { navigateVirtual, navigateStandalone }
}
