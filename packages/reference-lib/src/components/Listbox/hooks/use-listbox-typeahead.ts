/**
 * Listbox's typeahead: the one-second buffer timer plus the standalone
 * (live-DOM) and virtual (logical-item) match handlers. Buffer advance
 * and wrapping match order live in typeahead/search; this hook owns the
 * timer, resolves the matched record, and moves focus — scrolling the
 * virtual window when the target is not mounted.
 */
import * as React from 'react'
import {
  advanceTypeaheadQuery,
  findTypeaheadMatchAfter,
  findTypeaheadMatchFrom,
} from '../typeahead/search'
import type { ListboxSession } from './use-listbox-session'
import type { ListboxVirtualAdapter, OptionRecord, VirtualFocusItem } from '../types'

export interface ListboxTypeahead {
  typeaheadHasBuffer: () => boolean
  handleStandaloneTypeahead: (char: string, currentValue: string) => void
  handleVirtualTypeahead: (char: string, currentIndex: number) => void
}

function armTypeaheadTimer(session: Pick<ListboxSession, 'typeaheadTimerRef' | 'typeaheadBufferRef'>) {
  if (session.typeaheadTimerRef.current) clearTimeout(session.typeaheadTimerRef.current)
  session.typeaheadTimerRef.current = setTimeout(() => {
    session.typeaheadBufferRef.current = ''
  }, 1000)
}

export function useListboxTypeahead(
  session: ListboxSession,
  getOrderedOptions: () => OptionRecord[],
  virtual: ListboxVirtualAdapter | undefined
): ListboxTypeahead {
  const { typeaheadBufferRef, collator, setFocusedValue, setPendingVirtualIndex, optionsMapRef } = session

  const typeaheadHasBuffer = React.useCallback(() => {
    return typeaheadBufferRef.current.length > 0
  }, [])

  const handleStandaloneTypeahead = React.useCallback(
    (char: string, currentValue: string) => {
      armTypeaheadTimer(session)

      const ordered = getOrderedOptions().filter(o => !o.disabled)
      if (ordered.length === 0) return

      const currentIdx = ordered.findIndex(o => o.value === currentValue)
      const currentItemText =
        currentIdx !== -1 ? ordered[currentIdx].textValue || ordered[currentIdx].value : ''
      const { query, cycling } = advanceTypeaheadQuery(
        typeaheadBufferRef.current,
        char,
        currentItemText,
        collator
      )
      typeaheadBufferRef.current = query

      const texts = ordered.map(o => o.textValue || o.value)
      const matchPos = cycling
        ? findTypeaheadMatchAfter(texts, query, currentIdx, collator)
        : findTypeaheadMatchFrom(texts, query, currentIdx !== -1 ? currentIdx : 0, collator)
      const match = matchPos !== -1 ? ordered[matchPos] : undefined

      if (match && match.ref.current) {
        setFocusedValue(match.value)
        match.ref.current.focus()
      }
    },
    [getOrderedOptions, collator]
  )

  const handleVirtualTypeahead = React.useCallback(
    (char: string, currentIndex: number) => {
      if (!virtual) return
      const items = virtual.items
      if (items.length === 0) return

      armTypeaheadTimer(session)

      const enabledIndices: number[] = []
      items.forEach((item: VirtualFocusItem, idx: number) => {
        if (!item.disabled) enabledIndices.push(idx)
      })

      const currentItem = items[currentIndex]
      const currentItemText = currentItem ? currentItem.textValue || currentItem.value : ''
      const { query, cycling } = advanceTypeaheadQuery(
        typeaheadBufferRef.current,
        char,
        currentItemText,
        collator
      )
      typeaheadBufferRef.current = query

      const texts = enabledIndices.map(idx => {
        const item = items[idx]
        return item.textValue || item.value
      })
      const afterPos = enabledIndices.filter(i => i <= currentIndex).length - 1
      const fromPos = enabledIndices.filter(i => i < currentIndex).length
      const matchPos = cycling
        ? findTypeaheadMatchAfter(texts, query, afterPos, collator)
        : findTypeaheadMatchFrom(texts, query, fromPos, collator)
      const matchIndex = matchPos !== -1 ? enabledIndices[matchPos] : undefined

      if (matchIndex != null) {
        setFocusedValue(items[matchIndex].value)
        const mounted = optionsMapRef.current.get(items[matchIndex].value)
        if (mounted?.ref.current && mounted.ref.current.isConnected) {
          setPendingVirtualIndex(null)
          mounted.ref.current.focus()
        } else {
          setPendingVirtualIndex(matchIndex)
          virtual.scrollToIndex(matchIndex)
        }
      }
    },
    [virtual, collator]
  )

  return { typeaheadHasBuffer, handleStandaloneTypeahead, handleVirtualTypeahead }
}
