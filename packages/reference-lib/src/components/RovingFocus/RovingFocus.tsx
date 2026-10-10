/** RovingFocus root: composition only. `RovingFocusRoot` wires the four
 * kernel hooks (item registry, currentness, typeahead session, keyboard
 * dispatch) into the context value, then slots everything onto its single
 * authored child with no wrapper node. The `RovingFocus` compound pairs it
 * with Item, and the re-exports below keep every public seam (movement,
 * typeahead, direction, context) importable from this module exactly as
 * before the refactor. */

import * as React from 'react'
import { RovingFocusContext, useRovingFocusContext, type RovingFocusContextValue } from './context'
import { useCurrentness } from './hooks/use-currentness'
import { useItemRegistry } from './hooks/use-item-registry'
import { useRovingKeyboard } from './hooks/use-roving-keyboard'
import { useTypeaheadSession } from './hooks/use-typeahead-session'
import { RovingFocusItem } from './parts/Item'
import { chainSlotRefs, getChildRef } from './shared/refs'
import { assertSingleElementChild } from './slot/anatomy'
import { ROOT_EXCLUDED_PROPS, mergeSlotProps, type AnyProps } from './slot/merge'
import type { RovingFocusRootProps } from './types'

export { TypeaheadModel } from './typeahead/model'
export type { TypeaheadItem } from './typeahead/model'
export { shouldIgnoreTypeaheadKey } from './typeahead/guard'
export type { TypeaheadGuardEvent } from './typeahead/guard'
export { findGridTarget, groupGridRows } from './movement/grid'
export type { GridArrow, GridCell, GridCellRect } from './movement/grid'
export { getDirection } from './shared/direction'
export { useRovingFocusContext }
export type { RovingFocusContextValue }
export type {
  RovingFocusItemProps,
  RovingFocusOrientation,
  RovingFocusRootProps,
} from './types'

export const RovingFocusRoot = React.forwardRef<HTMLElement, RovingFocusRootProps>(
  function RovingFocusRoot(props, forwardedRef) {
    const { children, orientation = 'horizontal', loop = false, typeahead = false } = props
    const { registerItem, getOrderedItems, getEntry } = useItemRegistry()
    const { currentId, setCurrentId, claimInitialActiveId, focusItemById } = useCurrentness({
      getOrderedItems,
      getEntry,
    })
    const typeaheadModelRef = useTypeaheadSession()
    const { onItemKeyDown } = useRovingKeyboard({
      orientation,
      loop,
      typeaheadEnabled: typeahead,
      getOrderedItems,
      focusItemById,
      typeaheadModelRef,
    })

    const contextValue = React.useMemo<RovingFocusContextValue>(() => {
      return {
        orientation,
        loop,
        typeahead,
        currentId,
        setCurrentId,
        registerItem,
        focusItemById,
        onItemKeyDown,
        claimInitialActiveId,
      }
    }, [
      orientation,
      loop,
      typeahead,
      currentId,
      setCurrentId,
      registerItem,
      focusItemById,
      onItemKeyDown,
      claimInitialActiveId,
    ])

    assertSingleElementChild(children, 'Root')

    const child = children as React.ReactElement
    const merged = mergeSlotProps({
      partProps: props as unknown as AnyProps,
      child,
      exclude: ROOT_EXCLUDED_PROPS,
    })

    return (
      <RovingFocusContext.Provider value={contextValue}>
        {React.cloneElement(child, {
          ...merged,
          ref: chainSlotRefs(forwardedRef, getChildRef(child)),
        } as unknown as Record<string, unknown>)}
      </RovingFocusContext.Provider>
    )
  }
)

RovingFocusRoot.displayName = 'RovingFocus.Root'

export { RovingFocusItem }

export const RovingFocus = {
  Root: RovingFocusRoot,
  Item: RovingFocusItem,
}
