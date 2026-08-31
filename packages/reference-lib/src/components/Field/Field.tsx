import * as React from 'react'
import { Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'

export type FieldProps = PrimitiveProps<'div'> & {
  status?: 'warning' | string
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  function Field({ children, status, style, className, ...props }, ref) {
    return (
      <Div
        ref={ref}
        data-reference-field=""
        data-status={status === 'warning' ? 'warning' : status || undefined}
        display="inline-flex"
        alignItems="center"
        position="relative"
        border="1px solid"
        borderColor={status === 'warning' ? 'colors.amber.500' : 'ui.field.border'}
        borderRadius="sm"
        px="3r"
        py="1.5r"
        bg="ui.field.background"
        color="ui.field.foreground"
        _hover={{
          borderColor: 'ui.field.borderHover',
        }}
        _focusWithin={{
          outline: '2px solid',
          outlineColor: 'ui.focus.ring',
          outlineOffset: '2px',
        }}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </Div>
    )
  }
)
