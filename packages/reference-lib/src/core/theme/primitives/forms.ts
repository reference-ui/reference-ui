import { buttonPrimitiveStyles } from './forms/button'
import { checkboxPrimitiveStyles } from './forms/checkbox'
import { formBasePrimitiveStyles } from './forms/base'
import { inputPrimitiveStyles } from './forms/inputs'
import { meterPrimitiveStyles } from './forms/meter'
import { radioPrimitiveStyles } from './forms/radio'

export * from './forms'

export const formPrimitiveStyles = {
  ...formBasePrimitiveStyles,
  ...buttonPrimitiveStyles,
  ...inputPrimitiveStyles,
  ...checkboxPrimitiveStyles,
  ...radioPrimitiveStyles,
  ...meterPrimitiveStyles,
} as const
