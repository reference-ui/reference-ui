import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
import { setupFocusVisible } from '../../core/theme/primitives/forms/focus-visible'

setupFocusVisible()

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
    // Runtime strip: the omitted ARIA surface must never reach the host,
    // even from JS callers the FieldProps Omit cannot stop. The data
    // attributes stay pinned after the spread so they cannot be overridden.
    const {
      role: _prohibitedRole,
      'aria-invalid': _prohibitedInvalid,
      'aria-disabled': _prohibitedDisabled,
      'aria-readonly': _prohibitedReadonly,
      'aria-required': _prohibitedRequired,
      'aria-errormessage': _prohibitedErrormessage,
      ...restProps
    } = props as Record<string, any>

    return (
      <Div
        ref={ref}
        {...restProps}
        data-reference-field=""
        data-status={status === 'warning' ? 'warning' : undefined}
      >
        {children}
      </Div>
    )
  }
)
