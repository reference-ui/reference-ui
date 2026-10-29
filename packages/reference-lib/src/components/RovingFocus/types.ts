/** RovingFocus public prop and state types. Owns the orientation union, the
 * transparent slot surface both parts extend, the Root/Item prop
 * intersections, and the internal registry entry shape every kernel module
 * reads. No JSX, no logic — pure declarations so any folder can import them
 * without pulling behavior. */

import type * as React from 'react'
import type { PrimitiveProps } from '@reference-ui/react'

export type RovingFocusOrientation = 'horizontal' | 'vertical' | 'both'

// Transparent-part surface (components README `ReferenceSlotPartProps`): common
// DOM events/ARIA plus the shared StyleProps surface, exactly one element
// child, one ref. Local alias per the Listbox `ReferencePartProps` precedent;
// no shared module owns this name yet.
export type ReferenceSlotPartProps = Omit<PrimitiveProps<'div'>, 'children'> & {
  children: React.ReactElement
  ref?: React.Ref<HTMLElement>
}

export type RovingFocusRootProps = ReferenceSlotPartProps & {
  /**
   * Which arrow keys move focus. `both` moves through a grid by layout.
   * @default 'horizontal'
   */
  orientation?: RovingFocusOrientation
  /**
   * Wrap from the last item to the first and back.
   * @default false
   */
  loop?: boolean
  /**
   * Typing moves focus to the next item whose text starts with the typed characters.
   * @default false
   */
  typeahead?: boolean
}

export type RovingFocusItemProps = ReferenceSlotPartProps & {
  /**
   * Stable identity for the item within the group.
   * @default generated
   */
  id?: string
  /**
   * Removes the item from arrow-key movement and the Tab stop.
   * @default false
   */
  disabled?: boolean
  /**
   * Text matched by typeahead.
   * @default the item's text content
   */
  textValue?: string
  /** Returns the item's element when its child can't take a ref. The live ref wins when set. */
  getNode?: () => HTMLElement | null
}

/** One registered Item: identity, liveness, and the two node channels. */
export interface ItemEntry {
  id: string
  ref: React.RefObject<HTMLElement | null>
  disabled: boolean
  textValue?: string
  getNode?: () => HTMLElement | null
}
