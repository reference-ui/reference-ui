/**
 * `createUseRoot` binds `useRoot` to one slot context: it reads the root
 * from context and throws outside the provider so every hook built on it
 * fails loudly instead of registering into a phantom store. The factory
 * shape keeps each `createSlotRootContext` call an isolated universe.
 */
import * as React from 'react'
import type { SlotRoot } from '../registry/store'

export function createUseRoot<TMeta>(
  Context: React.Context<SlotRoot<TMeta> | null>
): () => SlotRoot<TMeta> {
  function useRoot(): SlotRoot<TMeta> {
    const root = React.useContext(Context)
    if (!root) {
      throw new Error(
        'Reference UI: useRoot must be used within a corresponding Slot.Provider'
      )
    }
    return root
  }
  return useRoot
}
