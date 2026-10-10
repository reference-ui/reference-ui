/**
 * usePartRegistry: nearest-context panel and handle registries. Panels and
 * handles register from layout effects and stay sorted in DOM order, so
 * array position always means document position — insert, remove, reorder
 * included. Nested groups register to their own root through the nearest
 * context. The revision counter republishes context after every
 * (un)registration, and the resort effect re-sorts on every commit so a
 * key-preserving reorder never pairs sizes with the wrong panel ids.
 */
import * as React from 'react'
import type { RegisteredHandle, RegisteredPanel } from '../context'
import { useIsomorphicLayoutEffect } from '../shared/refs'

export interface PartRegistry {
  panelsRef: React.MutableRefObject<RegisteredPanel[]>
  handlesRef: React.MutableRefObject<RegisteredHandle[]>
  partsRevision: number
  registerPanel: (panel: RegisteredPanel) => () => void
  registerHandle: (handle: RegisteredHandle) => () => void
  getPanelIndex: (key: string) => number
  getHandleIndex: (key: string) => number
}

export function usePartRegistry(): PartRegistry {
  // Nearest-context part registries: Panels and Handles register from
  // layout effects and stay sorted in DOM order, so array position always
  // means document position (insert/remove/reorder included). Nested
  // groups register to their own Root through the nearest context.
  const panelsRef = React.useRef<RegisteredPanel[]>([])
  const handlesRef = React.useRef<RegisteredHandle[]>([])
  const [partsRevision, setPartsRevision] = React.useState(0)

  const sortParts = React.useCallback(() => {
    panelsRef.current.sort((a, b) => {
      if (!a.element || !b.element) return 0
      const pos = a.element.compareDocumentPosition(b.element)
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    })
    handlesRef.current.sort((a, b) => {
      if (!a.element || !b.element) return 0
      const pos = a.element.compareDocumentPosition(b.element)
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    })
  }, [])

  const registerPanel = React.useCallback(
    (panel: RegisteredPanel) => {
      const existingIndex = panelsRef.current.findIndex((p) => p.key === panel.key)
      if (existingIndex >= 0) {
        panelsRef.current[existingIndex] = panel
      } else {
        panelsRef.current.push(panel)
      }
      sortParts()
      setPartsRevision((r) => r + 1)
      return () => {
        panelsRef.current = panelsRef.current.filter((p) => p.key !== panel.key)
        sortParts()
        setPartsRevision((r) => r + 1)
      }
    },
    [sortParts]
  )

  const registerHandle = React.useCallback(
    (handle: RegisteredHandle) => {
      const existingIndex = handlesRef.current.findIndex((h) => h.key === handle.key)
      if (existingIndex >= 0) {
        handlesRef.current[existingIndex] = handle
      } else {
        handlesRef.current.push(handle)
      }
      sortParts()
      setPartsRevision((r) => r + 1)
      return () => {
        handlesRef.current = handlesRef.current.filter((h) => h.key !== handle.key)
        sortParts()
        setPartsRevision((r) => r + 1)
      }
    },
    [sortParts]
  )

  const getPanelIndex = React.useCallback(
    (key: string) => panelsRef.current.findIndex((p) => p.key === key),
    []
  )
  const getHandleIndex = React.useCallback(
    (key: string) => handlesRef.current.findIndex((h) => h.key === key),
    []
  )

  // DOM order is the source of truth for array position: a
  // key-preserving reorder moves parts without (un)registering, so the
  // registries must re-sort on every commit — before the positional reads
  // below — or a transient commit pairs sizes with the wrong Panel ids.
  // Sorts in place (cheap, idempotent); only an actual order change
  // re-renders, pre-paint, so the transient render never shows.
  useIsomorphicLayoutEffect(() => {
    const orderKey = () =>
      `${panelsRef.current.map((part) => part.key).join(',')}|${handlesRef.current.map((part) => part.key).join(',')}`
    const before = orderKey()
    sortParts()
    if (orderKey() !== before) setPartsRevision((revision) => revision + 1)
  })

  return {
    panelsRef,
    handlesRef,
    partsRevision,
    registerPanel,
    registerHandle,
    getPanelIndex,
    getHandleIndex,
  }
}
