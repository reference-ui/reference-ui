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
  orientation?: RovingFocusOrientation
  loop?: boolean
  typeahead?: boolean
}

export type RovingFocusItemProps = ReferenceSlotPartProps & {
  id?: string
  disabled?: boolean
  textValue?: string
  /** Portable node resolver. React 17/18 strip `ref` through plain-function
   * children, so the kernel ref never resolves there (Menu `MenuTrigger`
   * precedent); consumers in that position resolve the mounted node by id
   * and hand it back here. The live ref always wins when set. */
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
