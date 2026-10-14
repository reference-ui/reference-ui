/**
 * Tree's session: every ref and state cell the behavior hooks share —
 * expansion and focus state, the root node, the identity and branch
 * registries, the shared typeahead model, and the recovery cursors. It
 * also owns the duplicate-identity registry: item ids must stay unique
 * while mounted (TR-DOM-08), and the registry version that tells the
 * unmatched-id diagnostics when the registries changed. Behavior hooks
 * take the session and add decisions; nothing else owns tree state.
 */
import * as React from 'react'
import { TypeaheadModel } from '../../RovingFocus/typeahead'
import { treeDiagnosticsEnabled } from '../shared/diagnostic'

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
  registryVersion: number
  bumpRegistry: () => void
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

  // Registry version: every item or branch registration change bumps it, so
  // the unmatched-id diagnostics re-run when a child registers without the
  // root re-rendering (a Group's own state can mount items). Dev-only:
  // production never reads it, so it never costs a render.
  const [registryVersion, setRegistryVersion] = React.useState(0)
  const bumpRegistry = React.useCallback(() => {
    if (treeDiagnosticsEnabled()) {
      setRegistryVersion((version) => version + 1)
    }
  }, [])

  // Live identity registry for duplicate detection (TR-DOM-08)
  const liveInstancesRef = React.useRef<Set<string>>(new Set())
  const registerItemInstance = React.useCallback(
    (id: string) => {
      if (liveInstancesRef.current.has(id)) {
        throw new Error(`Tree items must have unique values. Duplicate found: "${id}".`)
      }
      liveInstancesRef.current.add(id)
      bumpRegistry()
      return () => {
        liveInstancesRef.current.delete(id)
        bumpRegistry()
      }
    },
    [bumpRegistry]
  )

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
    registryVersion,
    bumpRegistry,
  }
}
