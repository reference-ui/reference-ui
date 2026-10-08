import * as React from 'react'
import { createSlotRootContext } from '../Slot'

// Shared part registry for DateField and DateField.Range: the same part
// components (`DateField.Trigger`, `DateField.Picker`) unfold under either
// host, so both providers register into one slot context. Slot ids:
// 'input' (single), 'start' / 'end' (range), 'trigger' / 'picker' (both).
export const {
  Provider: DateFieldSlotProvider,
  useSlotRegistration,
  useSlot,
} = createSlotRootContext<{ ref?: React.Ref<any> }>()
