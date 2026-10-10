/**
 * Public Slot kernel types: visibility flags, registrations, and the context
 * object a compound component receives from `createSlotRootContext`. No JSX
 * and no logic live here; `registry/store` owns the store, `hooks/` owns the
 * React bindings, and this file is the vocabulary they share.
 */
import type * as React from 'react'
import type { SlotRoot } from './registry/store'

export interface SlotVisibility {
  visible?: boolean
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
  slotId: string
  element: React.ReactElement
  meta?: TMeta
  visibility?: SlotVisibility
}

export interface SlotRootContext<TMeta = unknown> {
  Provider: React.ComponentType<{
    children?: React.ReactNode
    root?: SlotRoot<TMeta>
  }>
  useRoot(): SlotRoot<TMeta>
  useSlotRegistration(
    options: UseSlotRegistrationOptions<TMeta>,
    deps?: React.DependencyList
  ): void
  useSlot(slotId: string): SlotRegistration<TMeta> | undefined
  useSlots(filter?: (slot: SlotRegistration<TMeta>) => boolean): SlotRegistration<TMeta>[]
}
