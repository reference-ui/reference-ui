import * as React from 'react'

export interface DirectMemoProps {
  tone: 'loud' | 'quiet'
  children?: React.ReactNode
}

export default React.memo(function DirectMemoInner({
  tone,
  children,
}: DirectMemoProps): React.ReactElement {
  return (
    <button data-tone={tone}>
      {children}
    </button>
  )
})
