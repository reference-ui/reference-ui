/**
 * Tree's expansion authority: branch-order registration over live DOM
 * order, the toggle/setter/batch emitters routing through the controlled
 * expanded/onExpandedChange path exactly once, and the Combobox bridge
 * that turns sequenced horizontal-key requests into hierarchy commands
 * (TR-CB-02). Collapsing a branch first rescues descendant focus to the
 * branch (standalone only). Payload order comes from the deterministic
 * emission module; this hook owns state and requests.
 */
import * as React from 'react'
import type { ComboboxContextValue } from '../../Combobox/combobox-context'
import { getBatchExpanded, getDeterministicExpanded } from '../expansion/deterministic'
import type { TreeSession } from './use-tree-session'

export interface TreeExpansion {
  isItemExpanded: (id: string) => boolean
  toggleExpanded: (id: string) => void
  expandItems: (ids: string[]) => void
  registerBranchOrder: (id: string, el: HTMLElement | null) => () => void
}

export function useTreeExpansion(
  session: TreeSession,
  combobox: ComboboxContextValue | null,
  onExpandedChange: ((expanded: string[]) => void) | undefined
): TreeExpansion {
  const { branchesMapRef, expanded, isControlledExpanded, setInternalExpanded, focusedId, setFocusedId, rootRef, lastExpansionSeqRef, bumpRegistry } = session

  // Branch registration bumps the registry version too: the unmatched-id
  // diagnostics decide on the branch set, not only on the item set.
  const registerBranchOrder = React.useCallback((id: string, el: HTMLElement | null) => {
    branchesMapRef.current.set(id, el)
    bumpRegistry()
    return () => {
      branchesMapRef.current.delete(id)
      bumpRegistry()
    }
  }, [bumpRegistry])

  const isItemExpanded = React.useCallback(
    (id: string) => expanded.includes(id),
    [expanded]
  )

  // Live branches in current document order for deterministic payloads
  const getOrderedBranches = React.useCallback(() => {
    return Array.from(branchesMapRef.current.entries())
      .filter(([, el]) => el && el.isConnected)
      .sort(([, a], [, b]) => {
        const pos = a!.compareDocumentPosition(b!)
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
        return 0
      })
      .map(([val]) => val)
  }, [])

  const toggleExpanded = React.useCallback(
    (id: string) => {
      const isCurrentlyExpanded = expanded.includes(id)
      // If about to collapse id and currently focused item is a descendant, move focus to branch first
      // (standalone only — inside Combobox the source keeps DOM focus and virtual active follows).
      if (isCurrentlyExpanded && !combobox) {
        const rootEl = rootRef.current
        if (rootEl && focusedId && focusedId !== id) {
          const branchEl = rootEl.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`)
          const focusedEl = rootEl.querySelector<HTMLElement>(`[id="${CSS.escape(focusedId)}"]`)
          if (branchEl && focusedEl && branchEl.contains(focusedEl)) {
            setFocusedId(id)
            branchEl.focus()
          }
        }
      }

      const next = getDeterministicExpanded(expanded, id, getOrderedBranches(), !isCurrentlyExpanded)
      if (!isControlledExpanded) {
        setInternalExpanded(next)
      }
      onExpandedChange?.(next)
    },
    [expanded, isControlledExpanded, onExpandedChange, focusedId, getOrderedBranches, combobox]
  )

  // Explicit expansion setter for Combobox bridge requests (TR-CB-02):
  // routes through the controlled expanded/onExpandedChange path exactly
  // once, and stays silent when already in the requested state.
  const setBranchExpanded = React.useCallback(
    (id: string, expand: boolean) => {
      const isCurrentlyExpanded = expanded.includes(id)
      if (isCurrentlyExpanded === expand) {
        return false
      }
      const next = getDeterministicExpanded(expanded, id, getOrderedBranches(), expand)
      if (!isControlledExpanded) {
        setInternalExpanded(next)
      }
      onExpandedChange?.(next)
      return true
    },
    [expanded, isControlledExpanded, onExpandedChange, getOrderedBranches]
  )

  // Combobox bridge consumption (TR-CB-02): sequenced horizontal-key
  // requests become Tree hierarchy commands. Unknown/leaf values are
  // ignored; a redundant expand enters the first enabled child and a
  // redundant collapse moves to the parent (TR-KEY-04/05 parity under
  // virtual focus — navigation, never emissions).
  const expansionRequest = combobox?.treeExpansionRequest ?? null
  React.useEffect(() => {
    if (!combobox || !expansionRequest) return
    if (expansionRequest.seq === lastExpansionSeqRef.current) return
    lastExpansionSeqRef.current = expansionRequest.seq
    const reqValue = expansionRequest.value
    const expand = expansionRequest.expand
    if (!getOrderedBranches().includes(reqValue)) {
      return
    }
    const isCurrentlyExpanded = expanded.includes(reqValue)
    if (expand && !isCurrentlyExpanded) {
      setBranchExpanded(reqValue, true)
      return
    }
    if (!expand && isCurrentlyExpanded) {
      setBranchExpanded(reqValue, false)
      return
    }
    const rootEl = rootRef.current
    if (!rootEl) return
    const branchEl = rootEl.querySelector<HTMLElement>(`[id="${CSS.escape(reqValue)}"]`)
    if (!branchEl) return
    if (expand) {
      const group = branchEl.querySelector(':scope > [role="group"]')
      const firstChild = group?.querySelector<HTMLElement>(
        ':scope > [role="treeitem"]:not([aria-disabled="true"])'
      )
      if (firstChild) {
        combobox.setActiveValue(firstChild.id, 'keyboard')
      }
    } else {
      const parentGroup = branchEl.parentElement?.closest('[role="group"]')
      const parentItem = parentGroup?.closest<HTMLElement>('[role="treeitem"]')
      if (parentItem && rootEl.contains(parentItem)) {
        combobox.setActiveValue(parentItem.id, 'keyboard')
      }
    }
  }, [combobox, expansionRequest, expanded, getOrderedBranches, setBranchExpanded])

  // Batch expansion: one deterministic emission for a whole sibling
  // set. Callers skip the call when there is nothing new to expand, so a
  // no-op asterisk never emits a redundant onExpandedChange.
  const expandItems = React.useCallback(
    (ids: string[]) => {
      const next = getBatchExpanded(expanded, ids, getOrderedBranches())
      if (!isControlledExpanded) {
        setInternalExpanded(next)
      }
      onExpandedChange?.(next)
    },
    [expanded, isControlledExpanded, onExpandedChange, getOrderedBranches]
  )

  return { isItemExpanded, toggleExpanded, expandItems, registerBranchOrder }
}
