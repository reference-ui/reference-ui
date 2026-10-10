/**
 * Field root: a status-carrying host for form controls. The component strips
 * the prohibited ARIA surface through shared, then renders one Div with its
 * data attributes pinned after the spread so consumers cannot override them —
 * status warning lands as data-status, everything else passes through.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { setupFocusVisible } from '../../core/theme/primitives/forms/focus-visible'
import type { FieldProps } from './types'
import { stripProhibitedFieldProps } from './shared/strip-prohibited'

setupFocusVisible()

export type { FieldProps, FieldStatus } from './types'

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  function Field({ children, status, ...props }, ref) {
    const restProps = stripProhibitedFieldProps(props as Record<string, unknown>)

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
