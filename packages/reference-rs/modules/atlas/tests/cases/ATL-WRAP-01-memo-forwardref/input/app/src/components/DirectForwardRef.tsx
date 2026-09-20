import * as React from 'react'

export interface DirectForwardRefProps {
  size: 'sm' | 'md'
  children?: React.ReactNode
}

export default React.forwardRef<HTMLInputElement, DirectForwardRefProps>(
  function DirectForwardRefInner(
    { size, children }: DirectForwardRefProps,
    ref
  ): React.ReactElement {
    return (
      <label>
        <span>{children}</span>
        <input ref={ref} data-size={size} />
      </label>
    )
  }
)
