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
  /**
   * One open item at a time, or any number.
   * @default 'single'
   */
  expansion?: AccordionExpansion
  /**
   * Controlled open ids: `string | null` in single mode, `string[]` in
   * multiple mode. Omit it to let Accordion manage its own.
   */
  value?: AccordionValue
  /** Called when an item opens or closes, controlled or not. */
  onChange?: (value: AccordionValue) => void
  /**
   * Disables every item.
   * @default false
   */
  disabled?: boolean
  /**
   * Arrow-key movement between triggers. `'none'` turns it off. `'arrows'` is
   * accepted as `'headers'`.
   * @default 'headers'
   */
  keyboard?: AccordionKeyboard
}

export type AccordionItemProps = {
  /** Required. Unique within the Accordion. */
  id: string
  children?: React.ReactNode
  /**
   * Disables this item.
   * @default false
   */
  disabled?: boolean
  /**
   * Keep closed content findable by the browser's find-in-page.
   * @default false
   */
  hiddenUntilFound?: boolean
}
