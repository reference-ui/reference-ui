/**
 * Public Slot kernel types: visibility flags, registrations, and the context
 * object a compound component receives from `createSlotRootContext`. No JSX
 * and no logic live here; `registry/store` owns the store, `hooks/` owns the
 * React bindings, and this file is the vocabulary they share.
 */
import type * as React from 'react'
import type { SlotRoot } from './registry/store'

export interface SlotVisibility {
  /** `false` resolves to `'unmounted'`. */
  visible?: boolean
  /** `true` resolves to `'hidden'`. Wins over `visible`. */
  hidden?: boolean
}

export type ResolvedSlotVisibility = 'visible' | 'hidden' | 'unmounted'

export interface SlotRegistration<TMeta = unknown> {
  element: React.ReactElement
  slotId: string
  meta?: TMeta
  visibility?: SlotVisibility
}

export interface UseSlotRegistrationOptions<TMeta = unknown> {
  /** The region to fill. */
  slotId: string
  /** What the layout renders. */
  element: React.ReactElement
  /** Data for the layout to read. */
  meta?: TMeta
  /** `hidden: true` resolves to `'hidden'`; `visible: false` to `'unmounted'`. */
  visibility?: SlotVisibility
}

export interface SlotRootContext<TMeta = unknown> {
  /** Scopes a registry to one component tree. Renders no element. */
  Provider: React.ComponentType<{
    children?: React.ReactNode
    root?: SlotRoot<TMeta>
  }>
  /** The registry itself. */
  useRoot(): SlotRoot<TMeta>
  /** Registers an element while the calling part is mounted. */
  useSlotRegistration(
    options: UseSlotRegistrationOptions<TMeta>,
    deps?: React.DependencyList
  ): void
  /** The first registration with that id. */
  useSlot(slotId: string): SlotRegistration<TMeta> | undefined
  /** Every registration that matches, in registration order. */
  useSlots(filter?: (slot: SlotRegistration<TMeta>) => boolean): SlotRegistration<TMeta>[]
}
