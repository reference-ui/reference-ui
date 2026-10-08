import * as React from 'react'

export interface FancyButtonProps {
  variant: 'solid' | 'ghost'
  disabled?: boolean
  children?: React.ReactNode
}

export const FancyButton = React.memo(function FancyButtonInner({
  variant,
  disabled,
  children,
}: FancyButtonProps): React.ReactElement {
  return (
    <button data-variant={variant} disabled={disabled}>
      {children}
    </button>
  )
})
