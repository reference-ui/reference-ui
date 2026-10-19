// Form primitive styles: the merged map over every forms/ group.
// It takes the eight group maps and emits formPrimitiveStyles, the one spread
// baseSystem consumes for form elements.
import { buttonPrimitiveStyles } from './forms/button'
import { checkboxPrimitiveStyles } from './forms/checkbox'
import { fieldSurfaceStyles } from './forms/field'
import { formBasePrimitiveStyles } from './forms/base'
import { inputPrimitiveStyles } from './forms/inputs'
import { meterPrimitiveStyles } from './forms/meter'
import { radioPrimitiveStyles } from './forms/radio'
import { switchPrimitiveStyles } from './forms/switch'

export * from './forms'

export const formPrimitiveStyles = {
  ...formBasePrimitiveStyles,
  ...buttonPrimitiveStyles,
  ...inputPrimitiveStyles,
  ...checkboxPrimitiveStyles,
  ...radioPrimitiveStyles,
  ...meterPrimitiveStyles,
  ...fieldSurfaceStyles,
  ...switchPrimitiveStyles,
} as const

