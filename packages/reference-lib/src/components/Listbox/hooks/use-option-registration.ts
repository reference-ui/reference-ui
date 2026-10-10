/**
 * Listbox option registration: the render-time identity claim plus the
 * three commit effects — combobox entry registration when nested,
 * pending-virtual focus resolution when the scrolled window lands, and
 * listbox registry subscription. Deps mirror the original inline effects
 * exactly; registration re-subscribes whenever identity inputs change.
 */
import * as React from 'react'
import type { ComboboxContextValue } from '../../Combobox/combobox-context'
import type { ListboxContextValue } from '../types'

export interface OptionRegistration {
  context: ListboxContextValue | null
  combobox: ComboboxContextValue | null
  value: string
  optionId: string
  index: number | undefined
  isDisabled: boolean
  textValue: string | undefined
  children: React.ReactNode
  optionRef: React.RefObject<HTMLDivElement | null>
}

export function useOptionRegistration({
  context,
  combobox,
  value,
  optionId,
  index,
  isDisabled,
  textValue,
  children,
  optionRef,
}: OptionRegistration) {
  // LB-DOM-06: Register and check uniqueness during render
  context?.registerRenderValue(value, optionId)

  // Combobox option registration
  React.useEffect(() => {
    if (combobox?.registerOption) {
      return combobox.registerOption({
        value,
        id: optionId,
        node:
          optionRef.current ??
          (typeof document !== 'undefined' ? document.getElementById(optionId) : null),
        disabled: isDisabled,
        textValue: textValue ?? (typeof children === 'string' ? children : undefined),
      })
    }
  }, [combobox, value, optionId, isDisabled, textValue, children])

  // Virtual option mounting & pending focus resolution
  React.useLayoutEffect(() => {
    if (context && context.pendingVirtualIndex === index && optionRef.current) {
      context.setPendingVirtualIndex(null)
      optionRef.current.focus()
    }
  }, [context, index])

  // Listbox option registration
  React.useEffect(() => {
    if (context?.registerOption) {
      return context.registerOption({
        value,
        id: optionId,
        index,
        disabled: isDisabled,
        textValue: textValue ?? (typeof children === 'string' ? children : undefined),
        ref: optionRef,
      })
    }
  }, [context, value, optionId, index, isDisabled, textValue, children])
}
