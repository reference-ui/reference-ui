import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'

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
  status?: FieldStatus
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  function Field({ children, status, ...props }, ref) {
    return (
      <Div
        ref={ref}
        data-reference-field=""
        data-status={status === 'warning' ? 'warning' : undefined}
        {...props}
      >
        {children}
      </Div>
    )
  }
)
