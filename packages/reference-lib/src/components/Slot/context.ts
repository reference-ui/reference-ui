/**
 * `createSlotRootContext` mints one isolated slot universe per compound
 * component: a private React context, a `Provider` that renders no host
 * node of its own, and the four hooks from `hooks/` bound to that context.
 * Call it once at module scope; each call gets its own provider, store
 * type, and registration namespace sharing only the id sequence.
 */
import * as React from 'react'
import { SlotRoot } from './registry/store'
import type { SlotRootContext } from './types'
import { createUseRoot } from './hooks/use-root'
import { createUseSlotRegistration } from './hooks/use-slot-registration'
import { createUseSlot } from './hooks/use-slot'
import { createUseSlots } from './hooks/use-slots'

export function createSlotRootContext<TMeta = unknown>(): SlotRootContext<TMeta> {
  const Context = React.createContext<SlotRoot<TMeta> | null>(null)
  const useRoot = createUseRoot<TMeta>(Context)

  function Provider({
    children,
    root: userRoot,
  }: {
    children?: React.ReactNode
    root?: SlotRoot<TMeta>
  }) {
    const rootRef = React.useRef<SlotRoot<TMeta> | null>(null)
    if (!rootRef.current) {
      rootRef.current = userRoot ?? new SlotRoot<TMeta>()
    }
    const root = userRoot ?? rootRef.current

    return React.createElement(Context.Provider, { value: root }, children)
  }

  const useSlotRegistration = createUseSlotRegistration<TMeta>(useRoot)
  const useSlot = createUseSlot<TMeta>(useRoot)
  const useSlots = createUseSlots<TMeta>(useRoot)

  return {
    Provider,
    useRoot,
    useSlotRegistration,
    useSlot,
    useSlots,
  }
}
