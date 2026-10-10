/** Keyboard dispatch for a RovingFocus root. `useRovingKeyboard` owns the
 * `onItemKeyDown` entry every Item's kernel keydown handler calls: modifier
 * and prevention guards first, then navigation keys (linear arrows and
 * endpoints via movement/, visual-grid arrows via geometry), then printable
 * keys through the typeahead session when enabled. Nested composites compose
 * through prevention — an inner handled key arrives already prevented and
 * the outer kernel stands down. */

import * as React from 'react'
import { isItemAvailable } from '../collection/availability'
import { findGridTarget, type GridCell } from '../movement/grid'
import { resolveLinearTarget } from '../movement/linear'
import { resolveEntryNode } from '../shared/nodes'
import { getDirection } from '../shared/direction'
import { shouldIgnoreTypeaheadKey } from '../typeahead/guard'
import { TypeaheadModel, type TypeaheadItem } from '../typeahead/model'
import { getItemSearchText } from '../typeahead/text'
import type { ItemEntry, RovingFocusOrientation } from '../types'

export interface RovingKeyboardOptions {
  orientation: RovingFocusOrientation
  loop: boolean
  typeaheadEnabled: boolean
  getOrderedItems: () => ItemEntry[]
  focusItemById: (id: string) => void
  typeaheadModelRef: React.RefObject<TypeaheadModel>
}

export function useRovingKeyboard(options: RovingKeyboardOptions): {
  onItemKeyDown: (e: React.KeyboardEvent<HTMLElement>, id: string) => void
} {
  const {
    orientation,
    loop,
    typeaheadEnabled,
    getOrderedItems,
    focusItemById,
    typeaheadModelRef,
  } = options

  const handle1DNavigation = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>, currentIndex: number, enabledItems: ItemEntry[]) => {
      const currentEntry = enabledItems[currentIndex]
      const isRtl = getDirection(currentEntry ? resolveEntryNode(currentEntry) : null) === 'rtl'
      const { targetIndex, handled } = resolveLinearTarget({
        key: e.key,
        orientation,
        isRtl,
        currentIndex,
        count: enabledItems.length,
        loop,
      })
      if (handled) {
        e.preventDefault()
      }
      if (targetIndex !== currentIndex && enabledItems[targetIndex]) {
        focusItemById(enabledItems[targetIndex].id)
      }
    },
    [orientation, loop, focusItemById]
  )

  // Visual-grid arrows (FEATURES #1): rects re-read per keystroke so CSS
  // reflow is observable (RF-GRID-07); geometry is direction-free so RTL
  // reversal falls out of the layout (RF-GRID-06).
  const handleGridNavigation = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>, id: string, orderedItems: ItemEntry[]) => {
      const arrow =
        e.key === 'ArrowLeft'
          ? 'left'
          : e.key === 'ArrowRight'
            ? 'right'
            : e.key === 'ArrowUp'
              ? 'up'
              : e.key === 'ArrowDown'
                ? 'down'
                : null
      if (arrow === null) return
      e.preventDefault()
      const cells: GridCell[] = []
      orderedItems.forEach((entry, domIndex) => {
        const el = resolveEntryNode(entry)
        if (!el) return
        cells.push({
          id: entry.id,
          rect: el.getBoundingClientRect(),
          domIndex,
          available: isItemAvailable(entry),
        })
      })
      const targetId = findGridTarget(cells, id, arrow, { loop })
      if (targetId) {
        focusItemById(targetId)
      }
    },
    [loop, focusItemById]
  )

  const handleTypeahead = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>, activeId: string, orderedItems: ItemEntry[]) => {
      if (shouldIgnoreTypeaheadKey(e)) return
      // Space only continues an active search; it never starts one, so buttons
      // keep native Space activation when no buffer is active.
      if (e.key === ' ' && !typeaheadModelRef.current.hasBuffer()) return

      e.preventDefault()

      const typeaheadItems: TypeaheadItem[] = orderedItems.map(item => ({
        id: item.id,
        text: getItemSearchText(item),
        disabled: item.disabled,
        hidden: !isItemAvailable(item),
      }))

      const matchId = typeaheadModelRef.current.handleKey(e.key, activeId, typeaheadItems)
      if (matchId && matchId !== activeId) {
        focusItemById(matchId)
      }
    },
    [focusItemById, typeaheadModelRef]
  )

  const onItemKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>, id: string) => {
      if (e.defaultPrevented) return
      if (e.ctrlKey || e.altKey || e.metaKey) return

      const orderedItems = getOrderedItems()
      const enabledItems = orderedItems.filter(isItemAvailable)
      const currentIndex = enabledItems.findIndex(i => i.id === id)
      if (currentIndex === -1) return

      if (
        [
          'ArrowRight',
          'ArrowLeft',
          'ArrowDown',
          'ArrowUp',
          'Home',
          'End',
          'PageUp',
          'PageDown',
        ].includes(e.key)
      ) {
        // Home/End/PageUp/PageDown are whole-composite endpoints in every
        // orientation including grids (RF-GRID-08); arrows go 2D only for
        // orientation="both" (RF-GRID-01).
        if (
          orientation === 'both' &&
          (e.key === 'ArrowRight' ||
            e.key === 'ArrowLeft' ||
            e.key === 'ArrowDown' ||
            e.key === 'ArrowUp')
        ) {
          handleGridNavigation(e, id, orderedItems)
        } else {
          handle1DNavigation(e, currentIndex, enabledItems)
        }
      } else if (typeaheadEnabled) {
        handleTypeahead(e, id, orderedItems)
      }
    },
    [getOrderedItems, handle1DNavigation, handleGridNavigation, handleTypeahead, typeaheadEnabled, orientation]
  )

  return React.useMemo(() => ({ onItemKeyDown }), [onItemKeyDown])
}
