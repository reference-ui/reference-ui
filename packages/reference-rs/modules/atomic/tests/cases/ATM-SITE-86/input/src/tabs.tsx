import { Div } from '@reference-ui/react'

declare const useTabsContext: () => { value: string; disabled?: boolean } | null

// Verbatim Tabs Tab guards: the ternary drops its comparison arm beside
// `false`, the coalesce chain drops both dynamic operands beside `false`.
// Both bindings keep their kept leaf for values and stay open as tests.
export function Tab({ value, disabledProp }: { value: string; disabledProp?: boolean }) {
  const context = useTabsContext()
  const isSelected = context ? context.value === value : false
  const isDisabled = disabledProp ?? context?.disabled ?? false
  return (
    <Div
      borderBottom={isSelected ? '3px solid' : '3px solid transparent'}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      opacity={isDisabled ? 0.5 : 1}
    />
  )
}
