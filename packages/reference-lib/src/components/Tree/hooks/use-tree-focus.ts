/**
 * Tree's focus lifecycle: the initial tab stop (selection when visible,
 * else the first enabled item), top-level sibling metadata with child
 * observation (TR-DOM-05), and recovery when the focused item unmounts
 * (TR-DYNAMIC-03). Recovery is standalone-only — inside Combobox the
 * source keeps DOM focus and virtual active follows the registry
 * (TR-CB-05). Effects keep their original order: ensure, metadata,
 * recover.
 */
import * as React from 'react'
import type { ComboboxContextValue } from '../../Combobox/combobox-context'
import { updateContainerTreeitemPositions } from '../siblings/positions'
import type { TreeSession } from './use-tree-session'

export function useTreeFocus(
  session: TreeSession,
  combobox: ComboboxContextValue | null,
  effectiveValue: string | null | undefined
) {
  const { rootRef, focusedId, setFocusedId, expanded, prevVisibleValuesRef } = session

  // Ensure initial or recovered roving focus tab stop (tabIndex=0)
  React.useEffect(() => {
    const rootEl = rootRef.current
    if (!rootEl) return

    const visibleItems = Array.from(
      rootEl.querySelectorAll<HTMLElement>('[role="treeitem"]:not([aria-disabled="true"])')
    )
    if (visibleItems.length === 0) return

    if (!focusedId || !visibleItems.some((el) => el.id === focusedId)) {
      const selectedEl = effectiveValue
        ? visibleItems.find((el) => el.id === effectiveValue)
        : null
      const target = selectedEl ?? visibleItems[0]
      if (target) {
        setFocusedId(target.id)
      }
    }
  }, [focusedId, effectiveValue, expanded])

  // Top-level sibling set metadata (TR-DOM-05)
  React.useLayoutEffect(() => {
    const container = rootRef.current
    if (!container) return
    updateContainerTreeitemPositions(container)
    const observer = new MutationObserver(() => {
      updateContainerTreeitemPositions(container)
    })
    observer.observe(container, { childList: true })
    return () => observer.disconnect()
  }, [])

  // Focus recovery when the focused item is removed (TR-DYNAMIC-03)
  React.useLayoutEffect(() => {
    const rootEl = rootRef.current
    if (!rootEl) return

    const visibleItems = Array.from(
      rootEl.querySelectorAll<HTMLElement>('[role="treeitem"]:not([aria-disabled="true"])')
    )
    const currentValues = visibleItems.map((el) => el.id)

    // Standalone only — inside Combobox the source keeps DOM focus and
    // virtual active follows the registry (TR-CB-05), never DOM recovery.
    if (!combobox && focusedId !== null && !currentValues.includes(focusedId)) {
      const oldIndex = prevVisibleValuesRef.current.indexOf(focusedId)
      let candidate: HTMLElement | null = null

      if (visibleItems.length > 0) {
        if (oldIndex !== -1 && oldIndex < visibleItems.length) {
          candidate = visibleItems[oldIndex]
        } else {
          candidate = visibleItems[visibleItems.length - 1]
        }
      }

      if (candidate) {
        setFocusedId(candidate.id)
        candidate.focus()
      } else {
        setFocusedId(null)
        rootEl.setAttribute('tabindex', '-1')
        rootEl.focus()
      }
    }

    prevVisibleValuesRef.current = currentValues
  })
}
