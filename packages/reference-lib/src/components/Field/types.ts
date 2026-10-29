/**
 * Field's public contract: the FieldStatus union the root accepts today
 * (warning only) and the FieldProps div surface minus the role and validity
 * ARIA the root manages itself. Kept free of JSX and logic so consumers and
 * the type tests can import the shape without mounting anything.
 */
import type { PrimitiveProps } from '@reference-ui/react'

export type FieldStatus = 'warning'

export type FieldProps = Omit<
  PrimitiveProps<'div'>,
  | 'role'
  | 'aria-invalid'
  | 'aria-disabled'
  | 'aria-readonly'
  | 'aria-required'
  | 'aria-errormessage'
> & {
  /** Paints the warning bezel. It does not mark the control invalid. */
  status?: FieldStatus
}
