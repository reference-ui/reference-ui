/**
 * Expansion store: the controlled-or-self-managed value behind the Accordion
 * context. An omitted value grows from the natural zero (null single, []
 * multiple); isItemOpen reads one id while registering render order for
 * multiple canonicalization, and toggleItem computes the next value through
 * the expansion policy before notifying.
 */
import * as React from 'react'
import type { AccordionExpansion, AccordionValue } from '../types'
import {
  isItemOpenInValue,
  nextMultipleValue,
  nextSingleValue,
} from '../expansion/policy'

export interface AccordionValueOptions {
  expansion: AccordionExpansion
  valueProp: AccordionValue | undefined
  onChange?: (value: AccordionValue) => void
  authoredItemIds: string[]
}

export interface AccordionValueApi {
  isItemOpen: (id: string) => boolean
  toggleItem: (id: string) => void
}

export function useAccordionValue({
  expansion,
  valueProp,
  onChange,
  authoredItemIds,
}: AccordionValueOptions): AccordionValueApi {
  const renderItemIdsRef = React.useRef<string[]>([])
  renderItemIdsRef.current = []

  // Self-managed store: omitted value expands via internal state from the natural zero.
  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState<AccordionValue>(() =>
    expansion === 'single' ? null : []
  )
  const currentValue = isControlled ? valueProp : internalValue

  const isItemOpen = React.useCallback(
    (id: string) => {
      if (!renderItemIdsRef.current.includes(id)) {
        renderItemIdsRef.current.push(id)
      }
      return isItemOpenInValue(expansion, currentValue, id)
    },
    [expansion, currentValue]
  )

  const toggleItem = React.useCallback(
    (id: string) => {
      let nextValue: AccordionValue
      if (expansion === 'single') {
        nextValue = nextSingleValue(currentValue, id)
      } else {
        const knownIds = Array.from(new Set([...authoredItemIds, ...renderItemIdsRef.current]))
        nextValue = nextMultipleValue(currentValue, id, knownIds)
      }

      if (!isControlled) {
        setInternalValue(nextValue)
      }
      onChange?.(nextValue)
    },
    [expansion, currentValue, isControlled, onChange, authoredItemIds]
  )

  return { isItemOpen, toggleItem }
}
