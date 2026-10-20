/**
 * Accordion's public contract: the expansion and keyboard modes, the
 * single/multiple value union, and the root and item prop shapes. Kept free
 * of JSX and logic so the root, the item part, and consumers can import the
 * shape without mounting the collection.
 */
import type * as React from 'react'
import type {
  PrimitiveProps,
  PrimitiveElement,
  PrimitiveTag,
} from '@reference-ui/react'

type AccordionReferencePartProps<Tag extends PrimitiveTag> =
  PrimitiveProps<Tag> & React.RefAttributes<PrimitiveElement<Tag>>

export type AccordionExpansion = 'single' | 'multiple'
export type AccordionKeyboard = 'headers' | 'none' | 'arrows'
export type AccordionValue = string | string[] | null

export interface AccordionProps
  extends Omit<AccordionReferencePartProps<'div'>, 'onChange' | 'value' | 'defaultValue'> {
  children?: React.ReactNode
  expansion?: AccordionExpansion
  /** Optional value. Single uses string|null, multiple uses string[]. Omitted = self-managed from the natural zero state (null single, [] multiple). */
  value?: AccordionValue
  /** Optional notification, emitted in both controlled and self-managed modes. */
  onChange?: (value: AccordionValue) => void
  disabled?: boolean
  /** 'arrows' is accepted as an alias of 'headers' (base-API compatibility). */
  keyboard?: AccordionKeyboard
}

export type AccordionItemProps = {
  id: string
  children?: React.ReactNode
  disabled?: boolean
  /**
   * AC-FIND: default `hidden` passthrough for the item Collapsible. Closed
   * item Content stays mounted but hidden (`hidden="until-found"`) so
   * browser find can match it; a `beforematch` reveal expands the item
   * through existing policy (single mode swaps the open item, multiple
   * adds) with enter motion skipped once. Setting this prop IS the opt-in —
   * there is no separate `findExpansion` switch (see README).
   */
  hiddenUntilFound?: boolean
}
