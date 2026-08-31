import * as React from 'react'

export interface FieldProps extends React.ComponentPropsWithoutRef<'div'> {
  status?: 'warning'
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  function Field({ children, status, style, className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-reference-field=""
        data-status={status === 'warning' ? 'warning' : undefined}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          position: 'relative',
          border: '1px solid #ccc',
          borderRadius: '6px',
          padding: '4px 8px',
          background: '#fff',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
