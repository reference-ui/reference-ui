/**
 * Tree's session: every ref and state cell the behavior hooks share —
 * expansion and focus state, the root node, the identity and branch
 * registries, the shared typeahead model, and the recovery cursors. It
 * also owns the duplicate-identity registry: item ids must stay unique
 * while mounted (TR-DOM-08). Behavior hooks take the session and add
 * decisions; nothing else owns tree state.
 */
import * as React from 'react'
import { TypeaheadModel } from '../../RovingFocus/typeahead'

export interface TreeSession {
  rootRef: React.MutableRefObject<HTMLDivElement | null>
  liveInstancesRef: React.MutableRefObject<Set<string>>
  branchesMapRef: React.MutableRefObject<Map<string, HTMLElement | null>>
  typeaheadModelRef: React.MutableRefObject<TypeaheadModel | null>
  prevVisibleValuesRef: React.MutableRefObject<string[]>
  lastExpansionSeqRef: React.MutableRefObject<number>
  expanded: string[]
  isControlledExpanded: boolean
  setInternalExpanded: React.Dispatch<React.SetStateAction<string[]>>
  focusedId: string | null
  setFocusedId: React.Dispatch<React.SetStateAction<string | null>>
  registerItemInstance: (id: string) => () => void
}

export function useTreeSession(
  expandedProp: string[] | undefined,
  defaultExpanded: string[]
): TreeSession {
  const isControlledExpanded = expandedProp !== undefined
  const [internalExpanded, setInternalExpanded] = React.useState<string[]>(defaultExpanded)
  const expanded = isControlledExpanded ? expandedProp : internalExpanded

  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  // Live identity registry for duplicate detection (TR-DOM-08)
  const liveInstancesRef = React.useRef<Set<string>>(new Set())
  const registerItemInstance = React.useCallback((id: string) => {
    if (liveInstancesRef.current.has(id)) {
      throw new Error(`Tree items must have unique values. Duplicate found: "${id}".`)
    }
    liveInstancesRef.current.add(id)
    return () => {
      liveInstancesRef.current.delete(id)
    }
  }, [])

  // Branch order tracking for deterministic expansion payloads (TR-EXPAND-06)
  const branchesMapRef = React.useRef<Map<string, HTMLElement | null>>(new Map())

  // Shared RovingFocus typeahead session over the visible set (TR-TYPE-04)
  const typeaheadModelRef = React.useRef<TypeaheadModel | null>(null)
  if (typeaheadModelRef.current === null) {
    typeaheadModelRef.current = new TypeaheadModel({ timeoutMs: 500 })
  }

  // Focus recovery when the focused item is removed (TR-DYNAMIC-03)
  const prevVisibleValuesRef = React.useRef<string[]>([])
  const lastExpansionSeqRef = React.useRef(0)

  return {
    rootRef,
    liveInstancesRef,
    branchesMapRef,
    typeaheadModelRef,
    prevVisibleValuesRef,
    lastExpansionSeqRef,
    expanded,
    isControlledExpanded,
    setInternalExpanded,
    focusedId,
    setFocusedId,
    registerItemInstance,
  }
}
